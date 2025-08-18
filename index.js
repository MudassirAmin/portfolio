// Import the necessary Three.js modules
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1. Scene Setup
// Create a new Three.js scene, which will hold all our objects
const scene = new THREE.Scene();
// Set the background color of the scene to black
scene.background = new THREE.Color(0x000000); // Darker background for more contrast

// 2. Camera
// Create a perspective camera, which is what we'll use to view the scene
const camera = new THREE.PerspectiveCamera(
  75, // Field of view
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1, // Near clipping plane
  1000 // Far clipping plane
);
// Set the initial position of the camera
camera.position.set(0, 5, 10);

// 3. Renderer
// Create a WebGL renderer, which will render the scene
const renderer = new THREE.WebGLRenderer({ antialias: true });
// Set the size of the renderer to the size of the window
renderer.setSize(window.innerWidth, window.innerHeight);
// Add the renderer's canvas element to the DOM
document.body.appendChild(renderer.domElement);

// 4. Grid Helper
// Create a grid helper to help visualize the scene
const gridHelper = new THREE.GridHelper(20, 20);
// Add the grid helper to the scene
scene.add(gridHelper);

// 5. Central Cube
// Create a new box geometry for the cube
const geometry = new THREE.BoxGeometry(2, 2, 2);
// Create a new standard material for the cube
const material = new THREE.MeshStandardMaterial({
  color: 0x0095dd, // Set the color of the cube
  metalness: 0.5, // Set the metalness of the cube
  roughness: 0.7, // Set the roughness of the cube
});
// Create a new mesh with the geometry and material
const cube = new THREE.Mesh(geometry, material);
// Set the position of the cube above the grid
cube.position.y = 2;
// Add the cube to the scene
scene.add(cube);

// 6. Lighting
// Create a new directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 4.0);
// Set the position of the directional light
directionalLight.position.set(5, 5, 5);
// Add the directional light to the scene
scene.add(directionalLight);

// Create a new ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
// Add the ambient light to the scene
scene.add(ambientLight);

// 7. Starfield
// Create an array to hold the vertices of the stars
const starVertices = [];
// Loop 10,000 times to create 10,000 stars
for (let i = 0; i < 10000; i++) {
  // Generate a random x, y, and z position for each star
  const x = (Math.random() - 0.5) * 2000;
  const y = (Math.random() - 0.5) * 2000;
  const z = (Math.random() - 0.5) * 2000;
  // Push the x, y, and z position to the starVertices array
  starVertices.push(x, y, z);
}

// Create a new buffer geometry for the stars
const starsGeometry = new THREE.BufferGeometry();
// Set the position attribute of the stars geometry
starsGeometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(starVertices, 3)
);

// Create a new points material for the stars
const starsMaterial = new THREE.PointsMaterial({
  color: 0xffffff, // Set the color of the stars to white
  size: 0.7, // Set the size of the stars
  blending: THREE.AdditiveBlending, // Use additive blending for a glowing effect
  transparent: true, // Make the stars transparent
  depthWrite: false, // Don't write to the depth buffer
});

// Create a new points object with the stars geometry and material
const starfield = new THREE.Points(starsGeometry, starsMaterial);
// Add the starfield to the scene
scene.add(starfield);

// 8. Particle Ring System
// Set the number of particles in the ring
const particleCount = 20000;
// Create an array to hold the data for each particle
const particlesData = [];
// Create a Float32Array to hold the positions of the particles
const positions = new Float32Array(particleCount * 3);
// Create a Float32Array to hold the colors of the particles
const colors = new Float32Array(particleCount * 3);

// Set the inner and outer radius of the ring
const innerRadius = 2;
const outerRadius = 5;

// Create three new colors for the particles
const color1 = new THREE.Color('white');
const color2 = new THREE.Color('yellow');
const color3 = new THREE.Color('orange');
// Create a temporary color to use for interpolation
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

// Calculate the mean and standard deviation of the radius
const meanRadius = (innerRadius + outerRadius) / 2;
const stdDevRadius = (outerRadius - innerRadius) / 4; // Controls the spread

// Loop through each particle
for (let i = 0; i < particleCount; i++) {
  // Generate a random radius using a normal distribution
  let radius = getNormalRandom(meanRadius, stdDevRadius);
  // Clamp the radius to ensure it stays within the desired ring bounds
  radius = Math.max(innerRadius, Math.min(outerRadius, radius));
  
  // Generate a random angle
  const angle = Math.random() * Math.PI * 2;

  // The speed is inversely proportional to the radius (Kepler-like motion)
  const speed = 0.1 / radius; 

  // Push the radius, angle, and speed to the particlesData array
  particlesData.push({ radius, angle, speed });

  // Define the particles in the XY plane; the rotation will be handled by the object
  positions[i * 3] = Math.cos(angle) * radius;
  positions[i * 3 + 1] = Math.sin(angle) * radius;
  positions[i * 3 + 2] = 0; // Make the ring perfectly flat

  // Assign a color based on the radius
  const normalizedRadius = (radius - innerRadius) / (outerRadius - innerRadius);
  if (normalizedRadius < 0.5) {
      // Interpolate between white and yellow
      tempColor.lerpColors(color1, color2, normalizedRadius * 2);
  } else {
      // Interpolate between yellow and orange
      tempColor.lerpColors(color2, color3, (normalizedRadius - 0.5) * 2);
  }
  
  // Set the color of the particle
  colors[i * 3] = tempColor.r;
  colors[i * 3 + 1] = tempColor.g;
  colors[i * 3 + 2] = tempColor.b;
}

// Create a new buffer geometry for the particles
const particleGeometry = new THREE.BufferGeometry();
// Set the position attribute of the particle geometry
particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
// Set the color attribute of the particle geometry
particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

// Create a new points material for the particles
const particleMaterial = new THREE.PointsMaterial({
  size: 0.05, // Set the size of the particles
  blending: THREE.AdditiveBlending, // Use additive blending for a glowing effect
  transparent: true, // Make the particles transparent
  depthWrite: false, // Don't write to the depth buffer
  vertexColors: true, // Use the colors from the geometry
});

// Create a new points object with the particle geometry and material
const particleRing = new THREE.Points(particleGeometry, particleMaterial);
// Center the ring on the cube
particleRing.position.copy(cube.position);
// Apply a tilt to the whole object
particleRing.rotation.x = Math.PI / 3;
// Add the particle ring to the scene
scene.add(particleRing);


// 9. Controls
// Create new orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
// Enable damping for a smoother feel
controls.enableDamping = true;
// Set the damping factor
controls.dampingFactor = 0.05;
// Set the minimum and maximum distance you can zoom in and out
controls.minDistance = 5;
controls.maxDistance = 70;
// Set the maximum polar angle (how far you can rotate up and down)
controls.maxPolarAngle = Math.PI / 2 - 0.05;

// 10. Animation Loop
// Create a function to animate the scene
function animate() {
  // Request the next frame of the animation
  requestAnimationFrame(animate);

  // Update the orbit controls
  controls.update();

  // Rotate the cube on its own axis
  cube.rotation.x += 0.005;
  cube.rotation.y += 0.005;

  // Animate each particle in the ring individually
  const positions = particleRing.geometry.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    const data = particlesData[i];
    
    // Update the angle based on the individual speed
    data.angle += data.speed;
    
    const index = i * 3;
    // Recalculate the position in the local XY plane
    positions[index] = Math.cos(data.angle) * data.radius;
    positions[index + 1] = Math.sin(data.angle) * data.radius;
    // The Z position (thickness) doesn't change.
  }
  // Tell Three.js that the position attribute of the particle ring's geometry needs to be updated
  particleRing.geometry.attributes.position.needsUpdate = true;

  // Slowly rotate the starfield for a parallax effect
  starfield.rotation.y += 0.0003;

  // Render the scene with the camera
  renderer.render(scene, camera);
}

// 11. Responsive Design
// Create a function to handle window resizing
function onWindowResize() {
  // Update the camera's aspect ratio
  camera.aspect = window.innerWidth / window.innerHeight;
  // Update the camera's projection matrix
  camera.updateProjectionMatrix();
  // Update the size of the renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Add an event listener to the window to call the onWindowResize function when the window is resized
window.addEventListener('resize', onWindowResize, false);

// Start the animation
animate();
