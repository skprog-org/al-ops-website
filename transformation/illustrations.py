#!/usr/bin/env python3
"""Editorial illustrations for the AL Ops site, drawn as SVG.

Brief: "from a control room to a business in motion". Palette: obsidian #0B1018, deep slate #17212D,
warm white #F5F3ED, soft grey #BEC6D1, restrained blue #77A9FF. No cyan, no glowing networks,
no dashboards, no logos, no metrics. Run:  python3 illustrations.py  (writes assets/img/*.svg)
"""
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "img")

OBS = "#0B1018"
SLATE = "#17212D"
SLATE2 = "#223042"
SLATE3 = "#2E3E52"
WARM = "#F5F3ED"
GREY = "#BEC6D1"
BLUE = "#77A9FF"
BLUE_D = "#4E7BC4"
SKIN = ["#E6C3A5", "#C99672", "#9C6644", "#6E4630", "#D8A987"]
HAIR = ["#1A1410", "#3A2A1E", "#6B4E37", "#0E0E10", "#8A8378"]
CLOTH = {"navy": "#24344A", "charcoal": "#2A2F38", "blue": BLUE_D, "grey": "#8C96A3", "warm": "#D9D3C4",
         "sand": "#B8A98E", "vest": "#C9D2DC", "olive": "#4A5240"}


class Svg:
    def __init__(self, w, h, title, desc):
        self.w, self.h = w, h
        self.parts = []
        self.defs = []
        self.title, self.desc = title, desc

    def add(self, s):
        self.parts.append(s)

    def defs_add(self, s):
        self.defs.append(s)

    def render(self):
        return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" role="img" aria-labelledby="t d">'
                '<title id="t">%s</title><desc id="d">%s</desc><defs>%s</defs>%s</svg>'
                % (self.w, self.h, self.w, self.h, self.title, self.desc, "".join(self.defs), "".join(self.parts)))


def rect(x, y, w, h, fill, rx=0, op=1, extra=""):
    return '<rect x="%g" y="%g" width="%g" height="%g" rx="%g" fill="%s" opacity="%g" %s/>' % (x, y, w, h, rx, fill, op, extra)


def poly(pts, fill, op=1):
    return '<polygon points="%s" fill="%s" opacity="%g"/>' % (" ".join("%g,%g" % p for p in pts), fill, op)


def path(d, fill="none", stroke=None, sw=1, op=1, cap="round"):
    st = ' stroke="%s" stroke-width="%g" stroke-linecap="%s" stroke-linejoin="round"' % (stroke, sw, cap) if stroke else ""
    return '<path d="%s" fill="%s"%s opacity="%g"/>' % (d, fill, st, op)


def circle(x, y, r, fill, op=1):
    return '<circle cx="%g" cy="%g" r="%g" fill="%s" opacity="%g"/>' % (x, y, r, fill, op)


def ellipse(x, y, rx, ry, fill, op=1):
    return '<ellipse cx="%g" cy="%g" rx="%g" ry="%g" fill="%s" opacity="%g"/>' % (x, y, rx, ry, fill, op)


def grad(svg, gid, stops, x1=0, y1=0, x2=0, y2=1):
    s = "".join('<stop offset="%g" stop-color="%s" stop-opacity="%g"/>' % st for st in stops)
    svg.defs_add('<linearGradient id="%s" x1="%g" y1="%g" x2="%g" y2="%g">%s</linearGradient>' % (gid, x1, y1, x2, y2, s))


def rgrad(svg, gid, stops, cx=.5, cy=.5, r=.5):
    s = "".join('<stop offset="%g" stop-color="%s" stop-opacity="%g"/>' % st for st in stops)
    svg.defs_add('<radialGradient id="%s" cx="%g" cy="%g" r="%g">%s</radialGradient>' % (gid, cx, cy, r, s))


# ---------------------------------------------------------------- people
def person(x, g, s=1.0, top="navy", bottom="charcoal", skin=0, hair=0, pose="stand", f=1, hairstyle="short",
           hat=False, obj=None, vest=False, sit_h=0):
    """Flat editorial figure. x = centre, g = ground y, s = scale, f = facing (1 right, -1 left)."""
    T, B = CLOTH.get(top, top), CLOTH.get(bottom, bottom)
    sk, hr = SKIN[skin % len(SKIN)], HAIR[hair % len(HAIR)]

    def P(dx, dy):
        return (x + dx * s * f, g + dy * s)

    def pt(dx, dy):
        a, b = P(dx, dy)
        return "%g %g" % (a, b)

    o = [ellipse(x, g + 2 * s, 30 * s, 6 * s, "#000", .35)]
    hip = -86 if pose != "sit" else -(sit_h or 70)
    # legs
    if pose == "sit":
        for dx, shade in ((-6, .85), (6, 1)):
            o.append(path("M%s L%s L%s" % (pt(dx, hip), pt(dx + 42, hip), pt(dx + 42, 0)), stroke=B, sw=11 * s, op=shade))
            o.append(path("M%s L%s" % (pt(dx + 38, -2), pt(dx + 52, -2)), stroke="#111418", sw=7 * s))
    elif pose == "walk":
        o.append(path("M%s L%s L%s" % (pt(-4, hip), pt(-14, -40), pt(-22, 0)), stroke=B, sw=11 * s, op=.85))
        o.append(path("M%s L%s L%s" % (pt(4, hip), pt(14, -42), pt(24, -2)), stroke=B, sw=11 * s))
        o.append(path("M%s L%s" % (pt(-28, -1), pt(-14, -1)), stroke="#111418", sw=7 * s))
        o.append(path("M%s L%s" % (pt(20, -2), pt(34, -2)), stroke="#111418", sw=7 * s))
    else:
        for dx, shade in ((-7, .85), (7, 1)):
            o.append(path("M%s L%s" % (pt(dx, hip), pt(dx, -4)), stroke=B, sw=11 * s, op=shade))
            o.append(path("M%s L%s" % (pt(dx - 2, -2), pt(dx + 10, -2)), stroke="#111418", sw=7 * s))
    sh = hip - 64
    # back arm (behind torso)
    arm = 9 * s

    def armpath(pts, shade=1.0):
        return path("M" + " L".join(pt(a, b) for a, b in pts), stroke=T, sw=arm, op=shade)

    back = {"stand": [(-15, sh + 6), (-18, sh + 34), (-17, sh + 58)],
            "point": [(-15, sh + 6), (-18, sh + 34), (-16, sh + 58)],
            "hold": [(-14, sh + 6), (-10, sh + 34), (14, sh + 40)],
            "phone": [(-15, sh + 6), (-18, sh + 34), (-17, sh + 58)],
            "sit": [(-12, sh + 6), (6, sh + 30), (28, sh + 36)],
            "walk": [(-14, sh + 6), (-24, sh + 30), (-28, sh + 52)],
            "push": [(-12, sh + 6), (18, sh + 26), (44, sh + 34)],
            "reach": [(-15, sh + 6), (-18, sh + 34), (-17, sh + 58)],
            "present": [(-15, sh + 6), (-18, sh + 34), (-17, sh + 58)]}[pose]
    o.append(armpath(back, .8))
    o.append(circle(*P(*back[-1]), 4.2 * s, sk, .9))
    # torso
    o.append(path("M%s Q%s %s L%s L%s Z" % (pt(-18, sh + 4), pt(0, sh - 4), pt(18, sh + 4), pt(15, hip + 4), pt(-15, hip + 4)), fill=T))
    if vest:
        o.append(path("M%s L%s L%s L%s Z" % (pt(-15, sh + 10), pt(15, sh + 10), pt(13, hip + 2), pt(-13, hip + 2)), fill=CLOTH["vest"], op=.9))
        o.append(path("M%s L%s" % (pt(-14, sh + 40), pt(14, sh + 40)), stroke=BLUE, sw=3 * s))
    # front arm
    front = {"stand": [(15, sh + 6), (18, sh + 34), (17, sh + 58)],
             "point": [(15, sh + 6), (40, sh - 4), (62, sh - 12)],
             "hold": [(14, sh + 6), (16, sh + 34), (24, sh + 36)],
             "phone": [(14, sh + 6), (18, sh + 30), (8, sh - 8)],
             "sit": [(12, sh + 6), (22, sh + 30), (40, sh + 34)],
             "walk": [(14, sh + 6), (22, sh + 30), (28, sh + 50)],
             "push": [(12, sh + 6), (24, sh + 28), (48, sh + 32)],
             "reach": [(15, sh + 6), (22, sh - 22), (26, sh - 50)],
             "present": [(15, sh + 6), (36, sh + 16), (58, sh + 6)]}[pose]
    o.append(armpath(front))
    hx, hy = P(*front[-1])
    o.append(circle(hx, hy, 4.2 * s, sk))
    # held objects
    if obj == "clipboard":
        cx, cy = P(10, sh + 22)
        o.append('<g transform="rotate(%g %g %g)">%s%s</g>' % (-12 * f, cx, cy, rect(cx - 13 * s, cy - 17 * s, 26 * s, 34 * s, WARM, 2 * s),
                                                             rect(cx - 9 * s, cy - 11 * s, 18 * s, 2 * s, GREY) + rect(cx - 9 * s, cy - 5 * s, 14 * s, 2 * s, GREY)))
    elif obj == "tablet":
        cx, cy = P(18, sh + 30)
        o.append('<g transform="rotate(%g %g %g)">%s%s</g>' % (-20 * f, cx, cy, rect(cx - 15 * s, cy - 10 * s, 30 * s, 20 * s, "#10151C", 2 * s),
                                                             rect(cx - 12 * s, cy - 7 * s, 24 * s, 14 * s, "#3A4A5E", 1 * s)))
    elif obj == "folder":
        cx, cy = P(26, sh + 36)
        o.append(rect(cx - 14 * s, cy - 10 * s, 28 * s, 20 * s, "#C8BEA8", 1.5 * s))
    elif obj == "bag":
        cx, cy = P(-17, sh + 70)
        o.append(rect(cx - 12 * s, cy - 6 * s, 24 * s, 26 * s, "#6E5A48", 3 * s))
    # head
    hcx, hcy = P(2, sh - 16)
    o.append(path("M%s L%s" % (pt(0, sh + 2), pt(1, sh - 8)), stroke=sk, sw=8 * s))
    o.append(circle(hcx, hcy, 13 * s, sk))
    o.append(circle(hcx + 11 * s * f, hcy + 1 * s, 2.4 * s, sk))
    if hat:
        o.append(path("M%g %g A%g %g 0 0 1 %g %g Z" % (hcx - 14 * s, hcy - 2 * s, 14 * s, 13 * s, hcx + 14 * s, hcy - 2 * s), fill=WARM))
        o.append(rect(hcx - 17 * s if f > 0 else hcx - 13 * s, hcy - 3.5 * s, 30 * s, 3.5 * s, WARM, 1.5 * s))
    elif hairstyle == "short":
        o.append(path("M%g %g A%g %g 0 0 1 %g %g Q%g %g %g %g Z" % (hcx - 13 * s, hcy, 13 * s, 13 * s, hcx + 13 * s, hcy,
                                                                  hcx, hcy - 7 * s, hcx - 13 * s, hcy), fill=hr))
    elif hairstyle == "long":
        o.append(path("M%g %g A%g %g 0 0 1 %g %g L%g %g Q%g %g %g %g Z" % (hcx - 14 * s, hcy + 16 * s, 14 * s, 15 * s, hcx + 14 * s, hcy + 2 * s,
                                                                         hcx + 8 * s * f, hcy - 4 * s, hcx - 4 * s, hcy - 9 * s, hcx - 14 * s, hcy + 16 * s), fill=hr))
    elif hairstyle == "bun":
        o.append(path("M%g %g A%g %g 0 0 1 %g %g Q%g %g %g %g Z" % (hcx - 13 * s, hcy, 13 * s, 13 * s, hcx + 13 * s, hcy,
                                                                  hcx, hcy - 6 * s, hcx - 13 * s, hcy), fill=hr))
        o.append(circle(hcx - 12 * s * f, hcy - 8 * s, 6 * s, hr))
    elif hairstyle == "cap":
        o.append(path("M%g %g A%g %g 0 0 1 %g %g Z" % (hcx - 13.5 * s, hcy - 1 * s, 13.5 * s, 13 * s, hcx + 13.5 * s, hcy - 1 * s), fill=CLOTH["olive"]))
        o.append(rect(hcx if f > 0 else hcx - 20 * s, hcy - 3 * s, 20 * s, 3.5 * s, CLOTH["olive"], 1.5 * s))
    return "".join(o)


# ---------------------------------------------------------------- props
def pallet(x, g, w=90, h=60, s=1.0, tone=SLATE3):
    o = [rect(x, g - 8 * s, w * s, 8 * s, "#3B3226")]
    rows = int(h // 22) or 1
    for r in range(rows):
        for c in range(int(w // 30)):
            o.append(rect(x + (c * 30 + 1) * s, g - 8 * s - (r + 1) * 22 * s, 28 * s, 21 * s, "#8A7458" if (r + c) % 2 else "#9C8466"))
    o.append(rect(x, g - 8 * s - rows * 22 * s, w * s, rows * 22 * s, "#000", 0, .12))
    return "".join(o)


def racking(x, g, w, h, bays=3, levels=4, tone=SLATE2, boxes=True):
    o = []
    bw = w / bays
    lh = h / levels
    for b in range(bays + 1):
        o.append(rect(x + b * bw - 3, g - h, 6, h, tone))
    for l in range(1, levels + 1):
        o.append(rect(x, g - l * lh, w, 5, BLUE_D, 0, .55))
        if boxes and l < levels:
            for b in range(bays):
                bx = x + b * bw + 10
                for k in range(3):
                    if (b + l + k) % 4:
                        o.append(rect(bx + k * (bw - 20) / 3, g - l * lh - lh * .55, (bw - 20) / 3 - 4, lh * .55 - 2,
                                      "#6F6152" if (b + k) % 2 else "#5C5145", 2, .85))
    return "".join(o)


def truck_rear(x, y, w, h):
    return (rect(x, y, w, h, "#1B232E", 4) + rect(x + 6, y + 6, w / 2 - 9, h - 16, "#26303C", 2)
            + rect(x + w / 2 + 3, y + 6, w / 2 - 9, h - 16, "#26303C", 2) + rect(x, y + h - 8, w, 8, "#12171E")
            + rect(x + 8, y + h - 20, 10, 6, "#8A4A3A") + rect(x + w - 18, y + h - 20, 10, 6, "#8A4A3A"))


def lamp(svg, x, y, spread, drop, gid, op=.22):
    rgrad(svg, gid, [(0, WARM, op), (1, WARM, 0)], .5, 0, 1)
    return (poly([(x - 10, y), (x + 10, y), (x + spread, y + drop), (x - spread, y + drop)], "url(#%s)" % gid)
            + rect(x - 16, y - 6, 32, 8, "#2B3645", 3) + rect(x - 10, y + 1, 20, 3, WARM, 1, .9))


def window(x, y, w, h, panes=3, sky="url(#sky)", frame="#0E141B"):
    o = [rect(x, y, w, h, sky)]
    for i in range(1, panes):
        o.append(rect(x + i * w / panes - 3, y, 6, h, frame))
    o.append(rect(x - 6, y - 6, w + 12, 8, frame) + rect(x - 6, y + h - 2, w + 12, 10, frame))
    return "".join(o)


def skyline(x0, x1, base, seed=1, tone="#1A2533", lit=True):
    o = []
    x = x0
    k = seed
    while x < x1:
        k = (k * 7919 + 13) % 997
        bw = 40 + k % 70
        bh = 60 + (k * 3) % 180
        o.append(rect(x, base - bh, bw, bh, tone))
        if lit:
            for wy in range(int(base - bh + 12), int(base - 10), 16):
                for wx in range(int(x + 8), int(x + bw - 8), 14):
                    if (wx * 3 + wy + k) % 5 == 0:
                        o.append(rect(wx, wy, 6, 8, WARM, 0, .55))
        x += bw + 6
    return "".join(o)


def label_tag(x, y, w=26, h=16):
    return rect(x, y, w, h, WARM, 2) + rect(x + 4, y + 5, w - 8, 2, "#7C8591") + rect(x + 4, y + 9, w - 12, 2, "#7C8591")


def noise_overlay(svg, w, h):
    svg.defs_add('<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/>'
                 '<feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .05 0"/></filter>')
    return '<rect width="%d" height="%d" filter="url(#grain)"/>' % (w, h)


def vignette(svg, w, h):
    rgrad(svg, "vig", [(0.55, OBS, 0), (1, OBS, .75)], .5, .5, .75)
    return rect(0, 0, w, h, "url(#vig)")


# ---------------------------------------------------------------- scene 1: business in motion (hero)
# The hero is composed from named parts; scene_hero() stacks them into the static SVG.
HERO_W, HERO_H = 2400, 1000
HERO_FX, HERO_FY = 1300, 790   # forklift reference point
HERO_DOCKS = [760, 1120, 1480]


def hero_bg(S, indicators=True, truck2=True):
    W, H = HERO_W, HERO_H
    grad(S, "bg", [(0, "#0E1520", 1), (1, SLATE, 1)])
    grad(S, "floor", [(0, "#1A2430", 1), (1, "#0D131B", 1)])
    grad(S, "dock", [(0, "#F5F3ED", .95), (1, "#E8D9BC", .75)])
    rgrad(S, "spill", [(0, WARM, .22), (1, WARM, 0)], .5, 0, .9)
    o = [rect(0, 0, W, H, "url(#bg)")]
    # back wall and roof trusses
    o.append(rect(0, 120, W, 520, "#141D29"))
    for i in range(0, W, 160):
        o.append(path("M%d 120 L%d 60 L%d 120" % (i, i + 80, i + 160), stroke="#1E2A38", sw=6))
    o.append(rect(0, 56, W, 10, "#1E2A38"))
    # docks
    for i, dx in enumerate(HERO_DOCKS):
        o.append(rect(dx, 300, 280, 340, "url(#dock)"))
        if i != 1 or truck2:
            o.append(hero_truck(dx))
        o.append(rect(dx - 10, 290, 300, 14, "#0E141B") + rect(dx - 10, 290, 14, 350, "#0E141B") + rect(dx + 276, 290, 14, 350, "#0E141B"))
        o.append(rect(dx + 110, 250, 60, 28, "#0E141B", 3))
        if indicators:
            o.append(rect(dx + 118, 258, 44, 12, BLUE, 2, .8 if i == 1 else .35))
        o.append(poly([(dx, 640), (dx + 280, 640), (dx + 420, 1000), (dx - 140, 1000)], "url(#spill)"))
    # floor
    o.append(rect(0, 640, W, 360, "url(#floor)"))
    for i in range(-400, W + 400, 360):
        o.append(path("M%d 640 L%d 1000" % (i + 900, (i + 900 - 1200) * 1.8 + 1200), stroke="#C9B77A", sw=5, op=.18))
    o.append(path("M0 820 L%d 820" % W, stroke="#C9B77A", sw=4, op=.15))
    # racking left and right
    o.append(racking(40, 660, 560, 460, bays=3, levels=5))
    o.append(racking(1880, 660, 480, 460, bays=3, levels=5))
    return "".join(o)


def hero_truck(dx):
    return truck_rear(dx + 28, 360, 224, 260)


def hero_forklift(S):
    fx, fy = HERO_FX, HERO_FY
    return (ellipse(fx + 60, fy + 6, 130, 12, "#000", .4)
            + rect(fx, fy - 90, 140, 70, "#C7A23E", 8) + rect(fx + 20, fy - 170, 70, 80, "none", 0, 1, 'stroke="#20262E" stroke-width="8"')
            + rect(fx + 112, fy - 60, 30, 40, "#20262E") + circle(fx + 26, fy - 16, 22, "#12161C") + circle(fx + 110, fy - 16, 22, "#12161C")
            + rect(fx - 18, fy - 200, 10, 190, "#2A3038")
            + person(fx + 58, fy - 50, 0.8, top="vest", bottom="charcoal", skin=2, hair=0, pose="sit", f=-1, hat=True, sit_h=40))


def hero_forks(S):
    return rect(HERO_FX - 90, HERO_FY - 30, 80, 8, "#2A3038")


def hero_fork_pallet(S):
    return pallet(HERO_FX - 96, HERO_FY - 30, 84, 66, 1)


def hero_jack(S):
    return pallet(470, 900, 120, 66, 1.1) + path("M600 900 L640 900 L700 830", stroke="#2A3038", sw=8)


def hero_worker(S):
    return person(720, 905, 1.15, top="blue", bottom="charcoal", skin=1, hair=1, pose="push", f=-1, hat=True, vest=False)


def hero_team(S):
    return (person(1880, 980, 1.9, top="navy", bottom="charcoal", skin=3, hair=0, pose="point", f=-1, hairstyle="short")
            + person(2070, 985, 1.95, top="warm", bottom="#2B2F36", skin=0, hair=2, pose="hold", f=-1, hairstyle="long", obj="clipboard"))


def hero_overlay(S):
    return vignette(S, HERO_W, HERO_H) + noise_overlay(S, HERO_W, HERO_H)


def scene_hero():
    S = Svg(HERO_W, HERO_H, "A distribution hub at dusk",
            "Illustration. Inside a distribution hub at dusk, trucks wait at three open loading docks. A forklift moves a pallet "
            "across the floor while a shift lead and a planner review the loading plan on a clipboard in the foreground.")
    S.add(hero_bg(S))
    S.add(hero_forklift(S) + hero_forks(S) + hero_fork_pallet(S))
    S.add(hero_jack(S) + hero_worker(S))
    S.add(hero_team(S))
    S.add(hero_overlay(S))
    return S


# ---------------------------------------------------------------- scene 2: operations recovery
def scene_operations():
    W, H = 1600, 900
    S = Svg(W, H, "Resolving a supply interruption on the production floor",
            "Illustration. On a production floor, a supervisor, a planner with a tablet and an operator gather at a standing table "
            "to agree a recovery plan while the line behind them runs with one station paused.")
    grad(S, "bg", [(0, "#101824", 1), (1, SLATE, 1)])
    grad(S, "fl", [(0, "#1B2531", 1), (1, "#0C1219", 1)])
    S.add(rect(0, 0, W, H, "url(#bg)"))
    S.add(rect(0, 80, W, 420, "#131C27"))
    for i in range(6):
        S.add(window(60 + i * 260, 110, 200, 120, panes=2, sky="#1F2B3A"))
    S.add(rect(0, 500, W, 400, "url(#fl)"))
    # line machinery
    S.add(rect(0, 400, W, 26, "#2B3747") + rect(0, 426, W, 10, "#161E28"))
    for i, mx in enumerate([80, 520, 960, 1360]):
        S.add(rect(mx, 250, 180, 150, SLATE3, 8) + rect(mx + 20, 270, 60, 40, "#1A2330", 4) + rect(mx + 100, 272, 60, 8, GREY, 2, .5))
        S.add(rect(mx + 30, 400, 14, 100, "#1F2835") + rect(mx + 136, 400, 14, 100, "#1F2835"))
    for bx in range(40, W, 110):
        paused = 740 < bx < 860
        S.add(rect(bx, 372, 70, 28, "#8E7A5E" if not paused else "#A38B69", 3))
        if paused:
            S.add(label_tag(bx + 22, 344))
    S.add(rect(760, 330, 120, 3, WARM, 0, .5))
    # lamps
    for i, lx in enumerate([300, 800, 1300]):
        S.add(lamp(S, lx, 30, 160, 470, "lp%d" % i))
    # pallets
    S.add(pallet(60, 720, 120, 88, 1.1) + pallet(1400, 700, 90, 66, 1))
    # standing table with plan sheets
    S.add(ellipse(800, 820, 230, 16, "#000", .4))
    S.add(rect(600, 640, 400, 18, "#3A4656", 4) + rect(620, 658, 14, 160, "#232C38") + rect(966, 658, 14, 160, "#232C38"))
    S.add('<g transform="rotate(-4 700 628)">%s</g>' % (rect(640, 612, 130, 28, WARM, 2) + "".join(rect(650, 618 + k * 6, 100 - k * 14, 2, "#7C8591") for k in range(3))))
    S.add('<g transform="rotate(3 850 630)">%s</g>' % (rect(800, 614, 120, 26, "#E9E4D8", 2)
                                                       + "".join(rect(810 + k * 24, 632 - (8 + (k * 5) % 12), 14, 8 + (k * 5) % 12, BLUE, 1, .7) for k in range(4))))
    # people
    S.add(person(560, 830, 1.55, top="navy", bottom="charcoal", skin=1, hair=0, pose="point", f=1, hairstyle="short"))
    S.add(person(1060, 835, 1.55, top="warm", bottom="#2C3038", skin=4, hair=3, pose="hold", f=-1, hairstyle="bun", obj="tablet"))
    S.add(person(820, 860, 1.6, top="blue", bottom="blue", skin=2, hair=1, pose="stand", f=1, hat=True, vest=False))
    S.add(vignette(S, W, H) + noise_overlay(S, W, H))
    return S


# ---------------------------------------------------------------- scene 3: customer experience
def scene_customer():
    W, H = 1600, 900
    S = Svg(W, H, "A service counter connected to the team behind it",
            "Illustration. At a service counter a staff member hands a customer a completed document. Behind a glass partition, "
            "a back-office colleague passes the next case file through while another takes a call.")
    grad(S, "bg", [(0, "#101824", 1), (1, "#1A2533", 1)])
    grad(S, "glass", [(0, "#9FB4CC", .10), (1, "#9FB4CC", .04)], 0, 0, 1, 0)
    S.add(rect(0, 0, W, H, "url(#bg)"))
    # back office
    S.add(rect(760, 90, 840, 520, "#162030"))
    S.add(window(1100, 150, 380, 200, panes=3, sky="#233247"))
    S.add(skyline(1100, 1480, 350, seed=5, tone="#1B2636"))
    for dx in (860, 1180):
        S.add(rect(dx, 470, 260, 14, "#384456", 3) + rect(dx + 20, 484, 10, 120, "#222B37") + rect(dx + 230, 484, 10, 120, "#222B37"))
        S.add(rect(dx + 80, 418, 90, 52, "#10151C", 3) + rect(dx + 86, 424, 78, 40, "#34455A", 2) + rect(dx + 118, 470, 14, 6, "#10151C"))
    S.add(person(1300, 605, 1.2, top="grey", bottom="charcoal", skin=3, hair=0, pose="phone", f=-1, hairstyle="short"))
    S.add(person(930, 610, 1.2, top="navy", bottom="charcoal", skin=0, hair=4, pose="hold", f=-1, hairstyle="bun", obj="folder"))
    # partition
    S.add(rect(740, 70, 20, 560, "#0F151D") + rect(760, 70, 840, 540, "url(#glass)"))
    S.add(path("M820 120 L900 520", stroke=WARM, sw=3, op=.06) + path("M1300 110 L1380 500", stroke=WARM, sw=3, op=.06))
    # pass-through slot
    S.add(rect(700, 470, 100, 24, "#0F151D", 3))
    # front area
    S.add(rect(0, 610, W, 290, "#121A24"))
    S.add(rect(0, 90, 740, 520, "#131B26"))
    S.add(lamp(S, 250, 60, 140, 420, "lc1") + lamp(S, 560, 60, 140, 420, "lc2"))
    # counter: staff member stands behind it, customer in front
    S.add(person(560, 700, 1.55, top="blue", bottom="charcoal", skin=1, hair=2, pose="present", f=-1, hairstyle="long"))
    S.add(rect(200, 560, 560, 26, "#3E4A5C", 4) + rect(220, 586, 520, 150, "#1D2733", 4) + rect(220, 586, 520, 10, BLUE_D, 0, .6))
    S.add('<g transform="rotate(-10 410 520)">%s</g>' % (rect(378, 500, 64, 42, WARM, 2) + rect(386, 510, 44, 3, "#7C8591") + rect(386, 518, 32, 3, "#7C8591")))
    S.add(person(265, 790, 1.7, top="sand", bottom="#2F343C", skin=2, hair=1, pose="present", f=1, hairstyle="short", obj="bag"))
    S.add(vignette(S, W, H) + noise_overlay(S, W, H))
    return S


# ---------------------------------------------------------------- scene 4: growth
def scene_growth():
    W, H = 1600, 900
    S = Svg(W, H, "Shaping a new service proposition",
            "Illustration. In a project room at dusk, a small team turns an idea into a testable proposition: one person arranges "
            "cards on a wall, two sit with sketches and an early prototype, and a fourth listens with a notebook.")
    grad(S, "bg", [(0, "#101824", 1), (1, SLATE, 1)])
    grad(S, "sky", [(0, "#2B3A52", 1), (.7, "#4C5A70", 1), (1, "#8A8074", 1)])
    S.add(rect(0, 0, W, H, "url(#bg)"))
    S.add(window(900, 100, 620, 420, panes=3))
    S.add(skyline(900, 1520, 520, seed=11, tone="#1E2A3A"))
    # card wall
    S.add(rect(80, 110, 700, 400, "#1C2735", 6))
    for c in range(5):
        S.add(rect(100 + c * 136, 130, 120, 10, GREY, 2, .35))
        for r in range((c * 3) % 4 + 1):
            tone = WARM if (c + r) % 3 else BLUE
            S.add(rect(108 + c * 136, 158 + r * 76, 104, 62, tone, 3, .9 if tone == WARM else .75))
            S.add(rect(118 + c * 136, 172 + r * 76, 70, 3, "#7C8591", 0, .8) + rect(118 + c * 136, 180 + r * 76, 50, 3, "#7C8591", 0, .8))
    S.add(rect(80, 510, 700, 10, "#131B25"))
    # table
    S.add(ellipse(900, 800, 380, 20, "#000", .4))
    S.add(rect(560, 640, 700, 22, "#3C4859", 6) + rect(600, 662, 16, 140, "#1F2833") + rect(1200, 662, 16, 140, "#1F2833"))
    S.add(rect(760, 604, 70, 36, "#D9D3C4", 6) + rect(772, 596, 46, 10, BLUE_D, 3))
    for k, (px, rot) in enumerate([(640, -6), (900, 5), (1060, -3)]):
        S.add('<g transform="rotate(%d %d 630)">%s</g>' % (rot, px, rect(px, 618, 90, 22, WARM, 2) + path("M%d 630 q20 -8 40 0 t40 0" % (px + 6), stroke="#7C8591", sw=2)))
    S.add(rect(1120, 614, 48, 26, "#10151C", 3) + rect(1124, 617, 40, 18, "#3A4A5E", 2))
    # people
    S.add(person(300, 830, 1.6, top="blue", bottom="charcoal", skin=3, hair=0, pose="reach", f=1, hairstyle="short"))
    S.add('<g transform="rotate(-6 356 480)">%s</g>' % rect(318, 452, 80, 50, WARM, 3))
    for cx, f in ((640, 1), (1180, -1)):
        S.add(rect(cx - 30, 700, 60, 10, "#2A3440", 3) + rect(cx - 30 * f - 5, 610, 10, 100, "#2A3440", 3) + rect(cx - 22, 710, 8, 90, "#1F2833") + rect(cx + 14, 710, 8, 90, "#1F2833"))
    S.add(person(700, 800, 1.5, top="warm", bottom="#2C3038", skin=0, hair=2, pose="sit", f=1, hairstyle="long", sit_h=80))
    S.add(person(1120, 805, 1.5, top="navy", bottom="charcoal", skin=2, hair=1, pose="sit", f=-1, hairstyle="bun", sit_h=80))
    S.add(person(1390, 840, 1.6, top="grey", bottom="#2B2F36", skin=4, hair=3, pose="hold", f=-1, hairstyle="short", obj="clipboard"))
    S.add(vignette(S, W, H) + noise_overlay(S, W, H))
    return S


# ---------------------------------------------------------------- scene 5: readiness planning
def scene_readiness():
    W, H = 1600, 900
    S = Svg(W, H, "Planning maintenance and supply for readiness",
            "Illustration. In a planning room overlooking a maintenance hangar, three authorized staff stand around a table with "
            "a paper map and maintenance records, agreeing which assets to prioritise.")
    grad(S, "bg", [(0, "#0F1621", 1), (1, SLATE, 1)])
    grad(S, "hang", [(0, "#2A3646", 1), (1, "#1A2330", 1)])
    S.add(rect(0, 0, W, H, "url(#bg)"))
    # hangar view through window
    S.add(rect(160, 90, 1280, 380, "url(#hang)"))
    for i in range(0, 1280, 160):
        S.add(path("M%d 90 L%d 140" % (160 + i, 240 + i), stroke="#344357", sw=5))
    # aircraft silhouette on stands (generic transport aircraft)
    S.add(path("M360 330 L1120 330 Q1200 330 1230 360 L1240 380 L330 380 Q300 360 360 330 Z", fill="#3D4B5E"))
    S.add(path("M650 350 L560 440 L700 440 L820 350 Z", fill="#344152"))
    S.add(path("M360 330 L330 250 L380 250 L430 330 Z", fill="#344152"))
    for sx in (520, 760, 980):
        S.add(rect(sx, 380, 60, 70, "none", 0, 1, 'stroke="#C7A23E" stroke-width="4"') + rect(sx - 4, 376, 68, 8, "#C7A23E"))
    S.add(lamp(S, 500, 96, 120, 300, "lh1", .15) + lamp(S, 1100, 96, 120, 300, "lh2", .15))
    S.add(window(160, 90, 1280, 380, panes=4, sky="none"))
    # room
    S.add(rect(0, 470, W, 430, "#111923"))
    # map table
    S.add(ellipse(800, 815, 330, 18, "#000", .4))
    S.add(poly([(480, 600), (1120, 600), (1180, 680), (420, 680)], "#3A4658"))
    S.add(poly([(520, 610), (1080, 610), (1120, 668), (480, 668)], "#DCD6C8"))
    for k in range(6):
        S.add(path("M%d %d q60 -14 120 0 t120 0 t120 0" % (540 + (k % 2) * 30, 620 + k * 8), stroke="#9BA5B1", sw=1.6, op=.8))
    S.add(circle(700, 640, 6, BLUE) + circle(860, 628, 6, BLUE) + circle(960, 650, 6, "#C7A23E"))
    S.add(rect(1000, 616, 60, 40, WARM, 2) + rect(1008, 624, 40, 3, "#7C8591") + rect(1008, 632, 30, 3, "#7C8591"))
    S.add(rect(440, 680, 700, 16, "#262F3B") + rect(470, 696, 16, 110, "#1E2631") + rect(1100, 696, 16, 110, "#1E2631"))
    # people
    S.add(person(380, 830, 1.6, top="olive", bottom="#2A2E28", skin=1, hair=0, pose="present", f=1, hairstyle="cap"))
    S.add(person(1210, 830, 1.6, top="navy", bottom="charcoal", skin=3, hair=0, pose="hold", f=-1, hairstyle="short", obj="clipboard"))
    S.add(person(800, 590, 1.25, top="olive", bottom="#2A2E28", skin=4, hair=3, pose="stand", f=1, hairstyle="bun"))
    S.add(vignette(S, W, H) + noise_overlay(S, W, H))
    return S


# ---------------------------------------------------------------- scene 6: infrastructure
def scene_infrastructure():
    W, H = 1600, 900
    S = Svg(W, H, "Field engineers at a substation beside a metro line",
            "Illustration. At dusk two field engineers review a single-line drawing beside a substation, with an elevated metro "
            "train passing behind them and a service van parked nearby.")
    grad(S, "sky", [(0, "#16202E", 1), (.65, "#3A4760", 1), (1, "#9B8C78", 1)])
    grad(S, "gnd", [(0, "#1A232E", 1), (1, "#0C1118", 1)])
    S.add(rect(0, 0, W, H, "url(#sky)"))
    S.add(skyline(0, W, 560, seed=3, tone="#1C2635"))
    # viaduct and train
    S.add(rect(0, 400, W, 26, "#2A3444") + rect(0, 426, W, 10, "#1B232F"))
    for px in range(60, W, 260):
        S.add(rect(px, 436, 40, 200, "#222C39"))
    for k in range(4):
        tx = 780 + k * 170
        S.add(rect(tx, 330, 164, 70, "#C9CED6", 10) + rect(tx, 382, 164, 8, BLUE_D))
        for wx in range(6):
            S.add(rect(tx + 12 + wx * 25, 344, 18, 20, "#F2E6CC", 2, .85))
    # power lines and tower
    S.add(path("M120 560 L180 180 L240 560 M140 440 L220 440 M155 340 L205 340 M110 260 L250 260", stroke="#2E3A4B", sw=7))
    for y0 in (262, 300):
        S.add(path("M250 %d Q700 %d 1600 %d" % (y0, y0 + 80, y0 - 20), stroke="#2E3A4B", sw=2.5))
    S.add(rect(0, 560, W, 340, "url(#gnd)"))
    # substation
    S.add(rect(80, 520, 520, 8, "#3A4658") + "".join(rect(80 + i * 26, 470, 4, 60, "#3A4658") for i in range(21)))
    for i, sx in enumerate([140, 300, 450]):
        S.add(rect(sx, 540, 110, 110, "#3F4C5E", 6) + rect(sx + 10, 520, 90, 20, "#556377", 4)
              + "".join(rect(sx + 18 + k * 22, 480, 8, 42, "#8C96A3", 2) for k in range(4)))
        S.add("".join(rect(sx - 8, 560 + k * 16, 8, 10, "#2E3A4B") for k in range(5)))
    # van
    S.add(ellipse(1320, 760, 170, 14, "#000", .4))
    S.add(path("M1160 750 L1160 620 Q1160 600 1180 600 L1400 600 Q1440 600 1460 640 L1490 690 L1490 750 Z", fill="#D9D3C4"))
    S.add(rect(1400, 612, 60, 50, "#2A3646", 4) + rect(1160, 700, 330, 10, BLUE_D) + circle(1210, 752, 26, "#12161C") + circle(1420, 752, 26, "#12161C"))
    # engineers
    S.add(person(780, 860, 1.75, top="vest", bottom="charcoal", skin=2, hair=0, pose="hold", f=1, hat=True, obj="clipboard"))
    S.add(person(960, 865, 1.75, top="navy", bottom="charcoal", skin=0, hair=2, pose="point", f=-1, hat=True, vest=True))
    S.add(vignette(S, W, H) + noise_overlay(S, W, H))
    return S


SCENES = {
    "business-in-motion.svg": scene_hero,
    "operations-recovery.svg": scene_operations,
    "customer-experience.svg": scene_customer,
    "growth-proposition.svg": scene_growth,
    "readiness-planning.svg": scene_readiness,
    "field-infrastructure.svg": scene_infrastructure,
}


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, fn in SCENES.items():
        with open(os.path.join(OUT, name), "w", encoding="utf-8") as fh:
            fh.write(fn().render())
    print("wrote %d illustrations to %s" % (len(SCENES), OUT))


if __name__ == "__main__":
    main()
