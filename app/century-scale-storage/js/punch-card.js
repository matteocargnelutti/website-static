const cols = 38;
const rows = 15;

function punchCardCanvasSize() {
    let { canvasSize, padding } = getPunchcardSizes();

    return canvasSize.h + (padding * 2);
}

function getPunchcardSizes() {
    let cellSize, canvasSize, fontSize, padding;

    if (innerWidth <= 768) {
        const cellW = Math.floor((window.innerWidth - 30) / (cols));
        cellSize = { w: cellW, h: cellW + 1 };
        canvasSize = { w: cols * cellSize.w, h: rows * cellSize.h };
        fontSize = Math.ceil(cellW / 2);
        padding = canvasSize.h * 0.25;
    } else {
        cellSize = { w: 20, h: 22 };
        canvasSize = { w: cols * cellSize.w, h: rows * cellSize.h };
        fontSize = 10;
        padding = canvasSize.h * 0.125;
    }


    return { 
        cellSize,
        canvasSize,
        fontSize,
        padding,
    }
}

function punchCardCanvas(p) {
    p.preload = function() {
        if (!assets.font) {
            assets.font = p.loadFont("./assets/slkscr.ttf");
        }
    }

    const canvasElement = document.createElement("canvas");
    p.setup = function () {
        p.pixelDensity(3);

        let { cellSize, canvasSize, padding } = getPunchcardSizes();

        const container = document.querySelector("#punch-card-canvas-container");
        container.appendChild(canvasElement);

        p.createCanvas(canvasSize.w + cellSize.w / 2 + 2, (padding * 2) + canvasSize.h + cellSize.h / 2 + 2, p.WEBGL, canvasElement)

        container.style.height = `${p.height}px`

        if (isReducedMotion()) {
            p.frameRate(0);
            p.draw();
        }
    }

    p.windowResized = function () {
        let { cellSize, canvasSize, padding } = getPunchcardSizes();

        if (p.width !== getPunchcardSizes().canvasSize.w) {
            p.resizeCanvas(canvasSize.w + cellSize.w / 2 + 2, (padding * 2) + canvasSize.h + cellSize.h / 2 + 2, p.WEBGL, canvasElement)
        }
    }

    p.draw = function () {
        const { width, height, frameCount, CENTER } = p;
        let { cellSize, canvasSize, fontSize, padding } = getPunchcardSizes();
        p.clear();
        p.textFont(assets.font);
        p.textSize(fontSize);
        p.textAlign(CENTER);

        p.translate(1, 1 + padding)
        p.noFill()
        p.stroke(0);
        p.strokeWeight(0.5);
        p.push();
        p.rect(-width / 2, -height / 2, canvasSize.w + cellSize.w / 2, canvasSize.h + cellSize.h / 2, 6)
        p.pop();
        p.translate(-width / 2, -height / 2);

        for (let i = 0; i < cols; i += 1) {
            for (let j = 0; j < rows; j += 1) {
                if (p.noise(i + frameCount / 290) > 0.5 || p.noise(j + frameCount / 430) > 0.5) {
                    p.push();
                    p.fill(p.noise(i + frameCount / 1000) > 0.7 || p.noise(j + frameCount / 560) > 0.6 ? 'rgb(0,0,0)' : 'rgba(0,0,0,0)')
                    p.translate(i * cellSize.w, j * cellSize.h);
                    p.rect(cellSize.w * 0.5, cellSize.h * 0.5, cellSize.w * 0.5, cellSize.h * 0.75)
                    p.pop();
                } else {
                    if (j > 4) {
                        p.push();
                        p.fill(0);
                        p.text(j - 5, (i + 3 / 4) * cellSize.w, (j + 1) * cellSize.h);
                        p.pop();
                    }
                }
            }
        }
    }
}