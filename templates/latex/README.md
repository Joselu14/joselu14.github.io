# LaTeX templates for syllabi and handouts

Two templates for courses and reading groups, made by Joselu Cabrera Guillermo
(https://joselu14.github.io). They are built on the standard `tufte-handout` class and share the look of
the website: Alegreya for the text, IM Fell for titles and headings, indigo-black ink, and one red for links
and status lines.

Each template comes filled in with a real example in Spanish: the study group *Filosofía de los delirios*
(Philosophy of Delusions), CIFA, PUCP, 2026. Replace the text with your own.

You may use and adapt these templates for your own courses and reading groups.

| File | What it is |
|---|---|
| `silabo-delirios.tex` | Syllabus or founding document: key facts (who, when, how), aim, format, core references, and a week-by-week schedule with readings. The week number, date and session leader go in the margin. |
| `separata-bienvenida.tex` | Handout (a welcome document or a session handout): margin notes, rules of the game, author-year citations and a bibliography from `refs.bib`. |
| `refs.bib` | The bibliography used by the handout. |
| `jcg-tufte.sty` | The shared look, and the commands listed below. |
| `fonts/` | Alegreya and IM Fell, under the SIL Open Font License (licences included). |
| `silabo-delirios.pdf`, `separata-bienvenida.pdf` | What the two examples look like when compiled. |

## Compile with XeLaTeX

The templates must be compiled with **XeLaTeX**. They load their own fonts from the `fonts/` folder
through `fontspec`, which pdfLaTeX cannot do.

On your computer (TeX Live or MiKTeX), from this folder:

```
latexmk -xelatex silabo-delirios.tex
latexmk -xelatex separata-bienvenida.tex     # also runs BibTeX for refs.bib
```

Without `latexmk`, run `xelatex`, then `bibtex` (only for the handout), then `xelatex` twice.

On Overleaf: upload the whole folder, keeping `fonts/` next to `jcg-tufte.sty`, then choose
*Menu > Compiler > XeLaTeX*.

Packages needed (all in a full TeX Live or MiKTeX installation): `tufte-latex`, `fontspec`,
`polyglossia`, `csquotes`, `xcolor`, `enumitem`, `booktabs`, `titlesec`, `marginnote`, `hyperref`, `natbib`.

## Starting a new document

```latex
\documentclass[a4paper,nofonts,justified]{tufte-handout}
\usepackage[english]{jcg-tufte}    % or [spanish]

\title{...}  \subtitle{...}  \author{...}  \date{...}
\status{Syllabus}                  % optional red line above the title: Syllabus, Handout, Draft...

\begin{document}
\maketitle
...
\end{document}
```

Commands the style adds:

- `\begin{facts} \fact{Organized by}{...} \fact{Starts}{...} \end{facts}`: the key facts, with italic labels.
- `\session{3}{Title}{date}{Leader: ...}`: one session of the schedule. The number, date and leader go in
  the margin; leave a `{}` empty to omit it.
- `\begin{readings} \reading{Author(s)}{Year}{Title}{URL} \end{readings}`: a numbered reading list. The title
  links to the URL; leave the last `{}` empty for no link.
- `\begin{rules} \item[Term] explanation \end{rules}`: rules of the game, with the term in bold.
- `\statusline{...}`: a status line in red italics anywhere in the text.
- Everything from the Tufte class: `\sidenote{}`, `\marginnote{}`, `\begin{fullwidth}`, margin figures,
  and `\citep{}` and `\citet{}` for author-year citations.

The bibliography style is `plainnat`, so its connecting words ("and", "editors", "volume") are in English.
For a bibliography in another language, switch to `biblatex` with a style for that language.

## En castellano

Dos plantillas (sílabo y separata) con el estilo de mi página web, basadas en la clase `tufte-handout`.
Hay que compilarlas con **XeLaTeX** (en Overleaf: *Menu > Compiler > XeLaTeX*), dejando la carpeta `fonts/`
junto a `jcg-tufte.sty`. Para un documento en castellano, usen `\usepackage[spanish]{jcg-tufte}`.
Los dos archivos `.tex` son ejemplos reales; reemplacen el texto por el suyo.
