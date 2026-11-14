// Headless checks for the site. Run: node tests/check-site.cjs
// Needs the "playwright" package. Set BROWSER_EXECUTABLE to use an installed Chrome/Chromium.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');

const root = path.resolve(__dirname, '..');
const shots = process.env.REVIEW_OUTPUT || path.join(root, '.review-output');
fs.mkdirSync(shots, { recursive: true });
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.pdf': 'application/pdf', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (e, b) => {
    if (e) { // like GitHub Pages: unknown paths get 404.html
      return fs.readFile(path.join(root, '404.html'), (e2, b2) => { res.writeHead(404, { 'Content-Type': mime['.html'] }); res.end(b2); });
    }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); res.end(b);
  });
});

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE || undefined });
  const errors = [], checks = [], broken = [], external = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, locale: 'en-US' });
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', route => {
      const u = route.request().url();
      if (u.startsWith(base)) return route.continue();
      if (route.request().resourceType() !== 'document') external.push(u);
      return route.abort();
    });
    const pages = ['index.html', 'research.html', 'attention.html', 'kuhn.html', 'toolkit.html', 'groups/filosofia-de-los-delirios.html', 'templates/course-or-group.html', 'visual.html', 'cv.html', 'credits.html', '404.html'];
    let combos = 0, tocs = 0;
    for (const file of pages) {
      await page.goto(base + '/' + file); await page.waitForLoadState('load');
      const refs = await page.evaluate(() => Array.from(document.querySelectorAll('[src],link[href],a[href]'))
        .map(e => e.getAttribute('src') || e.getAttribute('href'))
        .filter(v => v && !/^(https?:|mailto:|#|data:)/.test(v)));
      for (const ref of refs) {
        const p = ref.split('#')[0].split('?')[0].replace(/^\//, '');
        if (p && !fs.existsSync(path.join(root, path.dirname(file), p))) broken.push(file + ': ' + ref);
      }
      // Section links (the contents lists, and links like research.html#talks) must land on an id
      const frags = await page.evaluate(() => Array.from(document.querySelectorAll('a[href*="#"]'))
        .map(a => a.getAttribute('href')).filter(h => !/^(https?:|mailto:)/.test(h) && h !== '#'));
      for (const h of frags) {
        const [p, id] = h.split('#');
        const target = p ? path.join(root, path.dirname(file), p) : path.join(root, file);
        if (!/\.html$/.test(target) || !fs.existsSync(target)) continue;
        const html = fs.readFileSync(target, 'utf8');  // on Visual work, #photo and #poster pick a filter
        if (!html.includes('id="' + id + '"') && !html.includes('data-filter="' + id + '"')) broken.push(file + ': ' + h + ' (no such section)');
      }
      tocs += await page.locator('nav.toc a').count();
      for (const width of [320, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const lang of ['en', 'es']) {
          await page.locator('[data-set-lang=' + lang + ']').click();
          for (const theme of ['light', 'dark']) {
            await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
            assert(!overflow, 'Horizontal overflow: ' + [file, width, lang, theme].join(' '));
            combos++;
          }
        }
      }
    }
    checks.push(combos + ' page/width/language/theme combinations: no horizontal overflow');
    assert.deepEqual(broken, [], 'Broken local references: ' + broken.join(' | ')); checks.push('All local pages and assets exist');
    assert(tocs >= 48, 'Contents lists: ' + tocs); checks.push(tocs + ' contents links, each landing on a section');
    assert.deepEqual(external, [], 'Requests to other sites: ' + external.join(', ')); checks.push('No requests to other sites (fonts are self-hosted)');

    // The arithmetic triangle
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto(base + '/index.html'); await page.locator('[data-set-lang=en]').click();
    const toss = t => page.locator('[data-toss="' + t + '"]').click();
    assert.equal(await page.locator('#frac').textContent(), '1/2');
    for (const t of ['H', 'T', 'H', 'H', 'T', 'H', 'H']) await toss(t);
    assert.equal(await page.locator('#frac').textContent(), '6/9');            // (5 + 1) / (7 + 2)
    assert.equal(await page.locator('#pct').textContent(), '(66.7%)');
    assert.equal(await page.locator('#tri .cur').textContent(), ' 21 ');      // C(7, 5)
    assert.equal(await page.locator('#tri .p').count() > 0, true);
    assert((await page.locator('#tri-status').textContent()).includes('21 sequences of tosses end here'));
    await page.locator('[data-set-lang=es]').click();
    assert((await page.locator('#tri-status').textContent()).includes('5 caras, 2 sellos'));
    assert.equal(await page.locator('#seq').textContent(), 'C S C C S C C');
    for (let i = 0; i < 8; i++) await toss('T');                               // 15 tosses: past the 12 drawn rows
    assert.equal(await page.locator('#frac').textContent(), '6/17');
    assert.equal(await page.locator('#tri-stop').isVisible(), true);
    await toss('');
    assert.equal(await page.locator('#frac').textContent(), '1/2');
    assert.equal(await page.locator('#tri-stop').isVisible(), false);
    checks.push('Triangle: path, C(n, h), rule of succession, Spanish status text, 12-row cap, start over');
    await page.screenshot({ path: path.join(shots, 'home-1280.png') });

    // Philosopher's toolkit
    await page.goto(base + '/toolkit.html'); await page.locator('[data-set-lang=en]').click();
    assert.equal(await page.locator('.project').count(), 9);
    const more = page.locator('#ai-formal-philosophy details.more');
    assert.equal(await more.evaluate(d => d.open), false);
    await more.locator('summary').click();
    assert.equal(await more.evaluate(d => d.open), true);
    assert.equal(await page.locator('#triangle-tool a[href="index.html#triangle"]:visible, .project:not(#animations) a[href="index.html#triangle"]:visible').count(), 1);
    assert.equal(fs.existsSync(path.join(root, 'assets/docs')), false);
    await page.goto(base + '/teaching.html'); await page.waitForURL(/toolkit\.html$/);
    checks.push('Toolkit: nine entries, "More about this project" opens, triangle link, old address redirects, no slides');

    // The attention model
    await page.goto(base + '/research.html'); await page.locator('[data-set-lang=en]').click();
    await page.locator('#inquiry a[href="attention.html"]:visible').click(); await page.waitForURL(/attention\.html$/);
    const nums = async () => (await page.locator('.att-row-num').allTextContents()).map(t => t.replace(/\s+/g, ' '));
    assert.deepEqual(await nums(), ['0.80 → 0.95', '0.15 → 0.03']);
    assert.deepEqual(await page.locator('.att-agent').first().locator('.att-num').allTextContents(), ['0.80', '1.00']);
    assert.match(await page.locator('#att-verdict').textContent(), /^They polarize/);
    await page.locator('[data-scen=clash-enthusiastic]').click();
    assert.deepEqual(await nums(), ['0.70 → 0.90', '0.30 → 0.10']);
    assert.match(await page.locator('#att-all').textContent(), /Anaí would be at 0\.50 and Dai at 0\.50/);
    await page.locator('[data-scen=same-beliefs]').click();
    assert.deepEqual(await nums(), ['0.85 → 0.60', '0.85 → 0.85']);
    await page.locator('.att-agent').nth(1).locator('summary').first().click();
    await page.locator('#att-1-S').fill('0.4');
    const sums = await page.evaluate(() => [...document.querySelectorAll('.att-agent')].map(a => [...a.querySelectorAll('.att-table tbody tr')].reduce((t, r) => t + Number(r.children[4].textContent), 0)));
    sums.forEach(v => assert(Math.abs(v - 1) < 0.01, 'truth table adds up to 1'));
    await page.locator('[data-set-lang=es]').click();
    assert.match(await page.locator('#att-verdict').textContent(), /^Se acercan/);
    await page.locator('[data-set-lang=en]').click();
    checks.push('Attention model: linked from Research; the paper’s numbers (saliences 0.80/1.00, credences 0.80→0.95 and 0.15→0.03); enthusiastic and Lockean scenarios; sliders keep the tables coherent; Spanish verdicts');

    // Normal science and revolutions: the notebook's runs, the phases, the controls
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto(base + '/research.html'); await page.waitForLoadState('load');
    await page.locator('#methods a[href="kuhn.html"]:visible').click(); await page.waitForURL(/kuhn\.html$/);
    await page.goto(base + '/toolkit.html'); await page.waitForLoadState('load');
    assert.equal(await page.locator('#kuhn-model a[href="kuhn.html"]').count(), 1);
    const nb = JSON.parse(fs.readFileSync(path.join(root, 'tests/kuhn-notebook-seed10.json'), 'utf8'));
    for (const start of ['hom', 'bif', 'het']) {
      await page.goto(base + '/kuhn.html' + (start === 'hom' ? '' : '?start=' + start)); await page.waitForLoadState('load');
      await page.locator('[data-set-lang=en]').click();
      const n = await page.evaluate(() => KuhnPage.run.counts.map(c => c.length));
      assert.deepEqual(n, nb[start], 'Not the notebook run: ' + start);
    }
    await page.goto(base + '/kuhn.html'); await page.waitForLoadState('load');
    await page.locator('[data-set-lang=en]').click();
    const paradigmStarts = async () => page.evaluate(() => KuhnEngine.phases(KuhnPage.run, 300).paradigms.map(p => p.start));
    assert.deepEqual(await paradigmStarts(), [0, 202]);
    await page.evaluate(() => KuhnPage.setYear(150));
    assert.equal(await page.locator('#kuhn-status-head').textContent(), 'Year 150: crisis');
    await page.evaluate(() => KuhnPage.setYear(230));
    assert.match(await page.locator('#kuhn-status-body').textContent(), /^Paradigm 2, which took over in year 202, holds 84% of the scientists\. 3 theories in play\. Revolutions so far: 1\.$/);
    await page.locator('[data-set-lang=es]').click();
    assert.equal(await page.locator('#kuhn-status-head').textContent(), 'Año 230: ciencia normal');
    await page.locator('[data-set-lang=en]').click();
    await page.locator('[data-start=bif]').click(); await page.waitForTimeout(100);
    assert.deepEqual(await paradigmStarts(), [11, 65, 122, 206]);
    assert.match(page.url(), /\?start=bif$/);
    await page.locator('#kuhn-step').click(); await page.locator('#kuhn-step').click();
    assert.equal(await page.evaluate(() => KuhnPage.year), 2);
    await page.locator('#kuhn-play').click(); await page.waitForTimeout(700); await page.locator('#kuhn-play').click();
    const yPlayed = await page.evaluate(() => KuhnPage.year);
    assert(yPlayed > 4 && yPlayed < 40, 'Playing: ' + yPlayed);
    await page.locator('#kuhn-alpha').fill('4');
    await page.waitForTimeout(100);
    assert.match(page.url(), /alpha=4/);
    assert(await page.locator('#kuhn-defaults').isVisible());
    await page.locator('#kuhn-seed').fill('7'); await page.locator('#kuhn-seed').press('Enter'); await page.waitForTimeout(100);
    assert.equal(await page.evaluate(() => KuhnPage.settings.seed), 7);
    await page.locator('#kuhn-defaults').click(); await page.waitForTimeout(100);
    assert.deepEqual(await page.evaluate(() => [KuhnPage.settings.alpha, KuhnPage.settings.seed]), [5.8, 10]);
    assert.match(page.url(), /kuhn\.html\?start=bif$/);
    const chartBox = await page.locator('#kuhn-chart').boundingBox();
    await page.mouse.click(chartBox.x + chartBox.width * 0.5, chartBox.y + chartBox.height * 0.5);
    const yClicked = await page.evaluate(() => KuhnPage.year);
    assert(yClicked > 130 && yClicked < 170, 'Chart click: ' + yClicked);
    checks.push('Normal science and revolutions: linked from Research and the toolkit; seed 10 gives the notebook’s runs for all three starts; paradigms at years 0 and 202 (one theory) and 11, 65, 122, 206 (two); status in both languages; step, play, sliders, seed, defaults, address and chart clicks work');

    // Animations: six videos with posters; the visible one follows the language; switching pauses playback
    const vids = ['coin', 'attention', 'kuhn'].flatMap(n => ['en', 'es'].map(l => n + '-' + l));
    for (const v of vids) for (const ext of ['mp4', 'jpg']) assert(fs.existsSync(path.join(root, 'assets/video', v + '.' + ext)), 'Missing ' + v + '.' + ext);
    await page.goto(base + '/toolkit.html'); await page.waitForLoadState('load');
    await page.locator('[data-set-lang=en]').click();
    assert.equal(await page.locator('#animations video:visible').count(), 3);
    assert.deepEqual(await page.locator('#animations video:visible').evaluateAll(vs => vs.map(v => v.getAttribute('poster').split('/').pop())), ['coin-en.jpg', 'attention-en.jpg', 'kuhn-en.jpg']);
    await page.locator('[data-set-lang=es]').click();
    assert.deepEqual(await page.locator('#animations video:visible').evaluateAll(vs => vs.map(v => v.querySelector('source').getAttribute('src'))), ['assets/video/coin-es.mp4', 'assets/video/attention-es.mp4', 'assets/video/kuhn-es.mp4']);
    await page.locator('[data-set-lang=en]').click();
    for (const p of ['attention.html', 'kuhn.html']) {
      await page.goto(base + '/' + p); await page.waitForLoadState('load');
      assert.equal(await page.locator('#animation video:visible').count(), 1, p);
      assert.equal(await page.locator('nav.toc a[href="#animation"]').count(), 1, p);
    }
    await page.goto(base + '/index.html'); await page.waitForLoadState('load');
    assert.equal(await page.locator('#triangle a[href="toolkit.html#anim-coin"]:visible').count(), 1);
    checks.push('Animations: six videos and posters exist; the toolkit shows three, in the visitor’s language; one on each model page, in its contents list; linked from the home triangle');

    // A reading-group page and the blank template
    await page.goto(base + '/toolkit.html'); await page.locator('[data-set-lang=en]').click();
    await page.locator('a[href="groups/filosofia-de-los-delirios.html"]').click(); await page.waitForURL(/filosofia-de-los-delirios\.html$/);
    assert.equal(await page.locator('.weeks > .week').count(), 10);
    assert.equal(await page.locator('.weeks .readings li').count(), 21);
    assert.equal((await page.locator('h1 span:visible').textContent()).replace(/\u00ad/g, ''), 'Philosophy of Delusions');
    assert.equal(await page.locator('.week h3 span:visible').first().textContent(), 'The nature of delusions I');
    assert.equal(await page.locator('.nav a[aria-current="page"]').getAttribute('href'), '../toolkit.html');
    for (const pdf of ['silabo.pdf', 'bienvenida.pdf']) assert(fs.existsSync(path.join(root, 'groups/filosofia-de-los-delirios', pdf)));
    assert(fs.existsSync(path.join(root, 'templates/latex-templates.zip')) && fs.existsSync(path.join(root, 'templates/latex/README.md')));
    await page.locator('[data-set-lang=es]').click();
    assert.equal(await page.locator('.week-n span:visible').first().textContent(), 'Semana 1');
    assert.equal(await page.locator('.week h3 span:visible').first().textContent(), 'La naturaleza de los delirios I');
    await page.screenshot({ path: path.join(shots, 'group-1280.png'), fullPage: true });
    await page.goto(base + '/templates/course-or-group.html');
    assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex');
    assert(!fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8').includes('templates/'));
    checks.push('Reading group: linked from the toolkit, English and Spanish titles, 10 weeks, 21 readings, PDFs and LaTeX templates present; template is noindex and outside the sitemap');

    // Random plate on the 404 page
    await page.goto(base + '/no-such-page'); await page.locator('[data-set-lang=en]').click();
    const before = await page.locator('#random-plate img').getAttribute('src');
    await page.locator('#draw-again').click();
    assert.notEqual(await page.locator('#random-plate img').getAttribute('src'), before);
    assert(await page.locator('#random-plate figcaption a').getAttribute('href').then(h => h.startsWith('/credits.html#')));
    checks.push('404: random plate, redraw gives a different plate, credit link is absolute');

    // Gallery
    await page.goto(base + '/visual.html#poster');
    assert.equal(await page.locator('.work:not([hidden])').count(), 4);
    await page.locator('.work:not([hidden]) button').first().click();
    assert.equal(await page.locator('#lightbox').evaluate(d => d.open), true);
    const at = () => page.locator('.viewer-position').textContent();
    assert.equal(await at(), '1 of 4');
    await page.keyboard.press('ArrowRight'); assert.equal(await at(), '2 of 4');
    const box = await page.locator('.lightbox .stage img').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(box.x + box.width / 2 + 20 * i, box.y + box.height / 2);
    await page.mouse.up(); await page.waitForTimeout(300);
    assert.equal(await at(), '1 of 4');                                        // dragged right: previous work
    await page.locator('.lightbox .caption').click();
    assert.equal(await page.locator('#lightbox').evaluate(d => d.open), true); // the caption does not close it
    await page.mouse.click(8, 400);
    assert.equal(await page.locator('#lightbox').evaluate(d => d.open), false); // outside does
    checks.push('Gallery: poster filter from URL, viewer arrows, keys, drag, click outside to close');

    assert.deepEqual(errors, [], 'Page errors');
    checks.push('No JavaScript errors');
    fs.writeFileSync(path.join(root, 'tests', 'test-results.json'), JSON.stringify({ date: new Date().toISOString(), checks }, null, 2));
    console.log(checks.join('\n'));
  } finally {
    await browser.close(); server.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
