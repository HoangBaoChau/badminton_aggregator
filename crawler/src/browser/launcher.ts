import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as fs from 'fs';
import { CONFIG } from '../config';

chromium.use(stealthPlugin());

export async function launchBrowser() {
    const browser = await chromium.launch({ headless: CONFIG.HEADLESS });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Loading cookies...');
    if (fs.existsSync('./cookies.json')) {
        try {
            const rawCookies = JSON.parse(fs.readFileSync('./cookies.json', 'utf-8'));
            const cookies = rawCookies.map((c: any) => {
                const sameSiteMap: Record<string, string> = {
                    'no_restriction': 'None', 'lax': 'Lax', 'strict': 'Strict', 'none': 'None',
                };
                const mapped = sameSiteMap[(c.sameSite || '').toLowerCase()];
                const clean: any = {
                    name: c.name, value: c.value, domain: c.domain, path: c.path || '/',
                    httpOnly: !!c.httpOnly, secure: !!c.secure,
                };
                if (mapped) clean.sameSite = mapped;
                if (c.expirationDate) clean.expires = c.expirationDate;
                return clean;
            });
            await context.addCookies(cookies);
            console.log(`✅ Loaded ${cookies.length} cookies.`);
        } catch (e) {
            console.error('Invalid cookies.json format', e);
        }
    } else {
        console.warn('⚠️ No cookies.json found.');
    }

    return { browser, context, page };
}
