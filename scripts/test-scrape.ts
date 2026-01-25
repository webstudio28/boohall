
import { scrapePage } from '../utils/scrape';
import * as fs from 'fs';

const urls = [
    'https://cwsaprilov.wixsite.com',
    'https://lambdaspace.co/',
    'https://google.com'
];

async function test() {
    let log = '';
    for (const url of urls) {
        log += `\n--------------------------------------------------\n`;
        log += `Testing ${url}...\n`;
        try {
            const data = await scrapePage(url);
            log += `SUCCESS: ${url}\n`;
            log += `Title: ${data.title}\n`;
            log += `Content Length: ${data.text.length}\n`;
        } catch (e: any) {
            log += `FAILURE: ${url}\n`;
            log += `Error: ${e.message}\n`;
        }
    }
    fs.writeFileSync('scrape_results.log', log);
    console.log('Done writing logs.');
}

test();
