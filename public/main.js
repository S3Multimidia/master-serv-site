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
const texHero = textureLoader.load('/assets/mascote_1.png',
    () => console.log('Hero texture loaded'),
    undefined,
    (err) => console.error('Error loading Hero texture:', err)
);
const texPose = textureLoader.load('/assets/mascote_3.png');
const texThumbs = textureLoader.load('/assets/mascote_0.png');

// Mascot Plane
const mascotGeometry = new THREE.PlaneGeometry(4, 4);
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
    tunnel1.position.z += 0.1;
    tunnel2.position.z += 0.1;

    if (tunnel1.position.z > 10) tunnel1.position.z = -70;
    if (tunnel2.position.z > 10) tunnel2.position.z = -70;

    // Subtle mascot float
    mascotMesh.position.y += Math.sin(Date.now() * 0.002) * 0.005;

    renderer.render(scene, camera);
}
animate();

// --- Scroll Interactions (GSAP) ---

// 1. Hero -> Services
// Move mascot to left and change global lighting
gsap.to(mascotMesh.position, {
    scrollTrigger: {
        trigger: "#services",
        start: "top bottom",
        end: "center center",
        scrub: 1
    },
    x: -3,
    y: 0,
    z: 0
});

// 2. Services -> About (Change Pose)
ScrollTrigger.create({
    trigger: "#about",
    start: "top center",
    onEnter: () => {
        mascotMaterial.map = texPose;
        mascotMaterial.needsUpdate = true;
    },
    onLeaveBack: () => {
        mascotMaterial.map = texHero;
        mascotMaterial.needsUpdate = true;
    }
});

// Move mascot to right for About section
gsap.to(mascotMesh.position, {
    scrollTrigger: {
        trigger: "#about",
        start: "top bottom",
        end: "center center",
        scrub: 1
    },
    x: 3,
});

// 3. About -> Footer (Thumbs Up)
ScrollTrigger.create({
    trigger: "#contact",
    start: "top bottom",
    onEnter: () => {
        mascotMaterial.map = texThumbs;
        mascotMaterial.needsUpdate = true;
    },
    onLeaveBack: () => {
        mascotMaterial.map = texPose;
        mascotMaterial.needsUpdate = true;
    }
});

gsap.to(mascotMesh.position, {
    scrollTrigger: {
        trigger: "#contact",
        start: "top bottom",
        end: "bottom bottom",
        scrub: 1
    },
    x: 0,
    y: 0.5,
    scale: 1.2
});

// --- Responsive ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Adjust mascot scale for mobile
    if (window.innerWidth < 768) {
        mascotMesh.scale.set(0.6, 0.6, 0.6);
    } else {
        mascotMesh.scale.set(1, 1, 1);
    }
});

// Initial check
if (window.innerWidth < 768) {
    mascotMesh.scale.set(0.6, 0.6, 0.6);
}
