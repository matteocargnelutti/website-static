function faceGridSize() {
  return Math.min(580, window.innerWidth)
}

function faceGrid(p) {
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
      float seed = inputPixel.y * 100.;
      if (rand(seed) > 1. - temperature) {
        offset = vec2(
          rand(100. + seed) - 0.5,
          rand(200. + seed) - 0.5) * spread;
      }
      vec4 pixel = texture2D(img, floor(vTexCoord * inputResolution) / inputResolution + offset);

      gl_FragColor = pixel;
    }
    `;

  let canvas;
  let pixelScale;
  let modelScale = 1.3;
  let gridWidth = 1;
  let gridHeight = gridWidth;
  let filterShader;
  let opacity = 0;

  p.preload = function() {
    if (!assets.faceModel) {
      assets.faceModel = p.loadModel("./common/bust.stl");
    }
  }

  p.setup = function () {
    opacity = 0;
    const cellSize = faceGridSize();

    pixelScale = 4 * (cellSize / 700);

    const container = document.querySelector("#face-canvas-container");
    const canvasElement = document.createElement("canvas");
    container.appendChild(canvasElement);

    p.createCanvas(
      1 * cellSize,
      1 * cellSize,
      p.WEBGL,
      canvasElement
    );

    container.style.height = `${p.height}px`

    canvas = p.createFramebuffer({
      width: p.width / pixelScale,
      height: p.height / pixelScale,
      textureFiltering: p.NEAREST,
    });

    filterShader = p.createShader(vertSource, fragSource);

    // Pre-draw model once to load model to GPU
    canvas.begin();
    p.model(assets.faceModel);
    canvas.end();

    if (isReducedMotion()) {
      opacity = 1;
      p.frameRate(0);
      p.draw();
    }
  };

  p.draw = function () {
    const { PI, frameCount, width, height } = p;
    const cellSize = faceGridSize();

    opacity = Math.min(1, opacity + 0.1);

    canvas.begin();

    p.background(0);

    p.push();
    p.rotateX(PI / 2);
    p.rotateZ(frameCount / 100);
    p.scale(modelScale);

    p.fill(opacity * 255);
    p.noStroke();

    p.directionalLight(255, 255, 255, 1, 0, 0);
    p.directionalLight(255, 255, 255, -1, 0, 0);
    p.ambientLight(50);

    p.model(assets.faceModel);
    p.pop();

    canvas.end();

    p.background(255);

    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        p.shader(filterShader);

        filterShader.setUniform("img", canvas.color);
        filterShader.setUniform("inputResolution", [
          width / pixelScale,
          height / pixelScale,
        ]);
        filterShader.setUniform("pixelScale", width / pixelScale);

        const temperature = ((Math.sin(p.frameCount / 100) + 1) / 2) * 0.25;
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
