
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1. Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Darker background for more contrast

// 2. Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 10);

// 3. Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 4. Grid Helper
const gridHelper = new THREE.GridHelper(20, 20);
scene.add(gridHelper);

// 5. Central Cube
const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshStandardMaterial({
  color: 0x0095dd,
  metalness: 0.5,
  roughness: 0.7,
});
const cube = new THREE.Mesh(geometry, material);
cube.position.y = 2; // Position cube above the grid
scene.add(cube);

// 6. Lighting
const directionalLight = new THREE.DirectionalLight(0xffffff, 4.0);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

// 7. Starfield
const starVertices = [];
for (let i = 0; i < 10000; i++) {
  const x = (Math.random() - 0.5) * 2000;
  const y = (Math.random() - 0.5) * 2000;
  const z = (Math.random() - 0.5) * 2000;
  starVertices.push(x, y, z);
}

const starsGeometry = new THREE.BufferGeometry();
starsGeometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(starVertices, 3)
);

const starsMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.7,
  blending: THREE.AdditiveBlending,
  transparent: true,
  depthWrite: false,
});

const starfield = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starfield);

// 8. Particle Ring System
const particleCount = 20000;
const particlesData = [];
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

const innerRadius = 3;
const outerRadius = 5;

const color1 = new THREE.Color('white');
const color2 = new THREE.Color('yellow');
const color3 = new THREE.Color('orange');
const tempColor = new THREE.Color();

// Function to generate a normally distributed random number (Box-Muller transform)
function getNormalRandom(mean, stdDev) {
    let u1 = 0, u2 = 0;
    //Convert [0,1) to (0,1)
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z * stdDev + mean;
}

const meanRadius = (innerRadius + outerRadius) / 2;
const stdDevRadius = (outerRadius - innerRadius) / 4; // Controls the spread

for (let i = 0; i < particleCount; i++) {
  // Generate radius using a normal distribution
  let radius = getNormalRandom(meanRadius, stdDevRadius);
  // Clamp the radius to ensure it stays within the desired ring bounds
  radius = Math.max(innerRadius, Math.min(outerRadius, radius));
  
  const angle = Math.random() * Math.PI * 2;

  // Speed is inversely proportional to radius (Kepler-like motion)
  const speed = 0.4 / radius; 

  particlesData.push({ radius, angle, speed });

  // Define particles in the XY plane; rotation will be handled by the object
  positions[i * 3] = Math.cos(angle) * radius;
  positions[i * 3 + 1] = Math.sin(angle) * radius;
  positions[i * 3 + 2] = 0; // Make the ring perfectly flat

  // Assign color based on radius
  const normalizedRadius = (radius - innerRadius) / (outerRadius - innerRadius);
  if (normalizedRadius < 0.5) {
      // Interpolate between white and yellow
      tempColor.lerpColors(color1, color2, normalizedRadius * 2);
  } else {
      // Interpolate between yellow and orange
      tempColor.lerpColors(color2, color3, (normalizedRadius - 0.5) * 2);
  }
  
  colors[i * 3] = tempColor.r;
  colors[i * 3 + 1] = tempColor.g;
  colors[i * 3 + 2] = tempColor.b;
}

const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const particleMaterial = new THREE.PointsMaterial({
  size: 0.05,
  blending: THREE.AdditiveBlending,
  transparent: true,
  depthWrite: false,
  vertexColors: true, // Use the colors from the geometry
});

const particleRing = new THREE.Points(particleGeometry, particleMaterial);
particleRing.position.copy(cube.position); // Center the ring on the cube
particleRing.rotation.x = Math.PI / 3; // Apply tilt to the whole object
scene.add(particleRing);


// 9. Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI / 2 - 0.05;

// 10. Animation Loop
function animate() {
  requestAnimationFrame(animate);

  controls.update();

  // Rotate the cube on its own axis
  cube.rotation.x += 0.005;
  cube.rotation.y += 0.005;

  // Animate each particle in the ring individually
  const positions = particleRing.geometry.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    const data = particlesData[i];
    
    // Update angle based on individual speed
    data.angle += data.speed;
    
    const index = i * 3;
    // Recalculate position in the local XY plane
    positions[index] = Math.cos(data.angle) * data.radius;
    positions[index + 1] = Math.sin(data.angle) * data.radius;
    // The Z position (thickness) doesn't change.
  }
  particleRing.geometry.attributes.position.needsUpdate = true;

  // Slowly rotate the starfield for a parallax effect
  starfield.rotation.y += 0.0001;

  renderer.render(scene, camera);
}

// 11. Responsive Design
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);

// Start the animation
animate();
