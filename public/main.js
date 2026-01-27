// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

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

// DEBUG: Red Cube (To verify Three.js is running)
// If you see this cube but not the mascot, the issue is the image path.
/*
const debugGeo = new THREE.BoxGeometry(1, 1, 1);
const debugMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const debugCube = new THREE.Mesh(debugGeo, debugMat);
debugCube.position.set(-2, 2, 0); // Top left
scene.add(debugCube);
*/

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

// Updated Paths: Using absolute paths from root
const texHero = textureLoader.load('/assets/mascote_1.png', (tex) => {
    // Fix Aspect Ratio on Initial Load
    const aspect = tex.image.width / tex.image.height;
    mascotMesh.scale.x = aspect;
    console.log('Hero texture loaded, aspect:', aspect);
});
const texPose = textureLoader.load('/assets/mascote_3.png');
const texThumbs = textureLoader.load('/assets/mascote_0.png');

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

// Helper function to swap texture smoothly
function swapTexture(texture) {
    if (mascotMaterial.map !== texture) {
        // Quick "pop" effect to hide the swap
        gsap.to(mascotMesh.scale, {
            duration: 0.1, x: 0, y: 0, onComplete: () => {
                mascotMaterial.map = texture;
                mascotMaterial.needsUpdate = true;
                // Recalculate aspect ratio for new texture
                const aspect = texture.image ? (texture.image.width / texture.image.height) : 1;

                gsap.to(mascotMesh.scale, { duration: 0.2, x: aspect, y: 1 });
            }
        });
    }
}

// 1. Hero -> Services
// Move mascot to left
gsap.to(mascotMesh.position, {
    scrollTrigger: {
        trigger: "#services",
        start: "top bottom", // Starts when top of #services hits bottom of screen
        end: "center center",
        scrub: 1.5 // Smoother lag
    },
    x: -3,
    y: 0,
    z: 0
});

// 2. Services -> About (Change Pose)
ScrollTrigger.create({
    trigger: "#about",
    start: "top 70%", // Earlier trigger
    onEnter: () => swapTexture(texPose),
    onLeaveBack: () => swapTexture(texHero)
});

// Move mascot to right for About section
gsap.to(mascotMesh.position, {
    scrollTrigger: {
        trigger: "#about",
        start: "top bottom",
        end: "center center",
        scrub: 2 // Even smoother
    },
    x: 3,
});

// 3. About -> Footer (Thumbs Up)
ScrollTrigger.create({
    trigger: "#contact",
    start: "top 80%",
    onEnter: () => swapTexture(texThumbs),
    onLeaveBack: () => swapTexture(texPose)
});

gsap.to(mascotMesh.position, {
    scrollTrigger: {
        trigger: "#contact",
        start: "top bottom",
        end: "bottom bottom",
        scrub: 1.5
    },
    x: 0,
    y: 0.5,
    // Note: Scale is handled by the swap function usually, but we can boost it here
    onUpdate: function () {
        // Optional extra logic
    }
});

// --- Responsive ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Adjust mascot scale for mobile
    // Note: Aspect ratio logic might need re-triggering here in a real app
});
