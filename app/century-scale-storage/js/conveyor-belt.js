const CANVAS_SIZE = 400;
const PADDING = 20;

function conveyorBeltSize() {
  return CANVAS_SIZE;
}

function conveyorBelt(p) {
  let vertSource = `
    precision highp float;

    attribute vec3 aPosition;
    attribute vec2 aTexCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying vec2 vTexCoord;

    void main() {
        // Apply the camera transform
        vec4 viewModelPosition = uModelViewMatrix * vec4(aPosition, 1.0);

        // Tell WebGL where the vertex goes
        gl_Position = uProjectionMatrix * viewModelPosition;  

        // Pass along data to the fragment shader
        vTexCoord = aTexCoord;
    }
    `;

  let fragSource = `
    precision highp float;

    varying vec2 vTexCoord;

    uniform sampler2D img;
    uniform vec2 shift;
    uniform float speed;
    uniform float width;

    void main() {
        gl_FragColor = texture2D(img, vTexCoord);

        if (shift.x >= 0. && vTexCoord.x > shift.x && vTexCoord.x < shift.x + width) {
            gl_FragColor = texture2D(img, mod(vTexCoord + vec2(0, speed), vec2(1, 1)));
        }

        if (shift.y >= 0. && vTexCoord.y > shift.y && vTexCoord.y < shift.y + width) {
            gl_FragColor = texture2D(img, mod(vTexCoord + vec2(speed, 0), vec2(1, 1)));
        }
    }
    `;

  let imageCanvas;
  let opacity;
  const scale = 1;
  const canvases = [];

  function drawModel(rotation) {
    p.background(0);
    p.fill(255);

    p.noStroke();
    p.ortho();
    p.push();
    const scale = 1;
    p.scale(scale, -scale);
    p.rotateX(Math.PI / 8);
    p.rotateY(rotation);

    p.directionalLight(255, 255, 255, 1, 0, 0);
    p.directionalLight(255, 255, 255, -1, 0, 0);
    p.ambientLight(50);

    p.strokeWeight(1);
    p.model(assets.nefertitiModel);
    
    p.pop();
  }

  p.preload = function() {
    if (!assets.nefertitiModel) {
      assets.nefertitiModel = p.loadModel("./common/nefertiti.stl");
    }
  }

  p.setup = function () {
    opacity = 0;

    const container = document.querySelector("#conveyor-canvas-container");
    const canvasElement = document.createElement("canvas");
    container.appendChild(canvasElement);

    p.createCanvas(
      innerWidth,
      CANVAS_SIZE,
      p.WEBGL,
      canvasElement,
    );

    const numCanvases = p.width / (CANVAS_SIZE + PADDING) + 1;
    for (let i = 0; i < numCanvases; i++) {
      canvases.push({
        prev: p.createFramebuffer({
          width: CANVAS_SIZE / scale,
          height: CANVAS_SIZE / scale,
          textureFiltering: p.NEAREST,
        }),
        next: p.createFramebuffer({
          width: CANVAS_SIZE / scale,
          height: CANVAS_SIZE / scale,
          textureFiltering: p.NEAREST,
        }),
        feedbackShader: p.createShader(vertSource, fragSource),
        framesSinceLastShift: 0,
      });
    }

    imageCanvas = p.createGraphics(CANVAS_SIZE / scale, CANVAS_SIZE / scale);
    canvases.forEach(({ next }, index) => {
      next.begin();
      drawModel(Math.PI / 4 * index);
      next.end();
      isLoaded = true;
    });

    if (isReducedMotion()) {
      opacity = 1;
      p.frameRate(0);
      p.draw();
    }
  };

  p.draw = function () {
    opacity = Math.min(1, opacity + 0.1);

    p.background(0);

    const totalDrawWidth = canvases.length * (CANVAS_SIZE + PADDING);
    for (let i = 0; i < canvases.length; i++) {
      const canvas = canvases[i];

      const drawWidth = canvas.next.width * scale;
      const drawHeight = canvas.next.height * scale;

      const x =
        -p.width / 2 +
        ((p.frameCount + i * (drawWidth + PADDING)) % (totalDrawWidth)) -
        drawWidth;

      const { prev, next } = canvas;

      canvas.next = prev;
      canvas.prev = next;

      if (x < -p.width / 2) {
        canvas.prev.begin();
        drawModel(p.frameCount / 100);
        canvas.prev.end();
      }

      canvas.next.begin();

      p.clear();
      p.shader(canvas.feedbackShader);
      canvas.feedbackShader.setUniform("img", canvas.prev.color);

      const t = Math.min(
        1,
        Math.max(0, (x + p.width / 2 + drawWidth) / p.width)
      );

      const shiftFrequency = 40;

      if (canvas.framesSinceLastShift > shiftFrequency / 8) {
        canvas.feedbackShader.setUniform("speed", 0);
      }
      
      if (canvas.framesSinceLastShift > shiftFrequency) {
        canvas.framesSinceLastShift = 0;
        let shift;
        if (p.random() > 0.5) {
          shift = [p.random(), -1];
        } else {
          shift = [-1, p.random()];
        }
        canvas.feedbackShader.setUniform("shift", shift);
        let s = p.random(-1, 1);
        s = 0.01;

        canvas.feedbackShader.setUniform("speed", s);
        canvas.feedbackShader.setUniform("width", 0.2);
      }
      canvas.framesSinceLastShift++;

      p.noStroke();
      p.rect(
        -canvas.next.width / 2,
        -canvas.next.height / 2,
        canvas.next.width,
        canvas.next.height
      );


      canvas.next.end();

      p.image(canvas.next, x, -p.height / 2, drawWidth, drawHeight);
      p.fill(0, 255 - opacity * 255);
      p.rect(x, -p.height / 2, drawWidth, drawHeight)
    }
  };
}
