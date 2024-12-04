// Caches sketch instances indexed by the sketch's name
const NAME_TO_SKETCH = {}

window.isReducedMotion = () => window.matchMedia(`(prefers-reduced-motion: reduce)`) === true || window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

window.onload = () => {
    // Initialize shared resources
    new p5(shared);
    initIntersectionObservers();
    if (!isReducedMotion()) {
        decay();
    }

    document.addEventListener("resize", () => {
        if (!isReducedMotion()) {
            decay();
        }
    });

    document.addEventListener("scroll", () => {
        if (!isReducedMotion()) {
            decay();
        }
    });
};

/**
 * Pixelated photo overlay
 */
function decay() {
    const canvas = document.getElementById("decay-canvas");
    const pixelSize = window.innerWidth > 1600 ? 8 : 6;

    canvas.width = window.innerWidth * 2;
    canvas.height = 440;
    canvas.style.height = canvas.height / 2 + 'px';
    canvas.style.width = canvas.width / 2 + 'px';
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let j = 0; j < canvas.height; j += pixelSize) {
        const probability = Math.pow(
            (canvas.height - 1 - j) / (canvas.height - 1),
            3
        );
        for (let i = 0; i < canvas.width; i += pixelSize) {
            if (Math.random() < probability) {
                ctx.fillRect(i, j, pixelSize, pixelSize);
            }
        }
    }
}


/**
 * Detect what section is in the viewport
 */
function initIntersectionObservers() {
    const sections = document.querySelectorAll('#credits, #answers-and-non-answers, #dispersal, #make-it-physical, #removable-media, #the-cloud, #hard-drives, #the-building-by-the-plum-orchard');
    let enableObservation = true;

    document.querySelectorAll(".mini-nav span, nav a").forEach(el => {
        el.addEventListener("click", (e) => {
            e.preventDefault();
            // pause when jumping to section to avoid updating nav early
            if (!isReducedMotion()) {
                enableObservation = false;
            }

            const id = (e.target.getAttribute('href') || e.target.dataset.href).replace('#', '');
            updateNav(id)

            try {
                const target = document.querySelector(`#${id}`);
                window.scrollTo({ top: target.offsetTop, behavior: isReducedMotion() ? 'instant' : 'smooth' })
                target.tabIndex = -1;
                target.focus({ focusVisible: false, preventScroll: true });
            } catch (e) {

            }

            if (!isReducedMotion()) {
                setTimeout(() => {
                    enableObservation = true
                }, 1000)
            }
        })
    })

    const navCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && enableObservation) {
                updateNav(entry.target.id)
            }
        });
    };

    const navObserver = new IntersectionObserver(navCallback, {
        root: null,
        threshold: 0
    });

    sections.forEach(section => {
        navObserver.observe(section);
    });

    // These observers watch for elements that have the `data-sketch-fn` attribute. When an observed
    // element becomes visible, the specified `data-sketch-fn` is used to construct a p5 sketch.
    // When the element becomes non-visible, `.remove()` is called on the sketch to reclaim resources.
    const canvasObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const sketchFnName = entry.target.getAttribute('data-sketch-fn');
            const existingSketch = NAME_TO_SKETCH[sketchFnName];
            if (entry.isIntersecting) {
                if (!existingSketch) {
                    const sketch = new p5(window[sketchFnName]);
                    NAME_TO_SKETCH[sketchFnName] = sketch;
                }
            } else {
                if (existingSketch) {
                    existingSketch.remove();
                    delete NAME_TO_SKETCH[sketchFnName];
                }
            }
        });
    }, {
        root: null,
        threshold: 0
    });

    document.querySelectorAll("[data-sketch-fn]").forEach(entry => {
        const sketchFnName = entry.getAttribute('data-sketch-fn');
        try {
            const size = window[sketchFnName + 'Size']();
            entry.style.height = `${size}px`;
        } catch(e) {
            console.warn(`${sketchFnName} not defined`)
        }
        return canvasObserver.observe(entry)
    });
}

/**
 *  Sync side navigation with current section in viewport 
 */
function updateNav(id) {
    document.querySelectorAll('nav li').forEach(li => {
        const a = li.querySelector('a')

        if (a.getAttribute('href') === `#${id}`) {
            li.classList = 'active'
        } else {
            li.classList = ''
        }
    })

    document.querySelectorAll('.mini-nav span').forEach(square => {
        if (square.dataset.href === `#${id}`) {
            square.classList = 'on'
        } else {
            square.classList = ''
        }
    });
}
