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

camera.position.x = 1 
camera.position.y = 1
camera.position.z = -10

camera.position.set( 1.3219999752674745, 1.6569596294334912, -0.24340646945655547 )

// Adjust the camera's aspect ratio and renderer size on window resize
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix(); // Update camera projection to match the new aspect ratio
});

window.addEventListener('click', onClick, false);



// Create renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set background color for better visibility
scene.background = new THREE.Color(0xDDDDDD); // light gray background

// Earth texture
let globe; // make globe a global variable
const textureLoader = new THREE.TextureLoader();

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // smooth drag
controls.dampingFactor = 0.05; // Keep it constant for damping
controls.enablePan = true;     // allow panning
controls.enableZoom = true;    // allow zooming

// Set the minimum and maximum distance the camera can be from the globe
controls.minDistance = 1.2; // Minimum zoom-out distance
controls.maxDistance = 10; // Maximum zoom-in distance (adjust as needed)

// Web Images
//textureLoader.setCrossOrigin('anonymous');
//const proxyUrl = 'https://corsproxy.io/?url=';
//const imageUrl = 'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x21600x21600.A1.png'; //Stupid thing doesnt even work and is like 200mb
//const texture = textureLoader.load(proxyUrl + imageUrl,

const texture = textureLoader.load('src/2.jpg',

  (texture) => {
    // Once the texture is loaded, hide the loading spinner
    document.getElementById('loader-id').style.display = 'none';

    scene.background = new THREE.Color(0x101010); // light gray background
    // Create the sphere (globe)
    const globeGeometry = new THREE.SphereGeometry(1, 32, 128); // radius of 1
    const globeMaterial = new THREE.MeshBasicMaterial({
      map: texture,
    });
    globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);  

    addMarker(51.14368179252207, 14.384149664089483); // Doberschau

    console.log(`Loaded Textures...`);
  },
  (error) => {
    // Handle any loading errors
    console.error('Error loading texture:', error);
    document.getElementById('loader-id').innerHTML = 'Error loading texture!';
  }
);

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

  marker.videoId = 'ge2WkKwGZ6E'; 

  // Position the marker at the calculated coordinates
  marker.position.copy(position);
  
  // Add marker to the scene
  scene.add(marker);
  markers.push(marker); // Store it globally
}

function onClick(event) {
  // Convert mouse position to normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Set up the raycaster from the camera and mouse
  raycaster.setFromCamera(mouse, camera);

  // Check if any markers were intersected
  const globeIntersects = raycaster.intersectObject(globe);
  const intersects = raycaster.intersectObjects(markers);  //intersects[0] is the closest hit meaning the clicked one

  if (globeIntersects.length == 0 || intersects[0].distance < globeIntersects[0].distance) { // no globe collision OR marker is in front

    console.log('Clicked on marker:', intersects[0].object);

    // You can do more here (e.g. highlight, remove, scale, etc.)

    const vector = intersects[0].object.position.clone().project(camera);
    const x = (vector.x + 1) / 2 * window.innerWidth;
    const y = (-vector.y + 1) / 2 * window.innerHeight;

    const popup = document.getElementById('marker-popup');
    const iframe = popup.querySelector('iframe');

    // Set the video URL with autoplay enabled
    iframe.src = `https://www.youtube.com/embed/${intersects[0].object.videoId}?autoplay=1`;

    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popup.style.display = 'block';

  }
}


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

