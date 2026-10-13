# aftereffects-library

aftereffects-library is a set of ExtendScript recipes for After Effects that rebuild Comfyballs text animations as editable comps and reusable animation presets.

Each recipe is measured from a reference — a video or the CSS on comfyballs.no — and writes the motion as code: sizes, offsets and cubic-bezier eases. Running a recipe rebuilds its comp from scratch, so a change to the numbers is a change to one file, not a round of hand-keying.

## What's included

```
aftereffects-library/
├── recipes/
│   ├── heading-reveal.jsx     # comfyballs.no hero heading
│   ├── headline-settle.jsx    # "FREEDOM / TO MOVE" slide-in
│   ├── match-cut.jsx          # text + dots, nested into one loop
│   ├── match-cut-text.jsx     # text half of the match cut
│   └── match-cut-dots.jsx     # dots half of the match cut
├── lib/
│   └── ease.jsx               # keyEase() and removeComps(), shared by the recipes
├── scripts/
│   └── run-in-ae.sh           # run a .jsx in After Effects from the terminal
├── project.aep                # working project with every recipe's comp built
├── Settle.ffx                 # Headline Settle saved as an animation preset
└── Untitled.ffx               # unnamed preset (four-line Source Text only)
```

## Quick start

### Prerequisites

- After Effects 2026 (the version the recipes and presets were built on)
- [Special Gothic](https://fonts.google.com/specimen/Special+Gothic) installed, including Condensed Bold (`SpecialGothicCondensed-Bold`)
- For terminal runs: `python3` and the AE-MCP panel from [after-effects-mcp](https://github.com/ishu86/after-effects-mcp), open in AE under **Window > Extensions > AE-MCP**

### Run a recipe

```bash
git clone https://github.com/Comfyballs/aftereffects-library.git
cd aftereffects-library
open project.aep
scripts/run-in-ae.sh recipes/match-cut.jsx
```

The script prints the panel's JSON response and the comp opens in the viewer. It works against whichever project is open in AE, not only `project.aep`.

<details>
<summary>Without the AE-MCP panel</summary>

In After Effects, choose **File > Scripts > Run Script File…** and pick a file from `recipes/`. The recipes resolve `lib/ease.jsx` relative to their own location, so keep the directory layout intact.

</details>

## Recipes

| Recipe | Comp | Format | What it builds |
|--------|------|--------|----------------|
| `heading-reveal.jsx` | Heading Reveal | 1920×1080, 30 fps, 3 s | Tracking closes from 0.3 em, leading tightens, block settles up-left over 1.3 s |
| `headline-settle.jsx` | Headline Settle | 1920×1080, 25 fps, 3.4 s | Lines slide right into place, each 72% as far as the one above, with staggered tracking and fade |
| `match-cut-text.jsx` | Match Cut - Text | 1920×1080, 60 fps, 81 frames | Lines pop in 3 frames apart, tracking and line gaps settle, block rides up |
| `match-cut-dots.jsx` | Match Cut - Dots | 1920×1080, 60 fps, 81 frames | Two dots rise on one fast–slow–fast curve, the right one overtaking |
| `match-cut.jsx` | Match Cut | 1920×1080, 60 fps, 2.7 s | Runs both halves and nests them with a hard cut between |

Every recipe removes any existing comp with the same name before building, so re-running replaces the comp instead of duplicating it.

## Configuration

Each recipe opens with a `CFG` object. Edit it and re-run.

```js
var CFG = {
    compName: "Headline Settle",
    width: 1920,
    height: 1080,
    fps: 25,
    lines: ["FREEDOM", "TO MOVE", "THIRD LINE"],
    font: "SpecialGothicCondensed-Bold",
    color: [200 / 255, 236 / 255, 82 / 255],   // #C8EC52
    bg: [0.08, 0.08, 0.08],
    reference: "/Users/thomasaudunhus/Downloads/full-heading.mp4"
};
```

The constants below `CFG` are measurements taken from the reference, in the reference's pixels. Change them only when re-measuring.

`headline-settle.jsx` imports `CFG.reference` as a guide layer under the text for visual comparison. Point it at your own copy of the reference video before running.

## Saving a preset

`headline-settle.jsx`, `match-cut-text.jsx` and `match-cut-dots.jsx` are preset-ready: all motion lives in text animators and slider effects (or shape group transforms), with no layer transform keys. To save one, select the properties below and choose **Animation > Save Animation Preset…**.

| Recipe | Select |
|--------|--------|
| `headline-settle.jsx` | Animators Tracking, Slide, Appear and all effects |
| `match-cut-text.jsx` | Animators Tracking, Line Gap, Rise, Appear and the four effects |
| `match-cut-dots.jsx` | Groups Dot L and Dot R under Contents |

The sliders hold distances in thousandths of an em and the expressions read them against the layer's font size, so a saved preset fits any text size. Line offsets in Headline Settle are in px.

## How it works

- **Eases come from CSS.** `keyEase(prop, t0, dur, from, to, [x1, y1, x2, y2])` in `lib/ease.jsx` sets two keyframes and converts a `cubic-bezier()` to AE's temporal ease: influence is the handle's x-extent, speed is the handle's slope times the average speed.
- **Sliders drive the motion.** Each animated quantity is one keyframed Slider Control. Text animators hold a fixed 1000 px value and an expression selector scales it per line.
- **Stagger is an expression.** Selectors are set to *Based On: Lines* and sample their slider at `time - (textIndex - 1) * stagger`, so one set of keys animates every line.
- **`heading-reveal.jsx` is self-contained.** It keys the animator properties directly with its own ease helper and does not include `lib/ease.jsx`.

## Writing a recipe

Scripting quirks the existing recipes work around:

- Text animator **Tracking Amount is in px**, not 1/1000 em like the Character panel.
- `addProperty` can invalidate the property group it was called on. Re-fetch the group from the layer before every add and read.
- `KeyframeEase` speed is **signed** for one-dimensional and non-spatial properties, and a **magnitude** along the path for spatial ones.
- `setSpatialTangentsAtKey` on layer Position needs three-element arrays, even on 2D layers.
- `doc.characterRange(i, i + 1).tracking` only takes integers (1/1000 em).

## Troubleshooting

<details>
<summary><strong><code>Timed out: is the AE-MCP panel open?</code></strong></summary>

`run-in-ae.sh` waits 60 seconds for the panel to answer. Check that:

- After Effects is running and the panel is open under **Window > Extensions > AE-MCP**.
- AE is not showing a modal dialog. A script error raises one, and the panel cannot respond until you dismiss it.
- The command queue exists:

```bash
ls ~/Documents/ae-mcp-commands
```

</details>

<details>
<summary><strong><code>headline-settle.jsx</code> fails on import</strong></summary>

`CFG.reference` points at a video that is not on your machine. Set it to the path of your copy of the reference.

</details>

<details>
<summary><strong>Text looks wrong or sits in the wrong place</strong></summary>

The recipes measure against Special Gothic Condensed Bold. If the font is missing, AE substitutes another face and the measured positions no longer line up. Confirm it is installed:

```bash
system_profiler SPFontsDataType | grep "SpecialGothicCondensed-Bold"
```

</details>
