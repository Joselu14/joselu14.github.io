"""Shared look for the site's Manim animations: square frame, the site's paper and ink,
Alegreya for text (set by XeLaTeX, so text wraps and can hold inline math) and Latin Modern for formulas."""
import os
from manim import *

LANG = os.environ.get("ANIM_LANG", "en")

config.pixel_width = 1080
config.pixel_height = 1080
config.frame_width = 8
config.frame_height = 8
config.frame_rate = 30

PAPER, PAPER2 = "#e9ebe6", "#dfe2dc"
INK, INK2, FAINT, RULE = "#1b2036", "#4b5165", "#7a808d", "#c3c7c0"
CARMINE, INDIGO = "#a3173f", "#2d3f8f"
OCHRE, VERDIGRIS = "#c9962c", "#3d8b77"
# the theory colours of the Kuhn page (light theme)
PAL = ["#2d3f8f", "#c9962c", "#3d8b77", "#9bbf9f", "#6e4b2e", "#6082c6", "#7a8c2b", "#c77d8e", "#5a6372", "#d0582c", "#6b2f68", "#2b7186"]
config.background_color = PAPER

TPL = TexTemplate(tex_compiler="xelatex", output_format=".xdv", documentclass=r"\documentclass[preview]{standalone}")
TPL.add_to_preamble(r"""
\usepackage{fontspec}
\setmainfont{Alegreya}[Ligatures=TeX, Numbers=OldStyle]
\newfontfamily\fell{IM FELL Double Pica}
\usepackage{amsmath}
\usepackage{xcolor}
\definecolor{ink}{HTML}{1b2036}
\definecolor{inktwo}{HTML}{4b5165}
\definecolor{carmine}{HTML}{a3173f}
\definecolor{indigo}{HTML}{2d3f8f}
\definecolor{ochre}{HTML}{c9962c}
\definecolor{verdigris}{HTML}{3d8b77}
""")


def T(en, es):
    """The text in the language being rendered."""
    return en if LANG == "en" else es


CM = 1.4173      # one centimetre of LaTeX is 1.4173 scene units before scaling
BODY = 0.70      # body text: about 47 px high in a 1080 px frame


def para(s, width=7.0, size=1.0, color=INK, align="flush"):
    """A paragraph of running text that wraps at `width` scene units."""
    k = BODY * size
    env = {"flush": r"\raggedright", "center": r"\centering"}[align]
    t = Tex(r"\parbox{%.3fcm}{%s %s}" % (width / (CM * k), env, s), tex_template=TPL, color=color)
    t.scale(k)
    return t


def title(s, color=INK, size=1.0, max_width=7.3):
    t = Tex(r"{\fell %s}" % s, tex_template=TPL, color=color)
    t.scale(size * 1.1)
    if t.width > max_width:
        t.scale_to_fit_width(max_width)
    return t


def label(s, color=INK2, size=1.0, italic=True):
    t = Tex((r"\textit{%s}" % s) if italic else s, tex_template=TPL, color=color)
    t.scale(size * BODY)
    return t


def math(s, color=INK, size=1.0):
    m = MathTex(s, color=color)
    m.scale(size * 0.9)
    return m


class Caption:
    """The running caption at the bottom of the frame: one paragraph at a time."""
    def __init__(self, scene, y=-3.22, width=7.0):
        self.scene, self.y, self.width, self.cur = scene, y, width, None

    def show(self, s, run_time=0.8, wait=0.0):
        new = para(s, width=self.width)
        new.move_to([0, self.y, 0])
        if new.get_bottom()[1] < -3.82:          # a long caption must not touch the bottom edge
            new.shift((-3.82 - new.get_bottom()[1]) * UP)
        if self.cur is None:
            self.scene.play(FadeIn(new, shift=0.1 * UP), run_time=run_time)
        else:
            self.scene.play(FadeOut(self.cur, run_time=run_time * 0.5), FadeIn(new, shift=0.1 * UP, run_time=run_time))
        self.cur = new
        if wait:
            self.scene.wait(wait)
        return new

    def clear(self, run_time=0.5):
        if self.cur is not None:
            self.scene.play(FadeOut(self.cur), run_time=run_time)
            self.cur = None
