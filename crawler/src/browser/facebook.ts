import { Page } from 'playwright';
import { RawPost } from '../models/types';

/**
 * Recursively walk a parsed JSON tree to find (postId → creation_time) pairs.
 * This properly follows the JSON structure, passing ancestor IDs down to children,
 * so that a child node's creation_time gets correctly mapped to its parent's post ID.
 */
function collectTimestampsFromJson(
    obj: any,
    result: Record<string, string>,
    ancestorIds: string[] = [],
    depth: number = 0
): void {
    if (depth > 30 || !obj || typeof obj !== 'object') return;

    const currentIds = [...ancestorIds];

    // Collect numeric IDs (10+ digits) from well-known fields
    for (const field of ['id', 'post_id', 'story_id', 'feedback_id', 'legacy_id']) {
        const val = obj[field];
        if (typeof val === 'string' && /^\d{10,}$/.test(val)) {
            currentIds.push(val);
        }
        // Sometimes id is a number, not string
        if (typeof val === 'number' && val > 1_000_000_000) {
            currentIds.push(String(val));
        }
    }

    // Extract numeric post IDs from URL-like string values
    for (const key of Object.keys(obj)) {
        if (typeof obj[key] !== 'string') continue;
        const s = obj[key];

        const patterns = [
            /\/(?:posts|permalink)\/(\d{10,})/,
            /set=(?:pcb|gm)\.(\d{10,})/,
            /story_fbid=(\d{10,})/,
            /fbid=(\d{10,})/,
        ];
        for (const pat of patterns) {
            const m = s.match(pat);
            if (m?.[1]) currentIds.push(m[1]);
        }
    }

    // If creation_time found at this level, map it to all collected IDs
    if (typeof obj.creation_time === 'number' && obj.creation_time > 1_000_000_000) {
        const iso = new Date(obj.creation_time * 1000).toISOString();
        for (const id of new Set(currentIds)) {
            if (!result[id]) result[id] = iso;
        }
    }

    // Recurse into children, passing down ancestor IDs
    for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (Array.isArray(val)) {
            for (const item of val) {
                collectTimestampsFromJson(item, result, currentIds, depth + 1);
            }
        } else if (val && typeof val === 'object') {
            collectTimestampsFromJson(val, result, currentIds, depth + 1);
        }
    }
}

/**
 * Fallback: use regex with wider search radius to find (postId → creation_time) pairs.
 * Used when JSON parsing fails (e.g., malformed/concatenated JSON without newlines).
 */
function extractTimestampsByRegex(text: string, result: Record<string, string>): void {
    const timeRegex = /"creation_time"\s*:\s*(\d+)/g;
    let match;
    while ((match = timeRegex.exec(text)) !== null) {
        const timestamp = parseInt(match[1]);
        if (timestamp < 1_000_000_000) continue; // Skip invalid timestamps
        const pos = match.index;
        // Use a much wider search radius (±2000 chars) for better matching
        const chunk = text.substring(Math.max(0, pos - 2000), Math.min(text.length, pos + 2000));

        const idPatterns = [
            /\/(?:posts|permalink)\/(\d{10,})/g,
            /set=(?:pcb|gm)\.(\d{10,})/g,
            /"(?:id|post_id|story_id|legacy_id|feedback_id)"\s*:\s*"(\d{10,})"/g,
            /(?:story_fbid|fbid)=(\d{10,})/g,
        ];

        for (const pattern of idPatterns) {
            pattern.lastIndex = 0; // Reset regex state
            let idMatch;
            while ((idMatch = pattern.exec(chunk)) !== null) {
                if (idMatch[1] && !result[idMatch[1]]) {
                    result[idMatch[1]] = new Date(timestamp * 1000).toISOString();
                }
            }
        }
    }
}

export async function extractPosts(page: Page, maxScrolls: number, groupUrl: string): Promise<RawPost[]> {
    const allPosts: RawPost[] = [];
    const seenTexts = new Set<string>();
    let stats = { totalBlocks: 0, valid: 0 };

    const timestampMap: Record<string, string> = {};

    // 1. Lắng nghe các request GraphQL từ Facebook để lấy thời gian tạo bài viết thực tế
    page.on('response', async response => {
        const url = response.url();
        if (url.includes('/api/graphql/')) {
            try {
                const text = await response.text();
                if (!text.includes('creation_time')) return;

                // Facebook often returns multiple JSON objects concatenated per line
                const lines = text.split('\n');
                let jsonParsed = false;

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const json = JSON.parse(line);
                        collectTimestampsFromJson(json, timestampMap);
                        jsonParsed = true;
                    } catch {
                        // Not valid JSON line, will fallback below
                    }
                }

                // If JSON parsing didn't work for any line, fallback to regex
                if (!jsonParsed) {
                    extractTimestampsByRegex(text, timestampMap);
                }
            } catch (e) {
                // Bỏ qua lỗi kết nối / đọc nội dung
            }
        }
    });

    // Chờ 2 giây cho script tải ban đầu chạy xong
    await page.waitForTimeout(2000);

    // 2. Phân tích HTML ban đầu để trích xuất timestamps từ dữ liệu nhúng sẵn
    try {
        const html = await page.content();

        // Thử parse các JSON blob từ thẻ <script>
        const scriptRegex = />\s*(\{[^<]{100,}?"creation_time"\s*:\s*\d+[^<]*\})\s*</g;
        let scriptMatch;
        while ((scriptMatch = scriptRegex.exec(html)) !== null) {
            try {
                const json = JSON.parse(scriptMatch[1]);
                collectTimestampsFromJson(json, timestampMap);
            } catch {
                // JSON parse failed for this blob, try regex on it
                extractTimestampsByRegex(scriptMatch[1], timestampMap);
            }
        }

        // Fallback: dùng regex rộng trên toàn bộ HTML
        extractTimestampsByRegex(html, timestampMap);

    } catch (e) {
        console.error('⚠️ Lỗi khi trích xuất timestamp từ HTML ban đầu:', e);
    }
    console.log(`📊 Đã thu thập ${Object.keys(timestampMap).length} timestamp từ dữ liệu ban đầu.`);

    for (let i = 0; i < maxScrolls; i++) {
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
            buttons.forEach(btn => {
                const text = btn.textContent?.trim().toLowerCase();
                if (text === 'xem thêm' || text === 'see more') {
                    try { (btn as any).click(); } catch (e) { }
                }
            });
        });
        await page.waitForTimeout(500);

        const batch = await page.evaluate((groupUrl: string) => {
            const results: RawPost[] = [];
            const feed = document.querySelector('div[role="feed"]');
            if (!feed) return results;

            Array.from(feed.children).forEach(container => {
                const textNodes = Array.from(container.querySelectorAll('div[dir="auto"]'));
                if (textNodes.length === 0) return;

                let text = textNodes.map(n => n.textContent).join('\n');
                text = text.replace(/Like\nComment\nShare.*/gs, '')
                           .replace(/Thích\nBình luận\nChia sẻ.*/gs, '')
                           .replace(/All reactions:.*/gs, '')
                           .replace(/FacebookFacebook.*/gs, '')
                           .replace(/See translation.*/gs, '')
                           .trim();

                if (text.length < 15) return;

                let imageUrl = '';
                for (const img of Array.from(container.querySelectorAll('img'))) {
                    const src = img.getAttribute('src') || '';
                    if ((src.startsWith('https://scontent') || src.startsWith('https://external')) && !src.includes('emoji')) {
                        imageUrl = src;
                        break;
                    }
                }

                let postUrl = '';
                let postId = '';

                // Ưu tiên 1: Tìm link bài viết trực tiếp (permalink hoặc posts) để lấy ID thật của bài viết
                for (const link of Array.from(container.querySelectorAll('a[href]'))) {
                    const href = link.getAttribute('href') || '';
                    if (href.includes('user/') || href.includes('/profile') || href.includes('profile.php')) continue;
                    const postMatch = href.match(/\/(?:posts|permalink)\/(\d{10,})/);
                    if (postMatch && postMatch[1]) {
                        postId = postMatch[1];
                        postUrl = href.startsWith('http') ? href : `https://www.facebook.com${href}`;
                        postUrl = postUrl.split('?')[0];
                        break;
                    }
                }

                // Ưu tiên 2: Tìm link ảnh nhưng trích xuất ID set của bài viết (ví dụ set=pcb.POST_ID hoặc set=gm.POST_ID)
                if (!postId) {
                    for (const link of Array.from(container.querySelectorAll('a[href]'))) {
                        const href = link.getAttribute('href') || '';
                        if (href.includes('user/') || href.includes('/profile') || href.includes('profile.php')) continue;
                        const setMatch = href.match(/[?&]set=(?:pcb|gm)\.(\d{10,})/);
                        if (setMatch && setMatch[1]) {
                            postId = setMatch[1];
                            postUrl = href.startsWith('http') ? href : `https://www.facebook.com${href}`;
                            break;
                        }
                    }
                }

                // Ưu tiên 3: Nếu không tìm thấy, dùng regex rộng hơn để tìm chuỗi số 10+ ký tự (nhưng bỏ qua ID ảnh đơn lẻ fbid= nếu có set=pcb)
                if (!postId) {
                    const idRegex = /(?:story_fbid=|fbid=|multi_permalinks=|set=[a-z]+\.)?(\\d{10,})/;
                    for (const link of Array.from(container.querySelectorAll('a[href]'))) {
                        const href = link.getAttribute('href') || '';
                        if (href.includes('user/') || href.includes('/profile') || href.includes('profile.php')) continue;
                        const match = href.match(idRegex);
                        if (match && match[1]) {
                            postId = match[1];
                            postUrl = href.startsWith('http') ? href : `https://www.facebook.com${href}`;
                            break;
                        }
                    }
                }

                // Ưu tiên 4: Thử đọc từ data-store của container
                if (!postId) {
                    const dataStore = container.getAttribute('data-store');
                    if (dataStore) {
                        try {
                            const storeData = JSON.parse(dataStore);
                            if (storeData.post_id) postId = String(storeData.post_id);
                        } catch (e) { }
                    }
                }

                // Ưu tiên 5: Tạo mã hash ổn định nếu hoàn toàn không tìm được ID
                if (!postId) {
                    let h = 5381;
                    for (let i = 0; i < text.length; i++) h = ((h << 5) + h) ^ text.charCodeAt(i);
                    const hex = (h >>> 0).toString(16);
                    postId = `hash_${hex}`;
                    postUrl = groupUrl;
                } else {
                    // Nếu tìm được ID thật, tự động chuẩn hóa URL bài viết về dạng canonical posts link
                    const base = groupUrl.split('?')[0].replace(/\/$/, '');
                    postUrl = `${base}/posts/${postId}/`;
                }

                let authorName = '';
                for (const link of Array.from(container.querySelectorAll('a[href]'))) {
                    const href = link.getAttribute('href') || '';
                    if (href.includes('/user/') || href.match(/facebook\.com\/[a-zA-Z0-9.]+\/?$/)) {
                        const name = link.textContent?.trim() || '';
                        if (name.length > 1 && name.length < 50 && !name.includes('...')) {
                            authorName = name;
                            break;
                        }
                    }
                }
                if (!authorName) {
                    const strongText = container.querySelector('strong');
                    if (strongText) authorName = strongText.textContent?.trim() || '';
                }

                let postedAt = '';
                results.push({ text, imageUrl, postUrl, postId, authorName, postedAt });
            });
            return results;
        }, groupUrl);

        for (const post of batch) {
            const textKey = post.text.substring(0, 50);
            if (!seenTexts.has(textKey)) {
                seenTexts.add(textKey);
                
                // Gán timestamp thực tế từ map đã thu thập được
                post.postedAt = timestampMap[post.postId] || '';
                if (post.postedAt) {
                    console.log(`  ✅ Post ${post.postId}: postedAt = ${post.postedAt}`);
                } else {
                    console.log(`  ⚠️ Post ${post.postId}: Không tìm thấy timestamp (tổng map: ${Object.keys(timestampMap).length})`);
                }
                
                allPosts.push(post);
                stats.valid++;
            }
        }

        await page.keyboard.press('PageDown');
        await page.waitForTimeout(800);
        console.log(`  Scroll ${i + 1}/${maxScrolls} done. Unique posts: ${allPosts.length} | Timestamps collected: ${Object.keys(timestampMap).length}`);
    }

    console.log(`✅ Extracted ${allPosts.length} unique posts.`);
    console.log(`📊 Tổng timestamp trong map: ${Object.keys(timestampMap).length} | Posts có timestamp: ${allPosts.filter(p => p.postedAt).length}/${allPosts.length}`);
    return allPosts;
}
