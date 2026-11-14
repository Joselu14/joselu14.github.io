"""Same evidence, different attention: the dogmatic ideology clash from the writing sample (attention.html).
Numbers are the page's default scenario: cr(S) 0.80 and 0.15; saliences 0.80/1.00 and 1.00/0.63;
a = 0.65; attended updates 0.95 and 0.03; with all the evidence 0.70 and 0.22."""
from common import *

X0, X1 = -2.35, 3.45            # the credence track, from 0 to 1


def xs(v):
    return X0 + (X1 - X0) * v


class Attention(Scene):
    def construct(self):
        cap = Caption(self)
        head = title(T("Same evidence, different attention", "La misma evidencia, distinta atención")).to_edge(UP, buff=0.42)
        self.play(Write(head), run_time=1.2)

        s_line = para(T(r"\textbf{S}\enspace Capitalism should rule our societies.", r"\textbf{S}\enspace El capitalismo debería regir nuestras sociedades."),
                      width=7.2, size=0.92).move_to([0, 2.78, 0])
        # two credence tracks
        rows = {}
        for name, y in [("Anaí", 1.75), ("Dai", 0.8)]:
            track = Line([X0, y, 0], [X1, y, 0], color=RULE, stroke_width=3)
            nm = Tex(r"{\fell %s}" % name, tex_template=TPL, color=INK).scale(0.95).move_to([-3.25, y, 0])
            rows[name] = (track, nm, y)
        ticks = VGroup(*[VGroup(Line([xs(v), 0.62, 0], [xs(v), 0.5, 0], color=INK2, stroke_width=2),
                                math(t, INK2, 0.55).move_to([xs(v), 0.3, 0])) for v, t in [(0, "0"), (0.5, "0.5"), (1, "1")]])
        crl = label(T(r"credence in S", r"grado de creencia en S"), size=0.85).move_to([xs(0.5), 2.27, 0])
        self.play(FadeIn(s_line), *[Create(rows[n][0]) for n in rows], *[FadeIn(rows[n][1]) for n in rows], FadeIn(ticks), FadeIn(crl), run_time=1.0)

        def marker(v, y, color=INK):
            d = Dot([xs(v), y, 0], radius=0.13, color=color)
            t = math("%.2f" % v, color, 0.6).next_to(d, UP, buff=0.1)
            return VGroup(d, t)
        mA, mD = marker(0.80, 1.75), marker(0.15, 0.8)
        cap.show(T(r"Anaí and Dai disagree about S. Anaí’s credence in S is 0.80; Dai’s is 0.15.",
                   r"Anaí y Dai discrepan sobre S. El grado de creencia de Anaí en S es 0.80; el de Dai, 0.15."))
        self.play(GrowFromCenter(mA), GrowFromCenter(mD), run_time=0.8)
        self.wait(3.0)

        # the same evidence
        ev = VGroup(
            para(T(r"\textbf{H}\enspace Capitalism has led to horrendous social consequences.", r"\textbf{H}\enspace El capitalismo ha tenido consecuencias sociales horrendas."), width=7.2, size=0.88),
            para(T(r"\textbf{V}\enspace Capitalism has led to valuable social consequences.", r"\textbf{V}\enspace El capitalismo ha tenido consecuencias sociales valiosas."), width=7.2, size=0.88),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.18).move_to([0, -0.45, 0])
        ev_box = SurroundingRectangle(ev, color=INK2, buff=0.18, stroke_width=1.5)
        cap.show(T(r"A third party shows them the same evidence, and it cuts both ways.",
                   r"Un tercero les muestra la misma evidencia, que apunta en ambas direcciones."))
        self.play(FadeIn(ev, shift=0.1 * UP), Create(ev_box), run_time=1.0)
        self.wait(2.6)

        # Bayes on everything: they would move closer
        def diamond(v, y):
            d = Square(side_length=0.2, color=INK, stroke_width=2.5).rotate(PI / 4).move_to([xs(v), y, 0])
            t = math("%.2f" % v, INK2, 0.55).next_to(d, DOWN, buff=0.1)
            return VGroup(d, t)
        dA, dD = diamond(0.70, 1.75), diamond(0.22, 0.8)
        cap.show(T(r"If both updated on all of it by Bayes’ rule, they would move closer: Anaí to 0.70 and Dai to 0.22.",
                   r"Si ambos actualizaran con toda ella mediante la regla de Bayes, se acercarían: Anaí a 0.70 y Dai a 0.22."))
        self.play(FadeIn(dA, scale=0.6), FadeIn(dD, scale=0.6), run_time=0.9)
        self.wait(3.6)

        # attention
        cap.show(T(r"But attention is limited. Each attends only to the most salient evidence, and only if its salience is above a threshold $a$.",
                   r"Pero la atención es limitada. Cada quien atiende solo a la evidencia más saliente, y solo si su saliencia supera un umbral $a$."))
        self.wait(3.4)
        sal = math(r"\mathrm{Sal}(E) = 1 - \max\bigl(\mathrm{cr}(P) - \mathrm{cr}(P \mid E),\, 0\bigr)", INK, 0.82).move_to([0, -1.75, 0])
        cap.show(T(r"Both are dogmatic: evidence is less salient the more it would lower their credence in what they care about.",
                   r"Ambos son dogmáticos: la evidencia es menos saliente cuanto más bajaría su grado de creencia en lo que les importa."))
        self.play(Write(sal), run_time=1.4)
        self.wait(3.0)
        cap.show(T(r"What they care about is \textbf{P}: that their own political views are better than the majority’s.",
                   r"Lo que les importa es \textbf{P}: que sus ideas políticas son mejores que las de la mayoría."))
        self.wait(3.2)

        # the saliences
        self.play(FadeOut(VGroup(ev, ev_box)), sal.animate.move_to([0, -0.15, 0]).scale(0.85), run_time=0.8)
        BW = 2.3
        panels, bars = VGroup(), {}
        for name, x, vals in [("Anaí", -3.55, {"H": 0.80, "V": 1.00}), ("Dai", 0.45, {"H": 1.00, "V": 0.63})]:
            g = VGroup()
            nm = Tex(r"{\fell %s}" % name, tex_template=TPL, color=INK).scale(0.8).move_to([x, -0.85, 0], aligned_edge=LEFT)
            g.add(nm)
            for j, e in enumerate(["H", "V"]):
                y = -1.4 - 0.5 * j
                lt = Tex(r"\textbf{%s}" % e, tex_template=TPL, color=INK).scale(0.75).move_to([x + 0.12, y, 0])
                base = Rectangle(width=BW, height=0.22, stroke_width=0).set_fill(PAPER2, 1).move_to([x + 0.42 + BW / 2, y, 0])
                bar = Rectangle(width=BW * vals[e], height=0.22, stroke_width=0).set_fill(INK2, 1)
                bar.move_to(base.get_left(), aligned_edge=LEFT)
                num = math("%.2f" % vals[e], INK2, 0.55).next_to(base, RIGHT, buff=0.12)
                bars[(name, e)] = (lt, bar, num)
                g.add(lt, base, bar, num)
            th = DashedLine([x + 0.42 + BW * 0.65, -1.2, 0], [x + 0.42 + BW * 0.65, -2.1, 0], color=CARMINE, stroke_width=3)
            g.add(th)
            panels.add(g)
        a_lab = math(r"a = 0.65", CARMINE, 0.6).move_to([0.2, -2.3, 0])
        cap.show(T(r"Their saliences differ. With $a = 0.65$, Anaí attends only to V, and Dai only to H.",
                   r"Sus saliencias difieren. Con $a = 0.65$, Anaí atiende solo a V, y Dai solo a H."))
        self.play(LaggedStart(*[FadeIn(p) for p in panels], lag_ratio=0.3), FadeIn(a_lab), run_time=1.2)
        dim = []
        for key in [("Anaí", "H"), ("Dai", "V")]:
            lt, bar, num = bars[key]
            dim += [lt.animate.set_color(FAINT), bar.animate.set_fill(RULE), num.animate.set_color(FAINT)]
        hi = []
        for key in [("Anaí", "V"), ("Dai", "H")]:
            lt, bar, num = bars[key]
            hi += [lt.animate.set_color(CARMINE), bar.animate.set_fill(CARMINE), num.animate.set_color(CARMINE)]
        self.wait(1.4)
        self.play(*dim, *hi, run_time=0.9)
        self.wait(2.6)

        # updating on what they attend to
        cap.show(T(r"Each updates by Bayes’ rule on what they attend to. Anaí rises to 0.95 and Dai falls to 0.03: the same evidence drives them apart.",
                   r"Cada quien actualiza con la regla de Bayes sobre aquello a lo que atiende. Anaí sube a 0.95 y Dai baja a 0.03: la misma evidencia los separa."))
        nA, nD = marker(0.95, 1.75, CARMINE), marker(0.03, 0.8, CARMINE)
        arA = Arrow([xs(0.80), 1.75, 0], [xs(0.95), 1.75, 0], buff=0.14, color=CARMINE, stroke_width=4, max_tip_length_to_length_ratio=0.35)
        arD = Arrow([xs(0.15), 0.8, 0], [xs(0.03), 0.8, 0], buff=0.14, color=CARMINE, stroke_width=4, max_tip_length_to_length_ratio=0.35)
        self.play(mA.animate.set_opacity(0.35), mD.animate.set_opacity(0.35), run_time=0.4)
        self.play(GrowArrow(arA), GrowArrow(arD), FadeIn(nA), FadeIn(nD), run_time=1.3)
        self.wait(4.4)

        cap.show(T(r"Both agents are Bayesian. What differs is what they attend to.",
                   r"Ambos agentes son bayesianos. Lo que cambia es aquello a lo que atienden."))
        self.wait(3.0)

        # close
        everything = Group(*[m for m in self.mobjects if m is not head])
        self.play(FadeOut(everything), run_time=0.8)
        cap.cur = None
        end = para(T(r"\centering Change the agents, the attention policies and the thresholds:\\[4pt] \textit{joselu14.github.io/attention.html}",
                     r"\centering Cambia los agentes, las políticas atencionales y los umbrales:\\[4pt] \textit{joselu14.github.io/attention.html}"), align="center")
        self.play(FadeIn(end), run_time=0.8)
        self.wait(3.0)
