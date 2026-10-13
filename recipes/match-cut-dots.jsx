// Match cut, dots half — two dots rising, 1920×1080, 81 frames @ 60 fps.
// Rebuilt from CB_Match cut (1).mp4 (1080×1920); see match-cut.jsx for the combined loop.
//
// Both dots ride one fast–slow–fast curve; the right one starts lower and overtakes. They enter already moving,
// picking up the text's exit speed at the cut.
//
// Preset-ready: one shape layer, both dots as groups animated by their group Position (relative to the layer),
// so the preset carries both. Save it by selecting the Dot L and Dot R groups under Contents.

#include "../lib/ease.jsx"

(function () {
    var CFG = {
        compName: "Match Cut - Dots",
        width: 1920,
        height: 1080,
        fps: 60,
        scale: 0.8625,            // same scale as match-cut-text.jsx at 1920×1080
        ink: [0, 0, 0],
        bg: [253 / 255, 253 / 255, 253 / 255]
    };

    var DUR = 81 / CFG.fps;

    // Reference measurements, in the tall video's pixels (frame centre 540, 960).
    var REF = { cx: 540, cy: 960 };
    var DOT = 348;
    var BEZ = [0.113, 0.592, 0.920, 0.251];
    var DOTS = [
        { name: "Dot L", x: 331, from: 1249.1, to: 765.3 },
        { name: "Dot R", x: 749, from: 1388.3, to: 677.1 }
    ];

    var k = CFG.scale;

    app.beginUndoGroup("Match Cut - Dots");
    removeComps(CFG.compName);
    var comp = app.project.items.addComp(CFG.compName, CFG.width, CFG.height, 1, DUR, CFG.fps);
    comp.bgColor = CFG.bg;

    var layer = comp.layers.addShape();
    layer.name = "Dots";
    layer.property("ADBE Transform Group").property("ADBE Position").setValue([CFG.width / 2, CFG.height / 2]);

    for (var d = 0; d < DOTS.length; d++) {
        var contents = layer.property("ADBE Root Vectors Group");
        contents.addProperty("ADBE Vector Group").name = DOTS[d].name;
        var grp = function () { return layer.property("ADBE Root Vectors Group").property(DOTS[d].name); };
        grp().property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Ellipse");
        grp().property("ADBE Vectors Group").property(1).property("ADBE Vector Ellipse Size").setValue([DOT * k, DOT * k]);
        grp().property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
        grp().property("ADBE Vectors Group").property(2).property("ADBE Vector Fill Color").setValue(CFG.ink);

        var x = k * (DOTS[d].x - REF.cx);
        keyEase(grp().property("ADBE Vector Transform Group").property("ADBE Vector Position"), 0, DUR,
            [x, k * (DOTS[d].from - REF.cy)], [x, k * (DOTS[d].to - REF.cy)], BEZ);
    }

    app.endUndoGroup();
    comp.openInViewer();
    return "ok";
})();
