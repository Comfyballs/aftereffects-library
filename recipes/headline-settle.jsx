// Headline settle — "FREEDOM / TO MOVE". Rebuilt from full-heading.mp4 (1920×1080, 25 fps).
//
// All lines slide right into place together — the first line from furthest, each next line 72% as far.
// Each line has its own horizontal offset slider ("Line N Offset (px)"); lines without one sit at 0.
// From Heading Reveal: each line closes 0.3 em of trailing tracking to 0 over 1.3 s on its hard expo-out
// (cubic-bezier(0.14, 1, 0.34, 1)) and fades 0 -> 100 over 0.1 s (linear); line 2 starts 3.17 frames after line 1.
//
// Preset-ready: all motion lives in the Tracking / Slide / Appear animators and the six sliders; sliders are in
// thousandths of an em against the layer's font size; line offsets are in px. Save by selecting those three
// animators and all the effects.

#include "../lib/ease.jsx"

(function () {
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

    var F = 1 / CFG.fps;
    // Everything is measured in the reference's pixels at its final (settled) state.
    var SIZE = 204 / 0.71;        // cap height 204 px; Special Gothic Condensed cap height is 0.71 em
    var LEADING = 230;
    var INK_LEFT = [444, 626];    // settled ink left edge of lines 1 and 2
    var CAP = 204;
    var BLOCK_CENTER = 531;       // vertical centre of the reference's two-line block (cap top 314 to baseline 748)
    var VIDEO_OFFSET = 1.42 * F;  // the slide starts 1.42 frames before the reference's first frame

    var SLIDE = { from: 422.5, falloff: 305.4 / 422.5, dur: 44.38 * F, bez: [0.189, 0.493, 0.739, 1] };
    var LINE_START = 1.40 * F;    // first line starts 1.40 frames into the slide
    var STAGGER_FRAMES = 3.17;
    // Heading Reveal: 0.3 em of tracking and a 0.1 s fade, per line, from the line's start.
    var TRACK = { from: 300, dur: 1.3, bez: [0.14, 1, 0.34, 1] };
    var FADE = 0.1;

    function em(px) { return px / SIZE * 1000; }

    app.beginUndoGroup("Headline Settle");
    removeComps(CFG.compName);
    var dur = VIDEO_OFFSET + 84 * F;
    var comp = app.project.items.addComp(CFG.compName, CFG.width, CFG.height, 1, dur, CFG.fps);
    comp.bgColor = CFG.bg;

    var layer = comp.layers.addText("x");
    layer.name = "Headline";
    var srcText = layer.property("ADBE Text Properties").property("ADBE Text Document");
    var doc = srcText.value;
    doc.resetCharStyle();
    doc.resetParagraphStyle();
    doc.font = CFG.font;
    doc.fontSize = SIZE;
    doc.applyFill = true;
    doc.fillColor = CFG.color;
    doc.applyStroke = false;
    doc.justification = ParagraphJustification.LEFT_JUSTIFY;
    doc.autoLeading = false;
    doc.leading = LEADING;
    doc.tracking = 0;

    // Measure each line's left side bearing so the settled ink edges land where the reference has them.
    var bearing = [];
    for (var i = 0; i < CFG.lines.length; i++) {
        doc.text = CFG.lines[i];
        srcText.setValue(doc);
        bearing.push(layer.sourceRectAtTime(0, false).left);
        doc = srcText.value;
    }
    doc.text = CFG.lines.join("\r");
    srcText.setValue(doc);

    // Line 1 and 2 rest where the reference has them (ink edges); each further line's ink steps in by the same amount.
    var x = INK_LEFT[0] - bearing[0];
    var offsets = [];
    for (var o = 0; o < CFG.lines.length; o++) {
        var ink = INK_LEFT[0] + o * (INK_LEFT[1] - INK_LEFT[0]);
        offsets.push(Math.round((ink - bearing[o] - x) * 10) / 10);
    }
    // Keep the block centred where the reference's two-line block sits.
    var blockH = (CFG.lines.length - 1) * LEADING + CAP;
    var baseline = BLOCK_CENTER - blockH / 2 + CAP;
    layer.property("ADBE Transform Group").property("ADBE Position").setValue([x, baseline]);


    var fx = layer.property("ADBE Effect Parade");
    addSlider("Stagger (frames)").setValue(STAGGER_FRAMES);
    keyEase(addSlider("Tracking (em/1000)"), LINE_START, TRACK.dur, TRACK.from, 0, TRACK.bez);
    addSlider("Fade (s)").setValue(FADE);
    keyEase(addSlider("Slide (em/1000)"), 0, SLIDE.dur, em(SLIDE.from), 0, SLIDE.bez);
    addSlider("Slide Falloff (%)").setValue(SLIDE.falloff * 100);
    for (var li = 0; li < CFG.lines.length; li++) addSlider("Line " + (li + 1) + " Offset (px)").setValue(offsets[li]);

    // Amounts are px / 10 against 1000 px properties, leaving headroom under the 100% cap.
    var HEAD = 'var st = effect("Stagger (frames)")(1) * thisComp.frameDuration;\n' +
        'var em = thisLayer.text.sourceText.style.fontSize / 1000;\n';
    // After (trailing) tracking keeps each left-aligned line pinned on its left edge as it closes up.
    addAnimator("Tracking", [
        ["ADBE Text Track Type", 3],
        ["ADBE Text Tracking Amount", 1000]
    ], HEAD + 'effect("Tracking (em/1000)")(1).valueAtTime(time - (textIndex - 1) * st) * em / 10;');
    // All lines slide together; line n travels falloff^(n-1) as far and rests at its own offset slider.
    addAnimator("Slide", [
        ["ADBE Text Position 3D", [1000, 0, 0]]
    ], HEAD + 'var n = textIndex - 1;\n' +
        'var slide = effect("Slide (em/1000)")(1) * Math.pow(effect("Slide Falloff (%)")(1) / 100, n);\n' +
        'var offset = 0;\n' +
        'try { offset = effect("Line " + textIndex + " Offset (px)")(1); } catch (e) {}\n' +
        '(offset - slide * em) / 10;');
    // Each line fades in as it starts, counted from the first Tracking key so the preset works wherever it lands.
    addAnimator("Appear", [
        ["ADBE Text Opacity", 0]
    ], HEAD + 'var start = effect("Tracking (em/1000)")(1).key(1).time + (textIndex - 1) * st;\n' +
        '100 * (1 - clamp((time - start) / effect("Fade (s)")(1), 0, 1));');

    // Reference video as a guide layer (visible in the viewer, never rendered), aligned to the animation.
    var ref = findFootage(CFG.reference) || app.project.importFile(new ImportOptions(new File(CFG.reference)));
    var guide = comp.layers.add(ref);
    guide.moveToEnd();
    guide.startTime = VIDEO_OFFSET;
    guide.guideLayer = true;
    guide.audioEnabled = false;
    guide.name = "Reference (guide)";

    app.endUndoGroup();
    comp.openInViewer();
    return "x=" + x.toFixed(1) + " baseline=" + baseline.toFixed(1) + " offsets=" + offsets.join(",");

    function findFootage(path) {
        for (var n = 1; n <= app.project.numItems; n++) {
            var it = app.project.item(n);
            if (it instanceof FootageItem && it.file && it.file.fsName === new File(path).fsName) return it;
        }
        return null;
    }

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
