# Design notes (revision 2, November 2026)

Revision 1 (ChatGPT) kept the site's first look: cream paper, Fraunces, small monospaced capitals, numbered labels, pill buttons, chips and hairlines everywhere. Those are the default traits of AI-generated pages, which is why the site looked like every other one. Revision 2 replaces them with choices that come from Joselu's own material.

## The one loud thing

The arithmetic triangle on the home page. It merges revision 1's ASCII drawings and its coin experiment into one figure that means something. Each toss walks one step down the triangle that Zhu Shijie printed in 1303 (plate II): heads to the right, tails to the left. Each number counts the sequences of tosses that reach it, C(n, h). With independent tosses, a fixed unknown bias and a uniform Beta(1, 1) prior, the chance of heads next is (h + 1)/(n + 2), Laplace's rule of succession. The rest of the site stays quiet.

- Rows 0–9 are drawn at rest; the triangle grows to 12 rows and stops there (the count goes on, and a note says so).
- The only animation: the new cell and edge "ink in" over 260 ms when a toss is recorded. Buttons press in slightly. Both are off with reduced motion.
- A hidden live region reads the state in words: heads, tails, sequences that end here, and the chance of heads.
- Without JavaScript, the empty triangle still shows and the buttons are disabled.

## Colour

| Token | Hex | Where it comes from |
|---|---|---|
| paper | `#e9ebe6` | garúa, Lima's winter fog (not cream) |
| ink | `#1b2036` | indigo-black |
| carmine | `#a3173f` | cochineal, the Andean dye; the only accent |
| indigo | `#2d3f8f` | links |
| cacao | `#3b2119` | the dark band at the foot of Joselu's posters, used as the footer |

Dark mode is a night version (`#141826`). The Visual work page keeps its own darkroom, now a warm brown-black (`#1d1512`). The plate tints (cochineal, indigo, ochre, verdigris) stay for the engravings.

## Type

- **IM Fell** (French Canon for page titles, Double Pica for headings): 17th-century letterpress, the era of Fludd, Guaman Poma, Caravaggio and Vermeer.
- **Alegreya** for all text and controls: Huerta Tipográfica, Argentina. Old-style numerals in prose, lining numerals in IDs and the probability.
- **Courier Prime** only inside the triangle, because ASCII art needs a fixed-width face.
- All self-hosted in `assets/fonts/` with their OFL licences: no requests to Google.

## Removed on purpose

Uppercase monospaced labels and eyebrows above headings, "01 /" numbering, "·" separators, ↗ and → in links, pill buttons, interest chips, coloured card borders, the four-colour band under the header, and the collapsed experiment box. Plate numbers ("Pl. II.") stay because numbering plates is a real book convention and they link to the credits.

## Contents lists

The long pages (Research, the attention model, course and group pages) open with a short *Contents* / *Índice* list, set like an old book's contents page: an italic title in IM Fell, plain entries in Alegreya, and on Research a dotted leader after each area. Sub-entries are run in on one indented line (the attention model's subsections, the week numbers of a schedule). No sticky sidebar and no highlighting of the current section. Links jump without smooth scrolling, because lazy-loaded plates would shift the page mid-scroll.

## Moved

The random plate (one of ten on each visit) now lives on the 404 page, as Joselu chose.
