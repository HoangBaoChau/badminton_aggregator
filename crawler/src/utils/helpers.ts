export function cleanFacebookUrl(url: string): string {
    try {
        const parsed = new URL(url);
        const params = new URLSearchParams(parsed.search);
        const keepParams = ['fbid', 'set', 'id', 'story_fbid', 'multi_permalinks', 'group_id'];
        const cleanParams = new URLSearchParams();
        
        for (const [key, value] of params) {
            if (keepParams.includes(key)) {
                cleanParams.append(key, value);
            }
        }
        
        parsed.search = cleanParams.toString();
        return parsed.toString();
    } catch {
        return url;
    }
}

export function generateStableId(text: string): string {
    const stableHash = text.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    return `hash_${stableHash || 'unknown'}`;
}
