import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';

// Raycaster to detect click pos
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Create scene
const scene = new THREE.Scene();
// Create camera
const camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.1, 1000);

//
const markers = []; // Global array

camera.position.x = 0.7213294338270165 
camera.position.y = 0.9072717306165103 
camera.position.z = -0.0039621316697567

// Adjust the camera's aspect ratio and renderer size on window resize
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix(); // Update camera projection to match the new aspect ratio
});

// Function to convert latitude and longitude to 3D coordinates
function latLonToXYZ(latitude, longitude, radius) {
  const latRad = THREE.MathUtils.degToRad(latitude);  // Convert latitude to radians
  const lonRad = THREE.MathUtils.degToRad(-longitude); // Convert longitude to radians
  
  // Correct the positions so that longitude affects the X-axis and latitude affects the Y-axis
  const x = radius * Math.cos(latRad) * Math.cos(lonRad); // X = radius * cos(latitude) * cos(longitude)
  const y = radius * Math.sin(latRad); // Y = radius * sin(latitude)
  const z = radius * Math.cos(latRad) * Math.sin(lonRad); // Z = radius * cos(latitude) * sin(longitude)
  
  return new THREE.Vector3(x, y, z);
}

// Function to add marker at a given latitude and longitude
function addMarker(latitude, longitude) {
  const radius = 1; // Globe radius
  const position = latLonToXYZ(latitude, longitude, radius);
  
  // Create a small sphere for the marker
  const markerGeometry = new THREE.SphereGeometry(0.01, 16, 16); // small sphere
  const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // red color
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  
  // Position the marker at the calculated coordinates
  marker.position.copy(position);
  
  // Add marker to the scene
  scene.add(marker);
  markers.push(marker); // Store it globally
}

window.addEventListener('click', onClick, false);

function onClick(event) {
  // Convert mouse position to normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Set up the raycaster from the camera and mouse
  raycaster.setFromCamera(mouse, camera);

  // Check if any markers were intersected
  const intersects = raycaster.intersectObjects(markers); // 'markers' should be an array of your marker meshes

  if (intersects.length > 0) {
    console.log('Clicked on marker:', intersects[0].object);
    // You can do more here (e.g. highlight, remove, scale, etc.)
  }
}

// Create renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set background color for better visibility
scene.background = new THREE.Color(0xDDDDDD); // light gray background

// Earth texture
const textureLoader = new THREE.TextureLoader();

const texture = textureLoader.load('src/2.jpg', // Path to your texture
  (texture) => {
    // Once the texture is loaded, hide the loading spinner
    document.getElementById('loader-id').style.display = 'none';

    scene.background = new THREE.Color(0x101010); // light gray background
    // Create the sphere (globe)
    const globeGeometry = new THREE.SphereGeometry(1, 32, 128); // radius of 1
    const globeMaterial = new THREE.MeshBasicMaterial({
      map: texture,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);  

    addMarker(51.5074, -0.1278); // London

    console.log(`Loaded Texture...`);
  },
  (error) => {
    // Handle any loading errors
    console.error('Error loading texture:', error);
    document.getElementById('loader-id').innerHTML = 'Error loading texture!';
  }
);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // smooth drag
controls.dampingFactor = 0.05; // Keep it constant for damping
controls.enablePan = true;     // allow panning
controls.enableZoom = true;    // allow zooming

// Set the minimum and maximum distance the camera can be from the globe
controls.minDistance = 1.2; // Minimum zoom-out distance
controls.maxDistance = 10; // Maximum zoom-in distance (adjust as needed)




function updatedzoom() {

  // Maybe bad habbot to call every render. Need listener or sum
  controls.rotateSpeed = camera.position.length() / 10;

  //const dis = camera.position.distanceTo(markers[0].position);

  //if(dis>0.29 && dis < 2){
    //markers[0].scale.set(dis/20, dis/20, dis/20)
  //}

}

// Update the rotation speed during the animation loop
function animate() {
  requestAnimationFrame(animate);
  updatedzoom(); // Dynamically adjust rotation speed based on zoom
  controls.update(); // important! for damping to work
  //console.log(camera.position);

  renderer.render(scene, camera);
}
animate();

