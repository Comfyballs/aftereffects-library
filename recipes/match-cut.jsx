// Match cut — the full 2.7 s loop: text (81 frames), hard cut, dots (81 frames), 1920×1080 @ 60 fps.
// Builds both halves from their own recipes (each preset-ready) and nests them in one comp.

#include "../lib/ease.jsx"

(function () {
    var here = File($.fileName).parent.fsName;
    var textInfo = $.evalFile(here + "/match-cut-text.jsx");
    $.evalFile(here + "/match-cut-dots.jsx");

    var text = findComp("Match Cut - Text");
    var dots = findComp("Match Cut - Dots");

    app.beginUndoGroup("Match Cut");
    removeComps("Match Cut");
    var comp = app.project.items.addComp("Match Cut", text.width, text.height, 1, text.duration + dots.duration, text.frameRate);
    comp.bgColor = text.bgColor;
    comp.layers.add(text);
    comp.layers.add(dots).startTime = text.duration;
    app.endUndoGroup();
    comp.openInViewer();
    return textInfo;

    function findComp(name) {
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name === name) return item;
        }
        throw new Error("Missing comp: " + name);
    }
})();
