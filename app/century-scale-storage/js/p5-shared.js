let smoothingFactor = 0;
let smoothedScrollX = 0;
let smoothedScrollY = 0;

const assets = {};

/**
 * Expose smoothed scroll values to all animations
 * 
 */
function shared(p) {
    p.setup = function () {
        smoothedScrollX = window.scrollY;
        smoothedScrollY = window.scrollY % 120;

        setTimeout(() => {
            smoothingFactor = 0.05
        }, 1500)

        p.loadImage("assets/rosetta-transparent.png", (image) => {
            assets.rosettaImage = image;
        });
        p.loadModel("./common/vase-2.stl", (model) => {
            assets.vaseModel = model;
        });
        p.loadModel("./common/bust.stl", (model) => {
            assets.faceModel = model;
        });
        p.loadModel("./common/nefertiti.stl", (model) => {
            assets.nefertitiModel = model;
        });
    }
    p.draw = function () {
        smoothedScrollX += (window.scrollY - smoothedScrollX) * smoothingFactor
        smoothedScrollY += ((window.scrollY % 120) - smoothedScrollY) * smoothingFactor
    }
}