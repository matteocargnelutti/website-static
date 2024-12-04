const GRADIENT_BUFFER = 790;

function numberLineSize() {
  return window.innerHeight + GRADIENT_BUFFER;
}

function numberLine(p) {

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
    uniform vec2 shift;
    uniform float speed;
    uniform float width;
    uniform float scrollSpeed;
    uniform vec2 resolution;
    uniform float time;

    float rand(float n) {
      return fract(sin(n) * 43758.5453123);
    }

    void main() {
      gl_FragColor = texture2D(img, vTexCoord);

      vec2 pixel = 1. / resolution;

      gl_FragColor = texture2D(img, vTexCoord - vec2(0., scrollSpeed * pixel.y));

      if (shift.y >= 0. && vTexCoord.y > shift.y && vTexCoord.y < shift.y + width) {
        gl_FragColor = vec4(texture2D(img, mod(vTexCoord + vec2(speed, 0), vec2(1, 1))).rgb * 1., 1.);
      }
      
      if (vTexCoord.y > 0.8 && rand(vTexCoord.x + vTexCoord.y * 100.0 + time) > 0.95) {
        gl_FragColor = vec4(0., 0., 0., 1.);
      }
    }
    `;

  let gradientShader = `
    precision highp float;

    varying vec2 vTexCoord;

    uniform vec2 resolution;
    uniform float time;
    uniform float startGradient;
    uniform float endGradient;

    float getBayerValue(int x, int y) {
        if(x == 0) {
            if(y == 0) return 0.0/16.0;
            if(y == 1) return 12.0/16.0;
            if(y == 2) return 3.0/16.0;
            return 15.0/16.0;
        }
        if(x == 1) {
            if(y == 0) return 8.0/16.0;
            if(y == 1) return 4.0/16.0;
            if(y == 2) return 11.0/16.0;
            return 7.0/16.0;
        }
        if(x == 2) {
            if(y == 0) return 2.0/16.0;
            if(y == 1) return 14.0/16.0;
            if(y == 2) return 1.0/16.0;
            return 13.0/16.0;
        }
        // x == 3
        if(y == 0) return 10.0/16.0;
        if(y == 1) return 6.0/16.0;
        if(y == 2) return 9.0/16.0;
        return 5.0/16.0;
    }

    void main() {
        // Get the pixel coordinates
        vec2 pixelCoord = vTexCoord * resolution;
        
        // Get the 4x4 pixel position for the Bayer matrix
        int x = int(mod(pixelCoord.x, 4.0));
        int y = int(mod(pixelCoord.y, 4.0));
        
        // Get the threshold from Bayer matrix function
        float threshold = getBayerValue(x, y);
        
        // Your original animated gradient value
        // float gradient = 0.5 - (sin(vTexCoord.y * 3. + time / 10.0) + 1.) / 2.;

        float gradient = 0.1 - (sin(vTexCoord.y * 3. + time / 10.0 + 0.4 * sin(vTexCoord.x + time / 10.0)) + 1.) / 2. * 0.1;
        
        if (pixelCoord.y > startGradient) {
          float t = (pixelCoord.y - startGradient) / (endGradient - startGradient);
          gradient = mix(gradient, 0.5, t);
        }

        if (pixelCoord.y > endGradient) {
          gradient = 0.5;
        }
        
        // Define three colors
        vec3 color1 = vec3(1.0) * 1.;  // Lightest
        vec3 color2 = vec3(1.0) * 0.1; // Middle
        vec3 color3 = vec3(0.0);        // Darkest
        
        // Adjust the gradient and threshold for three-color dithering
        float adjustedGradient = gradient * 2.0; // Scale to 0-1 range
        vec3 finalColor;
        
        if (adjustedGradient < 0.5) {
            // Transition between color3 and color2
            float lowerThreshold = threshold * 0.5;
            finalColor = (adjustedGradient * 2.0 > lowerThreshold) ? color2 : color3;
        } else {
            // Transition between color2 and color1
            float upperThreshold = 0.5 + threshold * 0.5;
            finalColor = ((adjustedGradient - 0.5) * 2.0 > threshold) ? color1 : color2;
        }
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
    `;

  const canvasElement = document.createElement("canvas");
  let textCanvas;
  let gradientCanvas;
  let prev, next;
  let feedbackShader;
  let textUpdateStep = 0;
  let count = 0;

  const SCALE = 8;
  const SCROLL_SPEED = 2;
  const BUFFER = SCALE * 16;

  p.preload = function () {
    if (!assets.font) {
      assets.font = p.loadFont("./assets/slkscr.ttf");
    }
  }

  function updateText() {
    const { abs, RIGHT } = p;

    if (textUpdateStep % (SCROLL_SPEED * 10) == 0) {
      textCanvas.clear();
      textCanvas.textFont(assets.font);
      textCanvas.textSize(8);
      textCanvas.textAlign(RIGHT);
      textCanvas.fill(255);
      textCanvas.text(count + 1, Math.round(textCanvas.width / 2) + 4, 10);
      if (isReducedMotion()) {
        count = count - 1
      } else {
        count = count + 1 >= 100 ? 0 : count + 1
      }

      next.begin();
      p.image(textCanvas, -textCanvas.width / 2, -textCanvas.height / 2);
      next.end();
    }

    [prev, next] = [next, prev];
    next.begin();

    p.clear();
    p.shader(feedbackShader);
    feedbackShader.setUniform("img", prev.color);
    feedbackShader.setUniform("time", textUpdateStep);

    const y = p.round(Math.cbrt(p.random()) * 10) / 10;
    feedbackShader.setUniform("shift", [-1, y]);
    let s = p.random(-1, 1);
    s = (s / abs(s)) * 0.01;
    feedbackShader.setUniform("speed", s);

    feedbackShader.setUniform("width", 0.05);
    feedbackShader.setUniform("resolution", [next.width, next.height]);
    feedbackShader.setUniform(
      "scrollSpeed",
      textUpdateStep % SCROLL_SPEED == 0 ? 1 : 0
    );

    p.noStroke();
    p.rect(-next.width / 2, -next.height / 2, next.width, next.height);

    next.end();
    textUpdateStep++;
  }

  p.setup = function () {
    const size = numberLineSize()
    const container = document.querySelector("#canvas-number-line-container");
    const hero = document.querySelector(".hero");
    container.appendChild(canvasElement);

    p.createCanvas(
      innerWidth,
      size,
      p.WEBGL,
      canvasElement
    );

    container.style.height = `${p.height}px`
    container.style.width = `100%`

    hero.style.height = `${window.innerHeight}px`

    const { floor, width, height, NEAREST } = p;

    prev = p.createFramebuffer({
      width: floor(width / SCALE),
      height: floor((height + BUFFER * 2) / SCALE),
      textureFiltering: NEAREST,
    });
    next = p.createFramebuffer({
      width: floor(width / SCALE),
      height: floor((height + BUFFER * 2) / SCALE),
      textureFiltering: NEAREST,
    });

    feedbackShader = p.createShader(vertSource, fragSource);
    gradientShader = p.createShader(vertSource, gradientShader);

    textCanvas = p.createGraphics(prev.width, prev.height);

    gradientCanvas = p.createFramebuffer({
      width: floor(width / (SCALE / 2)),
      height: floor(height / (SCALE / 2)),
      textureFiltering: NEAREST,
    });

    const loops = isReducedMotion() ? 510 : 150;

    if (isReducedMotion()) {
      count = 24
    }

    for (let i = 0; i < loops; i++) {
      updateText();
    }
  };

  p.draw = function () {
    if (isReducedMotion() && p.frameCount > 1) {
      return;
    }
    gradientCanvas.begin();
    p.clear();
    p.shader(gradientShader)

    gradientShader.setUniform("resolution", [gradientCanvas.width, gradientCanvas.height]);
    gradientShader.setUniform("time", p.frameCount / 10);
    gradientShader.setUniform("startGradient", gradientCanvas.height - GRADIENT_BUFFER / (SCALE / 2));
    gradientShader.setUniform("endGradient", gradientCanvas.height - 200 / (SCALE / 2));

    p.fill(255, 0, 0);
    p.noStroke();
    p.rect(-gradientCanvas.width / 2, -gradientCanvas.height / 2, gradientCanvas.width, gradientCanvas.height);
    gradientCanvas.end();

    const { width, height } = p;

    updateText();

    p.clear();
    p.blendMode(p.EXCLUSION);
    p.image(gradientCanvas, -width / 2, -height / 2, width, height);
    p.image(next, -width / 2, -height / 2 - BUFFER, width, next.height * SCALE);
  };
}
