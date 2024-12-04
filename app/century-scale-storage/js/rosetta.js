function rosettaSize() {
  return Math.min(600, innerWidth);
}

function rosetta(p) {
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
  uniform float time;
  uniform float cellSize;

  float rand(float n) {
    return fract(sin(n) * 43758.5453123);
  }

  // Improved hash function
  vec3 hash3(vec3 p) {
      p = vec3(
          dot(p, vec3(127.1, 311.7, 74.7)),
          dot(p, vec3(269.5, 183.3, 246.1)),
          dot(p, vec3(113.5, 271.9, 124.6))
      );
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float perlinNoise3D(vec3 p) {
      vec3 pi = floor(p);
      vec3 pf = fract(p);
      
      // Quintic interpolation curve
      vec3 w = pf * pf * pf * (pf * (pf * 6.0 - 15.0) + 10.0);
      
      // Gradient vectors for all corners
      vec3 g000 = hash3(pi + vec3(0.0, 0.0, 0.0));
      vec3 g100 = hash3(pi + vec3(1.0, 0.0, 0.0));
      vec3 g010 = hash3(pi + vec3(0.0, 1.0, 0.0));
      vec3 g110 = hash3(pi + vec3(1.0, 1.0, 0.0));
      vec3 g001 = hash3(pi + vec3(0.0, 0.0, 1.0));
      vec3 g101 = hash3(pi + vec3(1.0, 0.0, 1.0));
      vec3 g011 = hash3(pi + vec3(0.0, 1.0, 1.0));
      vec3 g111 = hash3(pi + vec3(1.0, 1.0, 1.0));
      
      // Dot products with relative position vectors
      float n000 = dot(g000, pf - vec3(0.0, 0.0, 0.0));
      float n100 = dot(g100, pf - vec3(1.0, 0.0, 0.0));
      float n010 = dot(g010, pf - vec3(0.0, 1.0, 0.0));
      float n110 = dot(g110, pf - vec3(1.0, 1.0, 0.0));
      float n001 = dot(g001, pf - vec3(0.0, 0.0, 1.0));
      float n101 = dot(g101, pf - vec3(1.0, 0.0, 1.0));
      float n011 = dot(g011, pf - vec3(0.0, 1.0, 1.0));
      float n111 = dot(g111, pf - vec3(1.0, 1.0, 1.0));
      
      // Interpolate noise values
      float x00 = mix(n000, n100, w.x);
      float x10 = mix(n010, n110, w.x);
      float x01 = mix(n001, n101, w.x);
      float x11 = mix(n011, n111, w.x);
      
      float y0 = mix(x00, x10, w.y);
      float y1 = mix(x01, x11, w.y);
      
      float result = mix(y0, y1, w.z);
      
      return result * 0.5 + 0.5; // Map to [0,1] range
  }

  // Function to create multi-octave noise (fBm)
  float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      // Add multiple octaves of noise
      for(int i = 0; i < 4; i++) {
          value += amplitude * perlinNoise3D(p * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
      }
      
      return value;
  }
  void main() {
    vec2 offset = vec2(0., 0.);
    vec2 inputPixel = floor(vTexCoord * inputResolution);
    float seed = floor(inputPixel.x / cellSize) + floor(inputPixel.y / cellSize) * 100.;
    float noiseScale = 0.01;

    float noiseValue = perlinNoise3D(vec3(noiseScale * inputPixel.x, noiseScale * inputPixel.y, time));
    float temperature = smoothstep(0.4, 0.9, noiseValue) * 1.0;
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
  const pixelScale = 1;
  let opacity = 0;

  p.preload = function() {
    if (!assets.rosettaImage) {
      assets.rosettaImage = p.loadImage("assets/rosetta-transparent.png");
    }
  }

  p.setup = function () {
    p.noSmooth();
    p.pixelDensity(2);

    opacity = 0;
    const size = rosettaSize();
    const container = document.querySelector("#rosetta-canvas-container");
    const canvasElement = document.createElement("canvas");
    container.appendChild(canvasElement);

    p.createCanvas(size, size, p.WEBGL, canvasElement);

    container.style.height = `${size}px`

    drawtoCanvas();

    if (isReducedMotion()) {
      p.frameRate(0);
      p.draw();
    }
  }

  // p.windowResized = function () {
  //   size = Math.min(600, innerWidth);

  //   p.resizeCanvas(size, size, p.WEBGL, document.querySelector('#rosetta-canvas'));

  //   drawtoCanvas();
  // }

  function drawtoCanvas() {
    canvas = p.createFramebuffer({
      width: p.width / pixelScale,
      height: p.height / pixelScale,
      textureFiltering: p.NEAREST,
    });

    filterShader = p.createShader(vertSource, fragSource);

    canvas.begin();

    p.resetShader();
    
    p.noStroke();
    p.clear();

    p.push();
    p.scale(0.4 * p.height/600);
    p.translate(-assets.rosettaImage.width / 2, -assets.rosettaImage.height / 2);
    p.image(assets.rosettaImage, 0, 0, assets.rosettaImage.width, assets.rosettaImage.height);
    p.pop();

    canvas.end();
  }

  p.draw = function () {
    opacity = Math.min(1, opacity + 0.1);

    p.clear();
    p.shader(filterShader);
    filterShader.setUniform("img", canvas.color);
    filterShader.setUniform("inputResolution", [
      p.width / pixelScale,
      p.height / pixelScale,
    ]);
    filterShader.setUniform("pixelScale", p.width / pixelScale);
    filterShader.setUniform("temperature", 0.5);
    filterShader.setUniform("spread", Math.sin(p.frameCount / 100) * 0.25);
    filterShader.setUniform("cellSize", 10);
    filterShader.setUniform("time", p.frameCount / 50)
    p.noStroke();
    p.rect(-p.width / 2, -p.height / 2, p.width, p.height);
  }
}