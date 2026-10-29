import { chromium } from 'playwright';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const ext = path.resolve('oslash-chrome-extension');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-ext-'));
const ctx = await chromium.launchPersistentContext(dir, {
  channel: 'chromium',
  headless: true,
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
});
let [sw] = ctx.serviceWorkers();
if (!sw) sw = await ctx.waitForEvent('serviceworker');
console.log('extension loaded:', sw.url());
await new Promise((r) => setTimeout(r, 1000));
console.log('shortcuts:', await sw.evaluate(async () => (await chrome.storage.local.get('shortcuts')).shortcuts?.length));

for (const url of ['https://www.google.com/search?q=%2Fg&sourceid=chrome', 'file:///g']) {
  const page = await ctx.newPage();
  await page.goto(url).catch((e) => console.log('goto err:', e.message.split('\n')[0]));
  await page.waitForTimeout(3000);
  console.log(url, '->', page.url());
  await page.close();
}
await ctx.close();
