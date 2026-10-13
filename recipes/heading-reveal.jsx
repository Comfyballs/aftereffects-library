// Heading reveal — matches the comfyballs.no hero heading.
// Letters squeeze together (tracking 0.3em -> 0) and lines tighten (leading 0.947 -> 0.797 × size)
// while the block settles up-left by (25, 22.5). No stagger. 1300 ms, cubic-bezier(0.14, 1, 0.34, 1).
// Opacity 0 -> 100 over the first 100 ms (linear).
// All px values are authored at 1840 px width and scaled by compWidth / 1840.

(function () {
    var CFG = {
        compName: "Heading Reveal",
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 3,
        text: "HEADING\rREVEAL\rFOUR LINES\rOF TEXT",
        font: "SpecialGothicCondensed-Bold", // Special Gothic, wght 700, wdth 75
        color: [1, 1, 1],
        bg: [0, 0, 0]
    };

    var AUTHOR_W = 1840;
    var SIZE = 128;
    var LEADING_END = 102;       // 0.797 × size
    var LEADING_START = 121.2;   // 0.947 × size
    var TRACKING_START = 0.3 * SIZE; // 0.3 em. Animator Tracking Amount is in px, not 1/1000 em like the Character panel
    var OFFSET_START = [25, 22.5]; // translate (25, 12.9) + CSS half-leading drift (9.6) on the first line
    var LEFT = 30.8, TOP = 43.7;   // CSS line-box top-left of the block
    var DUR = 1.3;
    var FADE_DUR = 0.1;
    var BEZIER = { x1: 0.14, y1: 1, x2: 0.34, y2: 1 };

    // Font vertical metrics (hhea/typo, upm 1000): ascent 1005, descent 295.
    // CSS centres the content area (1.3 em) in the line box, so the first baseline sits at
    // top + (lineHeight - 1.3·size) / 2 + 1.005·size.
    var ASC = 1.005, CONTENT = 1.3;
    var baselineY = TOP + (LEADING_END - CONTENT * SIZE) / 2 + ASC * SIZE;

    var s = CFG.width / AUTHOR_W;

    app.beginUndoGroup("Heading Reveal");

    // Rebuild in place: drop an earlier build of this comp.
    for (var n = app.project.numItems; n >= 1; n--) {
        var item = app.project.item(n);
        if (item instanceof CompItem && item.name === CFG.compName) item.remove();
    }

    var comp = app.project.items.addComp(CFG.compName, CFG.width, CFG.height, 1, CFG.duration, CFG.fps);
    comp.bgColor = CFG.bg;

    var layer = comp.layers.addText("x");
    layer.name = "Heading";
    var srcText = layer.property("ADBE Text Properties").property("ADBE Text Document");
    var doc = srcText.value;
    doc.resetCharStyle();
    doc.resetParagraphStyle();
    doc.text = CFG.text;
    doc.font = CFG.font;
    doc.fontSize = SIZE * s;
    doc.applyFill = true;
    doc.fillColor = CFG.color;
    doc.applyStroke = false;
    doc.justification = ParagraphJustification.LEFT_JUSTIFY;
    doc.autoLeading = false;
    doc.leading = LEADING_END * s;
    doc.tracking = 0;
    srcText.setValue(doc);

    layer.property("ADBE Transform Group").property("ADBE Position").setValue([LEFT * s, baselineY * s]);

    // One animator, one range selector covering every character (no stagger).
    var animator = layer.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator");
    animator.name = "Heading Reveal";
    animator.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
    // addProperty can invalidate the group object itself, so fetch it fresh for every add and read.
    function animProps() {
        return layer.property("ADBE Text Properties").property("ADBE Text Animators").property(1).property("ADBE Text Animator Properties");
    }
    var added = ["ADBE Text Track Type", "ADBE Text Tracking Amount", "ADBE Text Line Spacing", "ADBE Text Position 3D", "ADBE Text Opacity"];
    for (var a = 0; a < added.length; a++) animProps().addProperty(added[a]);

    animProps().property("ADBE Text Track Type").setValue(3); // After — trailing, like CSS letter-spacing, so left edge stays pinned
    var tracking = animProps().property("ADBE Text Tracking Amount");
    var lineSpacing = animProps().property("ADBE Text Line Spacing");
    var position = animProps().property("ADBE Text Position 3D");
    var opacity = animProps().property("ADBE Text Opacity");

    keyWithEase(tracking, TRACKING_START * s, 0);
    keyWithEase(lineSpacing, [0, (LEADING_START - LEADING_END) * s], [0, 0]);
    keyWithEase(position, [OFFSET_START[0] * s, OFFSET_START[1] * s, 0], [0, 0, 0]);

    opacity.setValueAtTime(0, 0);
    opacity.setValueAtTime(FADE_DUR, 100);
    opacity.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
    opacity.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);

    app.endUndoGroup();
    comp.openInViewer();

    function keyWithEase(prop, from, to) {
        prop.setValueAtTime(0, from);
        prop.setValueAtTime(DUR, to);

        var dims = (typeof from === "number") ? 1 : (prop.isSpatial ? 1 : from.length);
        // Spatial speed is a magnitude along the path; per-dimension speed is signed.
        var deltas = [];
        if (typeof from === "number") {
            deltas.push(to - from);
        } else if (prop.isSpatial) {
            var d2 = 0;
            for (var i = 0; i < from.length; i++) d2 += Math.pow(to[i] - from[i], 2);
            deltas.push(Math.sqrt(d2));
        } else {
            for (var j = 0; j < from.length; j++) deltas.push(to[j] - from[j]);
        }

        // cubic-bezier -> AE ease: influence = handle x-extent, speed = handle slope × average speed.
        var outInfl = BEZIER.x1 * 100;
        var inInfl = (1 - BEZIER.x2) * 100;
        var outSlope = BEZIER.y1 / BEZIER.x1;
        var inSlope = (1 - BEZIER.y2) / (1 - BEZIER.x2);

        var k1In = [], k1Out = [], k2In = [], k2Out = [];
        for (var k = 0; k < dims; k++) {
            var avg = deltas[k] / DUR;
            k1In.push(new KeyframeEase(0, 33.33));
            k1Out.push(new KeyframeEase(outSlope * avg, outInfl));
            k2In.push(new KeyframeEase(inSlope * avg, inInfl));
            k2Out.push(new KeyframeEase(0, 33.33));
        }
        prop.setInterpolationTypeAtKey(1, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
        prop.setInterpolationTypeAtKey(2, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
        prop.setTemporalEaseAtKey(1, k1In, k1Out);
        prop.setTemporalEaseAtKey(2, k2In, k2Out);
        if (prop.isSpatial) {
            prop.setSpatialTangentsAtKey(1, [0, 0, 0], [0, 0, 0]);
            prop.setSpatialTangentsAtKey(2, [0, 0, 0], [0, 0, 0]);
        }
    }
})();
