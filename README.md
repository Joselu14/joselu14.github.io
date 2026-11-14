# joselu14.github.io

Personal website of Joselu Cabrera Guillermo (Philosophy, Duke University).
Plain HTML + CSS + a little JavaScript: no build step, no frameworks. GitHub Pages serves the files as they are.

## What is where

| File | What it is |
|---|---|
| `index.html` | Home / About: bio, the arithmetic triangle (coin experiment), research areas, news, contact |
| `research.html` | Research areas (one historical plate each), work in progress, talks |
| `toolkit.html` | Philosopher’s toolkit: tools for formal philosophy, resources for PhD applicants, courses and reading groups |
| `teaching.html` | Old address; redirects to `toolkit.html` |
| `groups/`, `courses/` | One page per reading group or course (e.g. `groups/filosofia-de-los-delirios.html`), with its PDFs in a folder of the same name |
| `templates/course-or-group.html` | Blank page for a new course or reading group (not indexed by search engines) |
| `templates/latex/`, `templates/latex-templates.zip` | The LaTeX templates for syllabi and handouts (compile with XeLaTeX; instructions in `templates/latex/README.md`). The zip is what visitors download from the toolkit page: rebuild it whenever the folder changes |
| `visual.html` | Visual work: photography and posters, with filters and a lightbox |
| `cv.html` | CV with Print / save PDF action |
| `credits.html` | Author, date, source and licence of every image |
| `404.html` | "Page not found" page with one of the ten plates drawn at random (GitHub Pages uses it automatically) |
| `assets/css/style.css` | All the styling. Colours and typefaces are the tokens at the top |
| `assets/css/fonts.css`, `assets/fonts/` | The three typefaces, served from the site itself (no Google Fonts), with their OFL licences |
| `assets/js/main.js` | Language, theme, the arithmetic triangle, the random plate (404) and the gallery |
| `assets/img/plates/` | The public-domain images (list in `sources.txt`) |
| `assets/img/gallery/` | Your photos (`photos/`) and posters (`posters/`) |
| `assets/img/me.jpg` | Your headshot (Contact box on the home page) |
| `get-images.bat` | Downloads the plates from Wikimedia Commons (run once) |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |

## First run

1. Extract the complete ZIP. All existing images are already included.
2. Double-click **`index.html`** to open the site in your browser. No installation or build is needed.
3. Press **Heads** and **Tails** under the triangle on the home page to try the coin experiment.

Optional local server: run `python -m http.server 8000` in this folder and visit `http://localhost:8000`. The original `get-images.bat` is retained only as a source-recovery utility.

## Editing

**Two languages.** Every text exists twice, once with `lang="en"` and once with `lang="es"`:

```html
<p lang="en">I work on Bayesian epistemology…</p>
<p lang="es">Trabajo en epistemología bayesiana…</p>
```

The EN | ES switch shows one and hides the other. Write both versions when you add something.
For short bits inside a sentence use `<span lang="en">…</span><span lang="es">…</span>`.

**Placeholders.** Anything highlighted in yellow (`class="todo"`) still needs real content.
Search the files for `todo` to find them all.

**Adding a photo or poster.** See the instructions in the comment at the top of the gallery in `visual.html`.
Export images at about 1600 px on the long side (JPG, quality ~80) so the site stays fast.

**A new course or reading group.**
1. Copy `templates/course-or-group.html` to `courses/NAME.html` or `groups/NAME.html` (lowercase, hyphens, no accents).
2. Replace everything highlighted in yellow and delete the sections you don't need. Titles of readings stay in their original language.
3. Delete the line `<meta name="robots" content="noindex">` in the `<head>`, and change the `canonical` and `og:url` addresses to the new page.
4. Make the syllabus and handouts with the LaTeX templates in `templates/latex/`, and put the PDFs in a folder named like the page (`groups/NAME/`). If the documents are in only one language, say so on the page in the other one.
5. In `toolkit.html`, under *Courses and reading groups*, copy the entry for *Filosofía de los delirios* and link it to the new page. Add the page to `sitemap.xml`.

**Image policy.** Images on the pages are either historical images in the public domain (or CC0), each credited
to its original creator in `credits.html`, or your own (photos, posters, portrait). If you add any other kind of
image, update the wording at the top of `credits.html` and in the footer so it stays accurate. To add a plate: add a line to `assets/img/plates/sources.txt`,
run `get-images.bat`, add it to the `PLATES` list in `assets/js/main.js`, and add a credit block to `credits.html`.

## Publishing on GitHub Pages

Your site will live at **https://joselu14.github.io**.

1. Sign in to GitHub as **Joselu14** and create a new **public** repository named exactly
   `joselu14.github.io`. Don't add a README (this folder already has one).
2. Upload the files. Two options:
   - **Website (simplest):** on the empty repository page click *uploading an existing file*, drag in
     **everything inside this folder** (including the `assets` folder and `.nojekyll`), then *Commit changes*.
     (`.nojekyll` is hidden by default on Windows: in File Explorer, enable *View → Show → Hidden items*.)
   - **GitHub Desktop (better for frequent updates):** *File → Add local repository* → choose this folder →
     *create a repository* → *Publish repository* (untick "Keep this code private").
3. In the repository go to **Settings → Pages**. Under *Build and deployment* choose
   *Deploy from a branch*, branch `main`, folder `/ (root)`, and *Save*.
4. After a minute or two the site is live at https://joselu14.github.io.

To update the site later: edit the files, then upload them again (website) or *Commit* + *Push* (GitHub Desktop).

Pages for classes and reading groups can live in sub-folders of this same repository, e.g. `phil-101/index.html`
becomes https://joselu14.github.io/phil-101/.

## Design (revision 2, November 2026)

See `DESIGN.md` for the visual system: garúa-grey paper, indigo-black ink, cochineal carmine, IM Fell + Alegreya, the poster-band footer, and the arithmetic triangle.

## Checks

The website needs no runtime dependencies. Optional developer checks use Node and Playwright: in a disposable development environment run `npm i playwright`, then `node tests/check-site.cjs`. To use an installed Chrome or Chromium, set `BROWSER_EXECUTABLE` to its path. Screenshots go to `.review-output/` (or `REVIEW_OUTPUT`), and `tests/test-results.json` records the checks of the last run.

Before publishing, look at the site on a real phone: switch English/Español and light/dark, record a few tosses, and open and close a gallery image.
