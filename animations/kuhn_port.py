"""Plain-Python port of Joselu's Science-Agent-Based-Model notebook (Model_Spanish.ipynb).

It keeps the notebook's order of random draws, so with seed(10) it should reproduce the
notebook's runs exactly. This is the reference for the JavaScript version on the site.
"""
import random, json, sys


def neighbours(rows, cols):
    """Moore neighbourhood without wrap-around, in the notebook's order (row by row)."""
    out = []
    for r in range(rows):
        for c in range(cols):
            out.append([rr * cols + cc for rr in range(max(r - 1, 0), min(r + 2, rows))
                        for cc in range(max(c - 1, 0), min(c + 2, cols)) if (rr, cc) != (r, c)])
    return out


def run(state, rows=30, cols=30, I=1.1, D=6.5, T=300, p=0.7, alpha=5.8, seed=10, rng=None):
    rng = rng or random.Random(seed)
    n = rows * cols
    if state == "hom":
        theory = [10] * n
    elif state == "het":
        theory = [rng.randint(0, n) for _ in range(n)]
    elif state == "bif":
        half = round(n / 2)
        theory = [9] * half + [132] * (n - half)
    character = [rng.random() for _ in range(n)]
    nb = neighbours(rows, cols)
    pubs = {}                     # cumulative publications per theory (one per scientist per year)
    for t in theory:
        pubs[t] = pubs.get(t, 0) + 1
    ever = set(pubs)              # every theory that has ever had a publication
    history = [theory[:]]
    for year in range(T):
        faith = []
        for i in range(n):
            A = sum(1 for j in nb[i] if theory[j] == theory[i])
            P = float(pubs[theory[i]])
            if character[i] <= p:
                faith.append((A + 1) ** alpha / (P + 1))
            else:
                faith.append((A + 1) ** alpha / ((P + 1) ** (character[i] * 2)))
        new = [0] * n
        for i in range(n):
            nf = [faith[j] for j in nb[i]]
            S = sum(nf)
            W = I * character[i] / (S + faith[i])       # the notebook's innovation weight
            den = S + W + faith[i] * D
            acc, cum = [], 0.0
            for x in nf:
                cum += x / den
                acc.append(cum)
            stay = cum + faith[i] * D / den
            choice = rng.random()
            if choice < acc[-1]:
                for m, a in enumerate(acc):
                    if choice < a:
                        new[i] = theory[nb[i][m]]
                        break
            elif choice < stay:
                new[i] = theory[i]
            else:
                t = rng.randint(0, n ** 2)
                while t in ever:
                    t = rng.randint(0, n ** 2)
                new[i] = t
        theory = new
        for t in theory:
            pubs[t] = pubs.get(t, 0) + 1
        ever |= set(theory)
        history.append(theory[:])
    return history


if __name__ == "__main__":
    state, T = sys.argv[1], int(sys.argv[2])
    h = run(state, T=T)
    json.dump({"n": [len(set(x)) for x in h], "final": h[-1]}, open(f"port_{state}.json", "w"))
    print(state, [len(set(x)) for x in h][:80])
