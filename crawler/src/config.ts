import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    CRAWLER_API_KEY: process.env.CRAWLER_API_KEY || 'super-secret-crawler-key-123',
    BACKEND_API_URL: process.env.BACKEND_API_URL || 'http://localhost:8080/api/v1/deals',
    SOURCE_ID: "11111111-1111-1111-1111-111111111111",
    // Keep default false for local debugging; set HEADLESS=true for servers/CI.
    HEADLESS: (process.env.HEADLESS || '').toLowerCase() === 'true',
    MAX_SCROLLS: 5,
    SCROLL_DELAY: 800,
    AI_DELAY: 2000,
    GROQ_MODEL: 'llama-3.3-70b-versatile',
    CLOUDINARY: {
        CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
        API_KEY: process.env.CLOUDINARY_API_KEY || '',
        API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
    },
    TARGET_GROUPS: [
        {
            url: 'https://www.facebook.com/groups/366315457192444?sorting_setting=CHRONOLOGICAL',
            name: 'Badminton Group Main'
        }
        // Thêm các group khác vào đây sau này
    ]
};
