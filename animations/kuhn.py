"""Normal science and revolutions: the notebook's run with seed 10 from one theory (kuhn.html).
The grid and the history strip are drawn as images, one pixel of image per pixel of video."""
import collections
import numpy as np
import kuhn_port as port
from common import *

N, T_YEARS = 30, 300
HIST = port.run("hom", T=T_YEARS, seed=10)


def hexrgb(h):
    h = h.lstrip("#"); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.uint8)


# theory colours, assigned exactly as on the page: a new theory takes the least-used colour
def assign_colours(hist):
    colour = {}
    load = [0] * len(PAL)
    for c in hist[0]:
        if c not in colour:
            b = min(range(len(PAL)), key=lambda k: (load[k], k)); colour[c] = b; load[b] += 1
    for y in range(1, len(hist)):
        load = [0] * len(PAL)
        for c in hist[y - 1]:
            load[colour[c]] += 1
        for c in hist[y]:
            if c not in colour:
                b = min(range(len(PAL)), key=lambda k: (load[k], k)); colour[c] = b; load[b] += 1
    return colour


COL = assign_colours(HIST)
PALRGB = [hexrgb(h) for h in PAL]


def phases(hist, upto, min_years=10):
    """Kuhn's phases from the years up to `upto`, with the page's definitions."""
    holder = []
    for y in range(upto + 1):
        t, c = COUNTS[y].most_common(1)[0]
        holder.append(t if c > len(hist[y]) / 2 else None)
    paradigms, cur, run_id, run_start = [], None, None, 0
    for y in range(upto + 1):
        if holder[y] != run_id:
            run_id, run_start = holder[y], y
        if run_id is not None and run_id != cur and (y - run_start + 1 >= min_years or run_start == 0):
            paradigms.append((run_id, run_start, y)); cur = run_id
    phase, which, k = [], [], -1
    for y in range(upto + 1):
        while k + 1 < len(paradigms) and paradigms[k + 1][1] <= y:
            k += 1
        which.append(k)
        phase.append("pre" if k < 0 else ("normal" if holder[y] == paradigms[k][0] else "crisis"))
    return phase, which, paradigms


CELL, GAP = 16, 2                # pixels: 30 cells of 16 px = 480 px, one image pixel per video pixel at 1080p
GRID_PX = N * CELL


def grid_image(y):
    img = np.empty((GRID_PX, GRID_PX, 3), dtype=np.uint8); img[:] = hexrgb(PAPER)
    g = HIST[y]
    for r in range(N):
        for c in range(N):
            img[r * CELL:(r + 1) * CELL - GAP, c * CELL:(c + 1) * CELL - GAP] = PALRGB[COL[g[r * N + c]]]
    return img


SW, SH, BAND, BGAP = 602, 96, 14, 6   # history strip: 2 px per year
BIRTH = {c: i for i, c in enumerate(COL)}           # theories in order of appearance
COUNTS = [collections.Counter(g) for g in HIST]
SHARES = np.empty((SH, SW, 3), dtype=np.uint8); SHARES[:] = hexrgb(PAPER2)
for _y in range(T_YEARS + 1):                       # the share columns never change once drawn
    cum = 0
    for code in sorted(COUNTS[_y], key=BIRTH.get):
        h0 = SH - round((cum + COUNTS[_y][code]) / (N * N) * SH); h1 = SH - round(cum / (N * N) * SH)
        SHARES[h0:h1, 2 * _y:2 * _y + 2] = PALRGB[COL[code]]
        cum += COUNTS[_y][code]


def strip_image(upto):
    img = np.empty((BAND + BGAP + SH, SW, 3), dtype=np.uint8); img[:] = hexrgb(PAPER)
    img[:BAND, :] = hexrgb(PAPER2)
    img[BAND + BGAP:, :] = hexrgb(PAPER2)
    img[BAND + BGAP:, :2 * (upto + 1)] = SHARES[:, :2 * (upto + 1)]
    phase, which, pars = phases(HIST, upto)
    for y in range(upto + 1):
        x0 = 2 * y
        if phase[y] == "normal":
            img[:BAND, x0:x0 + 2] = PALRGB[COL[pars[which[y]][0]]]
        elif phase[y] == "crisis":
            img[:BAND, x0:x0 + 2] = hexrgb(PAPER)
            for yy in range(BAND):
                for xx in (x0, x0 + 1):
                    if (xx + yy) % 5 == 0:
                        img[yy, xx] = hexrgb(INK2)
    for k, (pid, start, conf) in enumerate(pars):
        if k > 0:
            img[:, 2 * start:2 * start + 2] = hexrgb(CARMINE)
    return img


def phase_text(y):
    phase, which, pars = phases(HIST, y)
    p, k = phase[y], which[y]
    if LANG == "en":
        name = {"pre": "pre-paradigm", "normal": "normal science", "crisis": "crisis"}[p]
        extra = " (paradigm %d)" % (k + 1) if p == "normal" else ""
        return "Year %d: %s%s" % (y, name, extra)
    name = {"pre": "preparadigma", "normal": "ciencia normal", "crisis": "crisis"}[p]
    extra = " (paradigma %d)" % (k + 1) if p == "normal" else ""
    return "Año %d: %s%s" % (y, name, extra)


class Kuhn(Scene):
    def construct(self):
        cap = Caption(self)
        head = title(T("Normal science and revolutions", "Ciencia normal y revoluciones")).to_edge(UP, buff=0.42)
        self.play(Write(head), run_time=1.2)

        GRID_UNITS = GRID_PX / 135
        gcenter = np.array([0, 2.52 - GRID_UNITS / 2, 0])
        grid = ImageMobject(grid_image(0)).set_resampling_algorithm(RESAMPLING_ALGORITHMS["nearest"])
        grid.height = GRID_UNITS; grid.move_to(gcenter)
        cell_u = GRID_UNITS / N
        def cell_pos(r, c):
            return gcenter + np.array([(c + 0.5) * cell_u - GRID_UNITS / 2, GRID_UNITS / 2 - (r + 0.5) * cell_u, 0])

        cap.show(T(r"A community of 900 scientists on a grid. Each square is a scientist, coloured by the theory they publish in this year.",
                   r"Una comunidad científica de 900 integrantes en una grilla. Cada casilla es un integrante, del color de la teoría en que publica."))
        self.play(FadeIn(grid), run_time=1.0)
        self.wait(3.2)

        # one scientist and the neighbours
        r0, c0 = 12, 14
        me = Square(side_length=cell_u * 0.98, color=CARMINE, stroke_width=5).move_to(cell_pos(r0, c0))
        nbs = VGroup(*[Square(side_length=cell_u * 0.98, color=INK, stroke_width=3).move_to(cell_pos(r0 + dr, c0 + dc))
                       for dr in (-1, 0, 1) for dc in (-1, 0, 1) if (dr, dc) != (0, 0)])
        faith = math(r"F_i = \frac{(A_i + 1)^{\alpha}}{\bigl(P(T_i) + 1\bigr)^{e_i}}", INK, 0.8).move_to([0, -1.75, 0])
        cap.show(T(r"Faith in a theory grows with the neighbours who share it ($A_i$) and shrinks with the papers already published in it ($P$).",
                   r"La fe en una teoría crece con quienes la comparten en el vecindario ($A_i$) y decrece con los artículos ya publicados en ella ($P$)."))
        self.play(Create(me), LaggedStart(*[Create(s) for s in nbs], lag_ratio=0.08), run_time=1.2)
        self.play(Write(faith), run_time=1.2)
        self.wait(3.2)
        cap.show(T(r"The more has been done within a theory, the less is left to find in it.",
                   r"Cuanto más se ha hecho dentro de una teoría, menos queda por descubrir en ella."))
        self.wait(2.6)

        weights = VGroup(math(r"w_i(T_i) = D\,F_i \qquad w_i(T_v) = F_v", INK, 0.72),
                         math(r"w_i(T^{*}) = \frac{I\,c_i}{\sum_v F_v + F_i}", INK, 0.72)).arrange(DOWN, buff=0.16).move_to([0, -1.88, 0])
        cap.show(T(r"Each year a scientist stays, takes a neighbour’s theory or proposes a new one ($T^{*}$), with chances in proportion to these weights.",
                   r"Cada año, cada integrante se queda, adopta una teoría del vecindario o propone una nueva ($T^{*}$), con probabilidades proporcionales a estos pesos."))
        self.play(ReplacementTransform(faith, weights), run_time=1.0)
        self.wait(3.6)
        cap.show(T(r"A new theory is likely only when faith around the scientist is low.",
                   r"Una teoría nueva es probable solo cuando hay poca fe alrededor."))
        self.wait(2.8)
        self.play(FadeOut(weights), FadeOut(me), FadeOut(nbs), run_time=0.7)

        # the history strip and the year
        strip = ImageMobject(strip_image(0)).set_resampling_algorithm(RESAMPLING_ALGORITHMS["nearest"])
        strip.height = (BAND + BGAP + SH) / 135; strip.move_to([0, -1.68, 0])
        status = Text(phase_text(0), font="Alegreya", color=INK2, font_size=27).next_to(grid, UP, buff=0.1)
        cap.show(T(r"This is my notebook’s run with seed 10. Everyone starts in one theory: normal science. Below, each theory’s share over the years.",
                   r"Esta es la corrida de mi cuaderno con la semilla 10. Toda la comunidad empieza en una teoría: ciencia normal. Abajo, la proporción de cada teoría en el tiempo."))
        self.play(FadeIn(strip), FadeIn(status), run_time=0.8)
        self.wait(4.0)

        state = {"y": 0}
        def go_to(target, per_year=1 / 15):
            while state["y"] < target:
                state["y"] += 1
                y = state["y"]
                new_grid = ImageMobject(grid_image(y)).set_resampling_algorithm(RESAMPLING_ALGORITHMS["nearest"])
                new_grid.height = GRID_UNITS; new_grid.move_to(gcenter)
                new_strip = ImageMobject(strip_image(y)).set_resampling_algorithm(RESAMPLING_ALGORITHMS["nearest"])
                new_strip.height = strip.height; new_strip.move_to(strip)
                new_status = Text(phase_text(y), font="Alegreya", color=INK2, font_size=27).next_to(new_grid, UP, buff=0.1)
                self.remove(grid_ref[0], strip_ref[0], status_ref[0])
                self.add(new_grid, new_strip, new_status)
                grid_ref[0], strip_ref[0], status_ref[0] = new_grid, new_strip, new_status
                self.wait(per_year)
        grid_ref, strip_ref, status_ref = [grid], [strip], [status]

        go_to(86)
        cap.show(T(r"Year 86: the paradigm loses its majority. Faith in it has worn thin; new theories appear and none takes over. A crisis.",
                   r"Año 86: el paradigma pierde la mayoría. La fe en él se desgastó; aparecen teorías nuevas y ninguna se impone. Una crisis."))
        self.wait(4.5)
        go_to(211, per_year=1 / 18)
        cap.show(T(r"By year 211, a new theory has held the majority for ten years, since year 202: a revolution, and a new paradigm.",
                   r"En el año 211, una teoría nueva lleva diez años con la mayoría, desde el año 202: una revolución y un nuevo paradigma."))
        self.wait(5.0)
        go_to(300, per_year=1 / 18)
        cap.show(T(r"Paradigms form, fall into crisis and give way to new ones, out of nothing but local choices.",
                   r"Los paradigmas se forman, entran en crisis y dan paso a otros nuevos, solo a partir de elecciones locales."))
        self.wait(4.0)

        self.play(FadeOut(Group(grid_ref[0], strip_ref[0], status_ref[0], cap.cur)), run_time=0.8)
        cap.cur = None
        end = para(T(r"\centering Run it with other values and seeds:\\[4pt] \textit{joselu14.github.io/kuhn.html}",
                     r"\centering Córrelo con otros valores y semillas:\\[4pt] \textit{joselu14.github.io/kuhn.html}"), align="center")
        self.play(FadeIn(end), run_time=0.8)
        self.wait(3.0)
