// Match cut, text half — "TREAT YOUR / BALLS RIGHT", 1920×1080, 81 frames @ 60 fps.
// Rebuilt from CB_Match cut (1).mp4 (1080×1920); see match-cut.jsx for the combined loop.
//
// Lines pop in 3 frames apart (no fade). Each line starts with extra tracking and sits too far below the line
// above; both settle on their own ease, staggered per line. The whole block rides up on a fast–slow–fast curve
// whose exit speed carries into the dots at the cut.
//
// Preset-ready: all motion lives in the four text animators and the four sliders (no transform keys), and the
// sliders are in thousandths of an em, read against the layer's font size — so the preset fits any text size.
// Save it by selecting the animators Tracking, Line Gap, Rise, Appear and the four effects.

#include "../lib/ease.jsx"

(function () {
    var CFG = {
        compName: "Match Cut - Text",
        width: 1920,
        height: 1080,
        fps: 60,
        text: "TREAT YOUR\rBALLS RIGHT",
        fill: 0.913,              // widest line / frame width (TREAT in the reference: 986 / 1080)
        font: "SpecialGothicCondensed-Bold",
        ink: [0, 0, 0],
        bg: [253 / 255, 253 / 255, 253 / 255]
    };

    var F = 1 / CFG.fps;
    var DUR = 81 * F;

    // Reference measurements, in the tall video's pixels.
    var REF = { width: 1080, height: 1920, lines: 4 };
    var CAP = 337;                // cap height
    var REF_SIZE = CAP / 0.71;    // Special Gothic Condensed cap height is 0.71 em
    var LEADING = 360;
    var STAGGER_FRAMES = 3;

    // The reference spacing matches neither metric nor optical kerning, so auto-kern is off and each pair
    // gets the gap measured in the video, as px relative to unkerned glyphs. Unlisted pairs get the average;
    // pairs with a space keep the font's word space.
    var PAIR_PX = {
        TR: -11, RE: -11, EA: 1, AT: -55, YO: -33, OU: -9, UR: -8,
        BA: -13, AL: -10, LL: -12, LS: -11, RI: -12, IG: -8, GH: -8, HT: -11
    };
    var DEFAULT_PAIR_PX = -10.5;

    // Block: cap-top of line 1, fast–slow–fast over the whole segment.
    var BLOCK = { from: 441.9, to: 29.6, bez: [0.112, 0.826, 0.836, 0.357] };
    // Per-line settles (px per letter gap / extra px below the previous line).
    var TRACK = { from: 24.74, dur: 27.2 * F, bez: [0.162, 0.637, 0.373, 1] };
    var GAP = { from: 42.44, dur: 63.0 * F, bez: [0.098, 0.369, 0.185, 1] };

    function em(px) { return px / REF_SIZE * 1000; }

    app.beginUndoGroup("Match Cut - Text");
    removeComps(CFG.compName);
    var comp = app.project.items.addComp(CFG.compName, CFG.width, CFG.height, 1, DUR, CFG.fps);
    comp.bgColor = CFG.bg;

    var layer = comp.layers.addText("x");
    layer.name = "Text";
    var srcText = layer.property("ADBE Text Properties").property("ADBE Text Document");
    var doc = srcText.value;
    doc.resetCharStyle();
    doc.resetParagraphStyle();
    doc.text = CFG.text;
    doc.font = CFG.font;
    doc.fontSize = REF_SIZE;
    doc.applyFill = true;
    doc.fillColor = CFG.ink;
    doc.applyStroke = false;
    doc.justification = ParagraphJustification.CENTER_JUSTIFY;
    doc.autoLeading = false;
    doc.leading = LEADING;
    doc.tracking = 0;
    doc.autoKernType = AutoKernType.NO_AUTO_KERN;
    // Character tracking sits after the glyph, so it sets the gap to the next one; line ends stay 0 to keep centring.
    for (var c = 0; c < CFG.text.length - 1; c++) {
        var next = CFG.text.charAt(c + 1);
        if (/[\r ]/.test(CFG.text.charAt(c)) || /[\r ]/.test(next)) continue;
        var pair = CFG.text.substr(c, 2);
        var px = PAIR_PX.hasOwnProperty(pair) ? PAIR_PX[pair] : DEFAULT_PAIR_PX;
        doc.characterRange(c, c + 1).tracking = Math.round(em(px)); // integer 1/1000 em only
    }
    srcText.setValue(doc);

    // Measure at reference size, then scale type to the target fill. Character tracking is in em, so it scales along.
    var k = CFG.fill * CFG.width / layer.sourceRectAtTime(0, false).width;
    doc = srcText.value;
    doc.fontSize = REF_SIZE * k;
    doc.leading = LEADING * k;
    srcText.setValue(doc);

    // Rest position = where the block starts: the reference block's centre mapped through k, as a baseline.
    var lines = CFG.text.split("\r").length;
    var refHalf = ((REF.lines - 1) * LEADING + CAP) / 2;
    var half = k * ((lines - 1) * LEADING + CAP) / 2;
    var startY = CFG.height / 2 + k * (BLOCK.from + refHalf - REF.height / 2) - half + k * CAP;
    layer.property("ADBE Transform Group").property("ADBE Position").setValue([CFG.width / 2, startY]);

    var fx = layer.property("ADBE Effect Parade");
    addSlider("Stagger (frames)").setValue(STAGGER_FRAMES);
    keyEase(addSlider("Tracking (em/1000)"), 0, TRACK.dur, em(TRACK.from), 0, TRACK.bez);
    keyEase(addSlider("Line Gap (em/1000)"), 0, GAP.dur, em(GAP.from), 0, GAP.bez);
    keyEase(addSlider("Rise (em/1000)"), 0, DUR, 0, em(BLOCK.to - BLOCK.from), BLOCK.bez);

    // Each amount is px / 10 against a 1000 px property, so the 100% selector cap leaves headroom at any size.
    var HEAD = 'var st = effect("Stagger (frames)")(1) * thisComp.frameDuration;\n' +
        'var em = thisLayer.text.sourceText.style.fontSize / 1000;\n';
    // Before & After keeps each centred line centred while it closes up.
    addAnimator("Tracking", [
        ["ADBE Text Track Type", 1],
        ["ADBE Text Tracking Amount", 1000]
    ], HEAD + 'effect("Tracking (em/1000)")(1).valueAtTime(time - (textIndex - 1) * st) * em / 10;');
    // Each line hangs below the one above by that gap's own delayed settle, so offsets accumulate down the block.
    addAnimator("Line Gap", [
        ["ADBE Text Position 3D", [0, 1000, 0]]
    ], HEAD + 'var g = effect("Line Gap (em/1000)")(1), y = 0;\n' +
        'for (var k = 1; k < textIndex; k++) y += g.valueAtTime(time - k * st);\n' +
        'y * em / 10;');
    addAnimator("Rise", [
        ["ADBE Text Position 3D", [0, 1000, 0]]
    ], HEAD + 'effect("Rise (em/1000)")(1) * em / 10;');
    // Lines appear on the stagger, counted from the first Tracking key so the preset works wherever it lands.
    addAnimator("Appear", [
        ["ADBE Text Opacity", 0]
    ], HEAD + 'var t0 = effect("Tracking (em/1000)")(1).key(1).time;\n' +
        '(time - t0) < (textIndex - 1) * st - thisComp.frameDuration / 2 ? 100 : 0;');

    app.endUndoGroup();
    comp.openInViewer();
    return "k=" + k.toFixed(4) + " size=" + (REF_SIZE * k).toFixed(1);

    function addSlider(name) {
        fx.addProperty("ADBE Slider Control").name = name;
        return fx.property(name).property(1);
    }

    function addAnimator(name, props, selectorExpr) {
        layer.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator").name = name;
        var anim = function () { return layer.property("ADBE Text Properties").property("ADBE Text Animators").property(name); };
        for (var i = 0; i < props.length; i++) {
            anim().property("ADBE Text Animator Properties").addProperty(props[i][0]);
            anim().property("ADBE Text Animator Properties").property(props[i][0]).setValue(props[i][1]);
        }
        anim().property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector");
        anim().property("ADBE Text Selectors").property(1).property("ADBE Text Range Type2").setValue(4); // Based On: Lines
        anim().property("ADBE Text Selectors").property(1).property("ADBE Text Expressible Amount").expression = selectorExpr;
    }
})();
