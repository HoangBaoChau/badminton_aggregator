import { launchBrowser } from './browser/launcher';
import { extractPosts } from './browser/facebook';
import { analyzePost } from './ai/groq-client';
import { pushDealToBackend } from './api/backend-client';
import { CONFIG } from './config';
import { cleanFacebookUrl, generateStableId } from './utils/helpers';
import { DealPayload } from './models/types';
import { uploadImageToCloudinary } from './api/cloudinary-client';

async function processGroup(url: string) {
    const { browser, page } = await launchBrowser();
    try {
        console.log(`Navigating to: ${url}`);
        await page.goto(url);
        await page.waitForTimeout(5000);

        try {
            await page.waitForSelector('div[role="feed"]', { timeout: 15000 });
        } catch (e) {
            console.warn('⚠️ Feed not found.');
            return;
        }

        const posts = await extractPosts(page, CONFIG.MAX_SCROLLS, url);
        console.log(`\n Gửi ${posts.length} bài viết sang Groq...`);

        for (let i = 0; i < posts.length; i++) {
            const post = posts[i];
            console.log(`\n--- Bài ${i + 1}/${posts.length} ---`);
            
            const dealData = await analyzePost(post);
            if (!dealData) continue;

            console.log('✨ Kết quả Groq:', JSON.stringify(dealData, null, 2));

            if (dealData.is_deal) {
                // Upload ảnh lên Cloudinary
                const finalImageUrl = await uploadImageToCloudinary(post.imageUrl, post.postId || generateStableId(post.text));

                const payload: DealPayload = {
                    sourceId: CONFIG.SOURCE_ID,
                    externalId: post.postId || generateStableId(post.text),
                    externalUrl: cleanFacebookUrl(post.postUrl),
                    productName: dealData.productName,
                    price: dealData.price,
                    originalPrice: dealData.originalPrice,
                    condition: dealData.condition,
                    location: dealData.location,
                    sellerName: post.authorName || dealData.sellerName,
                    transactionMethod: dealData.transactionMethod,
                    aiSummary: dealData.aiSummary,
                    tags: dealData.tags,
                    metadata: dealData.metadata,
                    thumbnailUrl: finalImageUrl,
                    rawText: post.text,
                    postedAt: post.postedAt || null
                };

                console.log(`📅 postedAt: ${payload.postedAt || 'Không lấy được'}`);
                await pushDealToBackend(payload);
            } else {
                console.log('⚠️ Không phải bài mua bán.');
            }

            if (i < posts.length - 1) {
                await new Promise(r => setTimeout(r, CONFIG.AI_DELAY));
            }
        }
    } finally {
        await browser.close();
    }
}

async function main() {
    console.log('🕷️ Starting Badminton Deal Crawler...');
    for (const group of CONFIG.TARGET_GROUPS) {
        await processGroup(group.url);
    }
    console.log('✅ Crawler finished.');
}

main().catch(console.error);
