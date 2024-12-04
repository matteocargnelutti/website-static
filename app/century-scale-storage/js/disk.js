function diskCanvasSize() {
    return Math.min(window.innerWidth - 36, 540)
}

function diskCanvas(p) {
    const canvasElement = document.createElement("canvas");

    p.setup = function () {
        p.pixelDensity(3);
        const size = diskCanvasSize();

        const container = document.querySelector("#disk-canvas-container");
        const canvasElement = document.createElement("canvas");
        container.appendChild(canvasElement);

        p.createCanvas(size, size, p.P2D, canvasElement)

        container.style.height = `${size}px`;

        if (isReducedMotion()) {
            p.frameRate(0);
            p.draw();
          }
    }

    p.windowResized = function () {
        const size = diskCanvasSize();
        const container = document.querySelector("#disk-canvas-container");
        if (p.width !== size) {
            p.resizeCanvas(size, size, p.P2D, canvasElement)
            container.style.height = `${size}px`;
        }
    }

    p.draw = function () {
        const { width, height, frameCount, CENTER } = p;
        const r = width * 0.49;
        p.clear();
        p.noFill()
        p.stroke(0);
        p.strokeWeight(1);
        p.translate(width / 2, height / 2);
        p.circle(0, 0, r * 2)
        p.rotate(frameCount / 4000)
        for (let i = 5; i < 20; i += 1) {
            let arc = 0;
            let offset = 0;

            p.push();

            p.rotate(frameCount / 1500 * (Math.cos(i) * Math.PI))
            while (arc < Math.PI * 2) {
                let start = arc + Math.PI * 0.05;
                arc += p.noise(arc + i) * Math.PI / 2
                p.arc(0, 0, r * 2 * i / 20, r * 2 * i / 20, start + offset, arc + offset)
            }
            p.pop();
        }
    }
}