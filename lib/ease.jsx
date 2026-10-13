// Shared keyframe helper. Include with: #include "../lib/ease.jsx"

// Two keys from t0 to t0+dur with the ease a CSS-style cubic-bezier(x1, y1, x2, y2) describes.
function keyEase(prop, t0, dur, from, to, bz) {
    var k1 = prop.addKey(t0), k2 = prop.addKey(t0 + dur);
    prop.setValueAtKey(k1, from);
    prop.setValueAtKey(k2, to);

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

    var k1In = [], k1Out = [], k2In = [], k2Out = [];
    for (var k = 0; k < deltas.length; k++) {
        var avg = deltas[k] / dur;
        k1In.push(new KeyframeEase(0, 33.33));
        k1Out.push(new KeyframeEase(bz[1] / bz[0] * avg, bz[0] * 100));
        k2In.push(new KeyframeEase((1 - bz[3]) / (1 - bz[2]) * avg, (1 - bz[2]) * 100));
        k2Out.push(new KeyframeEase(0, 33.33));
    }
    prop.setInterpolationTypeAtKey(k1, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
    prop.setInterpolationTypeAtKey(k2, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
    prop.setTemporalEaseAtKey(k1, k1In, k1Out);
    prop.setTemporalEaseAtKey(k2, k2In, k2Out);
    if (prop.isSpatial) {
        var zero = prop.value.length === 3 ? [0, 0, 0] : [0, 0]; // layer Position is 3 values even on 2D layers
        prop.setSpatialTangentsAtKey(k1, zero, zero);
        prop.setSpatialTangentsAtKey(k2, zero, zero);
    }
}

// Remove every comp with this name (recipes rebuild in place).
function removeComps(name) {
    for (var n = app.project.numItems; n >= 1; n--) {
        var item = app.project.item(n);
        if (item instanceof CompItem && item.name === name) item.remove();
    }
}
