# Animations

Manim sources for the three animations on the site (`assets/video/`): the coin and the
arithmetic triangle (home page), the attention model (`attention.html`) and the model of
Kuhn (`kuhn.html`). Each is a square video, about a minute long, with no sound; the text is
on screen, in English or Spanish.

| File | Scene | Video |
|---|---|---|
| `coin.py` | `Coin` | `assets/video/coin-en.mp4`, `coin-es.mp4` |
| `attention.py` | `Attention` | `assets/video/attention-en.mp4`, `attention-es.mp4` |
| `kuhn.py` | `Kuhn` | `assets/video/kuhn-en.mp4`, `kuhn-es.mp4` |

`common.py` holds the shared look: a 1080 × 1080 frame, the site's paper, ink and pigments,
Alegreya and IM Fell for text (set with XeLaTeX, so captions wrap and can hold inline
formulas) and Latin Modern for the formulas. `kuhn_port.py` runs the notebook's model in
plain Python (seed 10 gives the notebook's run), and `kuhn.py` plays that run.

## Rendering

Needs Manim Community (0.19 or later), ffmpeg, XeLaTeX and dvisvgm, and the fonts Alegreya and
IM FELL Double Pica installed on the system. Render each language into its own media folder
(two renders of the same scene must not share one):

```bash
cd animations
ANIM_LANG=en manim -qh --media_dir media_en -o Coin_en coin.py Coin
ANIM_LANG=es manim -qh --media_dir media_es -o Coin_es coin.py Coin
```

Then compress for the web and make the poster (the frame shown before playing):

```bash
ffmpeg -i media_en/videos/coin/1080p30/Coin_en.mp4 -c:v libx264 -preset veryfast -crf 24 \
  -pix_fmt yuv420p -movflags +faststart -an ../assets/video/coin-en.mp4
ffmpeg -ss 30 -i ../assets/video/coin-en.mp4 -frames:v 1 -vf scale=720:720 -q:v 4 ../assets/video/coin-en.jpg
```

The Kuhn video uses `-crf 27` (the grid changes every frame). Posters are taken at 30 s
(coin), 44 s (attention) and 47 s (Kuhn). The `media_*` folders are not part of the site.
