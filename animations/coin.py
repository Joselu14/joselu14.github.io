"""The coin of unknown bias, the arithmetic triangle and Laplace's rule of succession (home page)."""
from math import comb, gamma
from fractions import Fraction
from common import *

TOSSES = "HTHHTH"          # four heads in six tosses: the chance of heads next ends at 5/8
SYM = {"H": T("H", "C"), "T": T("T", "S")}


def beta_pdf(a, b):
    B = gamma(a) * gamma(b) / gamma(a + b)
    return lambda x: (x ** (a - 1)) * ((1 - x) ** (b - 1)) / B


class Coin(Scene):
    def construct(self):
        cap = Caption(self)
        head = title(T("A coin of unknown bias", "Una moneda de sesgo desconocido")).to_edge(UP, buff=0.42)
        self.play(Write(head), run_time=1.2)

        # ---- the prior: every bias equally likely ----
        ax = Axes(x_range=[0, 1, 0.5], y_range=[0, 3, 1], x_length=2.6, y_length=1.9, tips=False,
                  axis_config={"color": INK2, "stroke_width": 2, "include_ticks": True, "tick_size": 0.05})
        ax.move_to([2.3, 0.35, 0])
        xl = VGroup(math("0", INK2, 0.55).next_to(ax.c2p(0, 0), DOWN, buff=0.12),
                    math(r"\tfrac12", INK2, 0.55).next_to(ax.c2p(0.5, 0), DOWN, buff=0.12),
                    math("1", INK2, 0.55).next_to(ax.c2p(1, 0), DOWN, buff=0.12))
        axl = label(T("the bias", "el sesgo"), size=0.8).next_to(xl, DOWN, buff=0.08)
        ayl = label(T("how plausible", "qué tan plausible"), size=0.8).next_to(ax, UP, buff=0.12).align_to(ax, LEFT)
        curve = ax.plot(beta_pdf(1, 1), x_range=[0.001, 0.999], color=CARMINE, stroke_width=4)
        area = ax.get_area(curve, x_range=[0.001, 0.999], color=CARMINE, opacity=0.12)
        self.play(Create(ax), FadeIn(xl), FadeIn(axl), FadeIn(ayl), run_time=1)
        cap.show(T(r"We toss a coin whose bias we don’t know. To begin with, every bias between 0 and 1 seems equally plausible.",
                   r"Lanzamos una moneda cuyo sesgo no conocemos. Al principio, todos los sesgos entre 0 y 1 nos parecen igual de plausibles."))
        self.play(Create(curve), FadeIn(area), run_time=1.2)
        self.wait(4.0)

        # ---- the triangle ----
        rows, dx, dy, x0, y0 = 7, 0.66, 0.52, -1.6, 2.2
        pos = lambda r, k: np.array([x0 + (k - r / 2) * dx, y0 - r * dy, 0])
        cells, nums = {}, {}
        for r in range(rows):
            for k in range(r + 1):
                c = Circle(radius=0.245, color=RULE, stroke_width=2).move_to(pos(r, k))
                c.set_fill(PAPER, 1)
                t = math(str(comb(r, k)), FAINT, 0.55 if comb(r, k) < 10 else 0.5).move_to(pos(r, k))
                cells[(r, k)], nums[(r, k)] = c, t
        tri = VGroup(*[VGroup(cells[key], nums[key]) for key in cells])
        cap.show(T(r"Each toss moves one step down the arithmetic triangle, as Zhu Shijie gave it in 1303: heads to the right, tails to the left.",
                   r"Cada lanzamiento baja un paso por el triángulo aritmético, tal como lo presentó Zhu Shijie en 1303: cara a la derecha, sello a la izquierda."))
        self.play(LaggedStart(*[FadeIn(g, scale=0.9) for g in tri], lag_ratio=0.03), run_time=1.6)
        self.wait(2.5)
        start = (0, 0)
        self.play(cells[start].animate.set_fill(CARMINE, 1).set_stroke(CARMINE), nums[start].animate.set_color(PAPER), run_time=0.4)

        seq_label = label(T("Tosses:", "Lanzamientos:"), size=0.9).move_to([-3.2, 2.85, 0]).align_to([-3.75, 0, 0], LEFT)
        self.play(FadeIn(seq_label), run_time=0.3)
        seq = VGroup()
        prob = math(r"\tfrac{h+1}{n+2} = \tfrac{1}{2}", INK, 0.85).next_to(ax, UP, buff=0.75)
        prob_lab = label(T("chance of heads next", "probabilidad de cara"), size=0.8).next_to(prob, UP, buff=0.12)
        self.play(FadeIn(prob_lab), FadeIn(prob), run_time=0.6)

        r, k, h, n, path_lines = 0, 0, 0, 0, VGroup()
        for i, s in enumerate(TOSSES):
            nr, nk = r + 1, k + (1 if s == "H" else 0)
            h += s == "H"; n += 1
            letter = Tex(SYM[s], tex_template=TPL, color=CARMINE if s == "H" else INDIGO).scale(0.85)
            letter.next_to(seq_label if len(seq) == 0 else seq[-1], RIGHT, buff=0.18)
            seq.add(letter)
            line = Line(pos(r, k), pos(nr, nk), color=CARMINE, stroke_width=5)
            line.set_z_index(-1)
            path_lines.add(line)
            new_curve = ax.plot(beta_pdf(h + 1, n - h + 1), x_range=[0.001, 0.999], color=CARMINE, stroke_width=4)
            new_area = ax.get_area(new_curve, x_range=[0.001, 0.999], color=CARMINE, opacity=0.12)
            fr = Fraction(h + 1, n + 2)
            new_prob = math(r"\tfrac{%d+1}{%d+2} = \tfrac{%d}{%d}" % (h, n, fr.numerator, fr.denominator), INK, 0.85).move_to(prob)
            self.play(FadeIn(letter, shift=0.1 * DOWN),
                      cells[(r, k)].animate.set_fill(INK, 1).set_stroke(INK), nums[(r, k)].animate.set_color(PAPER),
                      Create(line),
                      cells[(nr, nk)].animate.set_fill(CARMINE, 1).set_stroke(CARMINE), nums[(nr, nk)].animate.set_color(PAPER),
                      Transform(curve, new_curve), Transform(area, new_area), Transform(prob, new_prob),
                      run_time=1.2 if i < 2 else 1.0)
            if i == 1:
                cap.show(T(r"The curve shows how plausible each bias is after the tosses so far. With every toss it moves and sharpens.",
                           r"La curva muestra qué tan plausible es cada sesgo tras los lanzamientos hechos. Con cada uno se desplaza y se afina."))
                self.wait(3.0)
            else:
                self.wait(0.5)
            r, k = nr, nk
        self.wait(1.0)

        # ---- order does not matter ----
        cap.show(T(r"The number in each cell counts the sequences of tosses that end there: here $\binom{6}{4} = 15$. Every one of them teaches us the same thing, because the order doesn’t matter.",
                   r"El número de cada casilla cuenta las secuencias de lanzamientos que terminan en ella: aquí $\binom{6}{4} = 15$. Todas nos enseñan lo mismo, porque el orden no importa."))
        others = ["HHHHTT", "TTHHHH", "HTHTHH"]
        for o in others:
            rr, kk, pts = 0, 0, [pos(0, 0)]
            for s in o:
                rr += 1; kk += s == "H"; pts.append(pos(rr, kk))
            ghost = VMobject(color=INDIGO, stroke_width=5, stroke_opacity=0.75).set_points_as_corners(pts)
            ghost.set_z_index(-1)
            self.play(Create(ghost), run_time=0.9)
            self.play(FadeOut(ghost), run_time=0.5)
        self.play(Indicate(VGroup(cells[(6, 4)], nums[(6, 4)]), color=CARMINE, scale_factor=1.35), run_time=1.0)
        self.wait(3.0)

        # ---- the rule of succession ----
        cap.show(T(r"So the chance of heads on the next toss depends only on how many tosses ($n$) and how many heads ($h$). This is Laplace’s rule of succession.",
                   r"Así, la probabilidad de cara en el siguiente lanzamiento solo depende de cuántos lanzamientos ($n$) y cuántas caras ($h$) hubo. Es la regla de sucesión de Laplace."))
        rule = math(r"P(\text{%s}) = \frac{h+1}{n+2} = \frac{4+1}{6+2} = \frac{5}{8}" % T("heads next", "cara"), INK, 0.76)
        box = SurroundingRectangle(rule, color=CARMINE, buff=0.22, stroke_width=2.5)
        rule_g = VGroup(rule, box).move_to([0.15, -1.86, 0])
        self.play(Write(rule), FadeOut(axl), run_time=1.6)
        self.play(Create(box), run_time=0.6)
        self.wait(4.5)

        mean_x = 5 / 8
        mean_line = DashedLine(ax.c2p(mean_x, 0), ax.c2p(mean_x, beta_pdf(5, 3)(mean_x)), color=INK, stroke_width=3)
        cap.show(T(r"It is the average bias under the updated curve. With no tosses it is $\tfrac12$; after many, it comes close to the share of heads.",
                   r"Es el sesgo promedio bajo la curva actualizada. Sin lanzamientos vale $\tfrac12$; tras muchos, se acerca a la proporción de caras."))
        self.play(Create(mean_line), run_time=0.8)
        self.wait(5.0)

        # ---- close ----
        self.play(FadeOut(VGroup(tri, path_lines, seq, seq_label, ax, xl, ayl, curve, area, prob, prob_lab, mean_line, rule_g)), run_time=0.8)
        cap.clear()
        end = para(T(r"\centering Toss the coin yourself on the home page:\\[4pt] \textit{joselu14.github.io}",
                     r"\centering Lanza la moneda en la página de inicio:\\[4pt] \textit{joselu14.github.io}"), align="center")
        self.play(FadeIn(end), run_time=0.8)
        self.wait(3.0)
