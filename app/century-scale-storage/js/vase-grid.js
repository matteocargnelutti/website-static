const GRID_SIZE = 3;

function vaseGridSize() {
  const { canvasSize } = getVaseSizes();
  return canvasSize;
}

function getVaseSizes() {
  const cellSize = Math.min(230, window.innerWidth / GRID_SIZE);
  const canvasSize = (cellSize * GRID_SIZE);
  const pixelScale = 7 * (cellSize / 230);

  return {
    cellSize, 
    canvasSize,
    pixelScale,
  }
}

function vaseGrid(p) {
  let vertSource = `
    precision highp float;
    
    attribute vec3 aPosition;
    attribute vec2 aTexCoord;
    
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    
    varying vec2 vTexCoord;
    
    void main() {
        vec4 viewModelPosition = uModelViewMatrix * vec4(aPosition, 1.0);
        gl_Position = uProjectionMatrix * viewModelPosition;  
        vTexCoord = aTexCoord;
    }
    `;

  let fragSource = `
    precision highp float;
    
    varying vec2 vTexCoord;
    
    uniform sampler2D img;
    uniform vec2 inputResolution;
    uniform float pixelScale;
    uniform float temperature;
    uniform float spread;
    
    float rand(float n) {
      return fract(sin(n) * 43758.5453123);
    }
    
    void main() {
      vec2 offset = vec2(0., 0.);
      vec2 inputPixel = floor(vTexCoord * inputResolution);
      float seed = inputPixel.x + inputPixel.y * 100.;
      if (rand(seed) > 1. - temperature) {
        offset = vec2(
          rand(100. + seed) - 0.5,
          rand(200. + seed) - 0.5) * spread;
      }
      vec4 pixel = texture2D(img, floor(vTexCoord * inputResolution) / inputResolution + offset);
    
      // float pixelBrightness = 0.4126 * pixel.r + 0.7152 * pixel.g + 0.222 * pixel.b;
      // vec2 cellPosition = mod(vTexCoord, 1./pixelScale) / (1./pixelScale) - vec2(0.5, 0.5);
      // float d = length(cellPosition - vec2(0, 0));
      // float radius = pixelBrightness * 0.5;
      // float circle = 1. - smoothstep(radius, radius, abs(d));
      // gl_FragColor = vec4(circle * pixel.r, circle * pixel.g, circle * pixel.b, 1.);
    
      gl_FragColor = pixel;
    }
    `;

  let canvas;

  let modelScale = 2 * 1.08;
  let filterShader;
  let opacity = 0;

  p.preload = function() {
    if (!assets.vaseModel) {
      assets.vaseModel = p.loadModel("./common/vase-2.stl");
    }
  }

  p.setup = function () {
    opacity = 0;

    const { canvasSize, pixelScale } = getVaseSizes()

    const container = document.querySelector("#vase-canvas-container");
    const canvasElement = document.createElement("canvas");
    container.appendChild(canvasElement);

    p.createCanvas(
      canvasSize,
      canvasSize,
      p.WEBGL,
      canvasElement
    );

    container.style.height = `${p.height}px`

    canvas = p.createFramebuffer({
      width: p.width / (pixelScale * 0.75), 
      height: p.height / pixelScale,
      textureFiltering: p.NEAREST,
    });

    filterShader = p.createShader(vertSource, fragSource);

    // Pre-draw model once to load model to GPU
    canvas.begin();
    p.model(assets.vaseModel);
    canvas.end();

    if (isReducedMotion()) {
      opacity = 1;
      p.frameRate(0);
      p.draw();
    }
  };

  p.draw = function () {
    opacity = Math.min(1, opacity + 0.1);

    const { PI, frameCount, width, height } = p;
    const { cellSize, pixelScale } = getVaseSizes()

    canvas.begin();

    p.background(0);

    p.push();
    p.rotateX(PI / 2);
    p.rotateZ(frameCount / 100);
    p.scale(modelScale);
    p.fill(opacity * 255);

    p.noStroke();
    p.directionalLight(255, 255, 255, 1, 0, 0);
    p.ambientLight(140);
    p.model(assets.vaseModel);
    p.pop();

    canvas.end();

    p.translate(0, -10)

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        p.shader(filterShader);

        filterShader.setUniform("img", canvas.color);
        filterShader.setUniform("inputResolution", [
          width / pixelScale,
          height / pixelScale,
        ]);
        filterShader.setUniform("pixelScale", width / pixelScale);

        const temperature = (x + y * GRID_SIZE) / (GRID_SIZE * GRID_SIZE) / 2;
        filterShader.setUniform("temperature", temperature);
        filterShader.setUniform("spread", temperature);

        p.rect(
          -width / 2 + x * cellSize,
          -height / 2 + y * cellSize,
          cellSize,
          cellSize
        );
      }
    }
  };
}
