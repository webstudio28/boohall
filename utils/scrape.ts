import * as cheerio from 'cheerio';

export interface ScrapedData {
    url: string;
    title: string;
    description: string;
    headings: {
        h1: string[];
        h2: string[];
        h3: string[];
    };
    text: string;
}

export async function scrapePage(url: string): Promise<ScrapedData> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0'
            },
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove script and style elements
        $('script, style, noscript, iframe, svg').remove();

        const title = $('title').text().trim();
        const description = $('meta[name="description"]').attr('content') || '';

        const headings = {
            h1: $('h1').map((_, el) => $(el).text().trim()).get().filter(t => t.length > 0),
            h2: $('h2').map((_, el) => $(el).text().trim()).get().filter(t => t.length > 0),
            h3: $('h3').map((_, el) => $(el).text().trim()).get().filter(t => t.length > 0),
        };

        // Get main content text (excluding nav, footer if possible, but basic grab is fine)
        // Trying to target main or body
        const main = $('main').length ? $('main') : $('body');

        // Clean up whitespace
        const text = main.text().replace(/\s+/g, ' ').trim().slice(0, 15000); // Limit text length for token limits

        console.log(`✅ [Scrape Success] URL: ${url}`);
        console.log(`   - Title: ${title}`);
        console.log(`   - Headings found: H1(${headings.h1.length}), H2(${headings.h2.length}), H3(${headings.h3.length})`);
        console.log(`   - Content length: ${text.length} chars`);

        return {
            url,
            title,
            description,
            headings,
            text
        };
    } catch (error) {
        console.error(`❌ [Scrape Failed] URL: ${url}`, error);
        throw error;
    }
}
