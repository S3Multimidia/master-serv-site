// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Fix Mobile Scroll Issue: Prevent browser from remembering scroll position
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// Force scroll to top on load and refresh
window.onload = function () {
    window.scrollTo(0, 0);
    // Double check slightly later for some mobile browsers
    setTimeout(() => window.scrollTo(0, 0), 100);
}

// --- Three.js Setup ---
const container = document.getElementById('webgl-container');
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Renderer
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0); // Transparent background
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Increased intensity
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x00ff9d, 2);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// --- Objects ---

// 1. The Pipe Tunnel (Cylinders)
const tunnelGroup = new THREE.Group();
scene.add(tunnelGroup);

const tunnelGeometry = new THREE.CylinderGeometry(10, 10, 40, 32, 20, true);
const tunnelMaterial = new THREE.MeshBasicMaterial({
    color: 0x0044ff,
    wireframe: true,
    transparent: true,
    opacity: 0.15
});

// Create two tunnel segments for infinite scrolling effect
const tunnel1 = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
tunnel1.rotation.x = -Math.PI / 2;
tunnel1.position.z = -10;
tunnelGroup.add(tunnel1);

const tunnel2 = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
tunnel2.rotation.x = -Math.PI / 2;
tunnel2.position.z = -50;
tunnelGroup.add(tunnel2);

// 2. The Mascot
let mascotMesh;
const textureLoader = new THREE.TextureLoader();

// Updated Paths: Using relative paths (better for GitHub Pages / local)
const texHero = textureLoader.load('assets/mascote_1.png', (tex) => {
    // Fix Aspect Ratio on Initial Load
    const aspect = tex.image.width / tex.image.height;
    mascotMesh.scale.x = aspect;
});
const texPose = textureLoader.load('assets/mascote_3.png');
const texThumbs = textureLoader.load('assets/mascote_0.png');

// Mascot Plane (Base Height = 5 units)
const mascotGeometry = new THREE.PlaneGeometry(5, 5);
const mascotMaterial = new THREE.MeshBasicMaterial({
    map: texHero,
    transparent: true,
    side: THREE.DoubleSide
});
mascotMesh = new THREE.Mesh(mascotGeometry, mascotMaterial);
scene.add(mascotMesh);

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    // Infinite tunnel movement
    tunnel1.position.z += 0.05; // Slower for classier feel
    tunnel2.position.z += 0.05;

    if (tunnel1.position.z > 10) tunnel1.position.z = -70;
    if (tunnel2.position.z > 10) tunnel2.position.z = -70;

    // Subtle mascot float
    mascotMesh.position.y += Math.sin(Date.now() * 0.001) * 0.002;

    renderer.render(scene, camera);
}
animate();

// --- Scroll Interactions (GSAP) ---

// Helper function to swap texture smoothly (Spin Effect)
function swapTexture(texture) {
    if (mascotMaterial.map !== texture) {

        // Kill any ongoing tweens on rotation to avoid conflict
        gsap.killTweensOf(mascotMesh.rotation);

        const tl = gsap.timeline();

        // Phase 1: Rotate to 90 degrees (invisible edge)
        tl.to(mascotMesh.rotation, {
            duration: 0.15,
            y: Math.PI / 2,
            ease: "power2.in"
        })
            // Phase 2: Swap Texture & Aspect Ratio
            .call(() => {
                mascotMaterial.map = texture;
                mascotMaterial.needsUpdate = true;

                // Recalculate aspect ratio for new texture
                const aspect = texture.image ? (texture.image.width / texture.image.height) : 1;
                mascotMesh.scale.x = aspect;
            })
            // Phase 3: Complete rotation to 0 (360)
            .to(mascotMesh.rotation, {
                duration: 0.25,
                y: 0,
                ease: "back.out(1.7)" // Elastic finish
            });
    }
}

// Responsive value helper
function getMascotX(direction) {
    const isMobile = window.innerWidth < 768;
    // On desktop, move further out (5). On mobile, stay closer or center.
    if (direction === 'left') return isMobile ? 0 : -5;
    if (direction === 'right') return isMobile ? 0 : 5;
    return 0;
}

// 1. Hero -> Services
// Move mascot from center to Left (so services can appear on Right)
gsap.to(mascotMesh.position, {
    scrollTrigger: {
        trigger: "#services",
        start: "top bottom",
        end: "center center",
        scrub: 1.5,
        invalidateOnRefresh: true // Important for resize
    },
    x: () => getMascotX('left'),
    y: 0,
    z: 0
});

// 2. Services -> Hidro (Move Mascot to Right)
gsap.to(mascotMesh.position, {
    scrollTrigger: {
        trigger: "#hidro",
        start: "top bottom",
        end: "center center",
        scrub: 1.5,
        invalidateOnRefresh: true
    },
    x: () => getMascotX('right'),
});

// 3. Hidro -> Gallery (Move Mascot to Left)
gsap.to(mascotMesh.position, {
    scrollTrigger: {
        trigger: "#gallery",
        start: "top bottom",
        end: "center center",
        scrub: 1.5,
        invalidateOnRefresh: true
    },
    x: () => getMascotX('left'),
});

// Change pose to 'observing' (Pose) during gallery
ScrollTrigger.create({
    trigger: "#gallery",
    start: "top 70%",
    onEnter: () => swapTexture(texPose),
    onLeaveBack: () => swapTexture(texHero)
});


// 4. Gallery -> Owner (Move Mascot to Right)
gsap.to(mascotMesh.position, {
    scrollTrigger: {
        trigger: "#owner",
        start: "top bottom",
        end: "center center",
        scrub: 1.5,
        invalidateOnRefresh: true
    },
    x: () => getMascotX('right'),
});

// 5. Owner -> About (Stay Right)
ScrollTrigger.create({
    trigger: "#about",
    start: "top 70%",
    onEnter: () => swapTexture(texHero),
    onLeaveBack: () => swapTexture(texPose)
});

// Ensure it definitely stays/is at right
gsap.to(mascotMesh.position, {
    scrollTrigger: {
        trigger: "#about",
        start: "top bottom",
        end: "center center",
        scrub: 2,
        invalidateOnRefresh: true
    },
    x: () => getMascotX('right'),
});

// 6. About -> Footer (Thumbs Up)
ScrollTrigger.create({
    trigger: "#contact",
    start: "top 80%",
    onEnter: () => swapTexture(texThumbs),
    onLeaveBack: () => swapTexture(texHero)
});

gsap.to(mascotMesh.position, {
    scrollTrigger: {
        trigger: "#contact",
        start: "top bottom",
        end: "bottom bottom",
        scrub: 1.5,
        invalidateOnRefresh: true
    },
    x: 0, // Back to center
    y: 0.5,
});

// --- Responsive THREE.js ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Refresh ScrollTrigger to recalculate 'x' values
    ScrollTrigger.refresh();
});


// --- 3D Carousel Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const carouselContainer = document.querySelector('.carousel-3d-container');
    const slides = document.querySelectorAll('.carousel-3d-slide');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    // Safety check
    if (!carouselContainer || slides.length === 0) return;

    let currentIndex = 0;
    const totalSlides = slides.length;
    // Calculate angle for each slide: 360 / total
    const anglePerSlide = 360 / totalSlides;

    function updateCarousel() {
        // Calculate dynamic radius based on slide width so they don't overlap too much
        // Circumference ~= total * width. Radius = C / 2pi
        // Or simpler: tan(theta) = (w/2) / r -> r = (w/2) / tan(theta)
        // theta = 180 / totalSlides (half the angle per slide)

        let slideWidth = slides[0].offsetWidth;
        if (slideWidth === 0) slideWidth = 300; // Fallback if hidden

        const thetaRad = (Math.PI / totalSlides);
        const radius = Math.round((slideWidth / 2) / Math.tan(thetaRad)) + 50; // +50 spacing

        // Rotate the container to show current slide
        const angle = currentIndex * -anglePerSlide;
        carouselContainer.style.transform = `translateZ(-${radius}px) rotateY(${angle}deg)`;

        // Update active class
        slides.forEach((slide, index) => {
            slide.classList.remove('active');
            let normalizedIndex = currentIndex % totalSlides;
            if (normalizedIndex < 0) normalizedIndex += totalSlides;

            if (index === normalizedIndex) {
                slide.classList.add('active');
            }
        });
    }

    // Initialize positions of slides in 3D space
    function initPositions() {
        let slideWidth = slides[0].offsetWidth;
        if (slideWidth === 0) slideWidth = 300;

        const thetaRad = (Math.PI / totalSlides);
        const radius = Math.round((slideWidth / 2) / Math.tan(thetaRad)) + 50;

        slides.forEach((slide, index) => {
            const angle = index * anglePerSlide;
            // Place slide at angle and radius, facing outward
            slide.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
        });

        // Initial update
        updateCarousel();
    }

    // Give time for layout to settle (images load)
    setTimeout(initPositions, 100);
    window.addEventListener('resize', initPositions);

    // Event Listeners
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentIndex++;
            updateCarousel();
            resetAutoPlay();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentIndex--;
            updateCarousel();
            resetAutoPlay();
        });
    }

    // Auto rotate
    let autoPlayInterval = setInterval(() => {
        currentIndex++;
        updateCarousel();
    }, 4000);

    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => {
            currentIndex++;
            updateCarousel();
        }, 4000);
    }
});
