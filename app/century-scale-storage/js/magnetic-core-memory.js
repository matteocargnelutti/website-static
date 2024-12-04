
function magneticCoreCanvasSize() {
    return Math.min(window.innerWidth, 600)
}

function magneticCoreCanvas(p) {
    const canvasElement = document.createElement("canvas");
    p.setup = function () {
        const size = magneticCoreCanvasSize();

        const container = document.querySelector("#magnetic-core-memory-canvas-container");
        container.appendChild(canvasElement);

        p.createCanvas(size, size, p.WEBGL, canvasElement)

        container.style.height = `${size}px`;

        if (isReducedMotion()) {
            p.frameRate(0);
            p.draw();
        }
    }

    p.windowResized = function () {
        const size = magneticCoreCanvasSize();
        const container = document.querySelector("#magnetic-core-memory-canvas-container");
        
        if (p.width !== size) {
            p.resizeCanvas(size, size, p.WEBGL, canvasElement)
            container.style.height = `${size}px`;
        }
    }

    p.draw = function () {
        const { width, height, frameCount, CENTER } = p;

        p.translate(-width / 2, -height / 2);
        p.rectMode(CENTER)
        p.clear();
        p.fill(0);

        for (let i = 0; i < 10; i += 1) {
            p.stroke(150);
            p.push()
            p.translate(0, height / 11 * (i + 1));
            p.line(0, 0, width, 0)
            p.pop()
            p.push()
            p.translate(width / 11 * (i + 1), 0);
            p.line(0, 0, 0, height)
            p.pop()
            p.push()
            p.noStroke()
            p.fill(0);
            for (let j = 0; j < 10; j += 1) {
                if (i > 0) {
                    p.push();
                    p.translate(width / 11 * (i + 0.5), height / 11 * (j + 1), 0);
                    p.rotateY(Math.PI / 2)
                    p.rotateZ(smoothedScrollX / 100 + frameCount / 6000 * (1 + i + j));
                    p.rotateX(smoothedScrollY / 100 + frameCount / 6000 * (1 + j * i));
                    p.rotateY(frameCount / 6000 * (1 + j));
                    p.torus(width / 75, width / 150);
                    p.pop();
                }
                if (j < 9) {
                    p.push();
                    p.translate(width / 11 * (i + 1), height / 11 * (j + 1.5), 0);
                    p.rotateX(Math.PI / 2)
                    p.rotateZ(smoothedScrollX / 100 + frameCount / 6000 * (1 + i + j));
                    p.rotateX(smoothedScrollY / 100 + frameCount / 6000 * (1 + j * i));
                    p.rotateY(frameCount / 6000 * (1 + j));
                    p.torus(width / 75, width / 150);
                    p.pop();
                }
            }
            p.pop();
        }
    }
}