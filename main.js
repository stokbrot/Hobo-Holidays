import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';

import { FontLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/geometries/TextGeometry.js';


const fontLoader = new FontLoader();
// After font is loaded
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font) {
  window.loadedFont = font;

  // Fetch route data from JSON
  fetch('routes.json')
    .then(response => response.json())
    .then(routes => {
      routes.forEach(route => {
        // Build arc points for curved line
        let arcPointsArray = [];
        for (let i = 0; i < route.coordinates.length - 1; i++) {
          const [lat1, lon1] = route.coordinates[i];
          const [lat2, lon2] = route.coordinates[i + 1];
          arcPointsArray = arcPointsArray.concat(
            arcPoints(lat1, lon1, lat2, lon2, 1.01, 48).slice(0, -1)
          );
        }
        // Add the last point
        const [lastLat, lastLon] = route.coordinates[route.coordinates.length - 1];
        arcPointsArray.push(latLonToXYZ(lastLat, lastLon, 1.01));
        const geometry = new THREE.BufferGeometry().setFromPoints(arcPointsArray);

        // Thicker line (note: linewidth only works in some browsers)
        const material = new THREE.LineBasicMaterial({ color: 0xff4444, linewidth: 20 });
        const line = new THREE.Line(geometry, material);
        scene.add(line);

        // Find the northernmost coordinate
        let maxLat = -Infinity;
        let northIdx = 0;
        route.coordinates.forEach(([lat, lon], idx) => {
          if (lat > maxLat) {
            maxLat = lat;
            northIdx = idx;
          }
        });
        const [northLat, northLon] = route.coordinates[northIdx];
        const northPos = latLonToXYZ(northLat, northLon, 1.04);

        // Add clickable label at the northernmost point
        if (window.loadedFont && route.name) {
          const label = createTextLabel3D(route.name, window.loadedFont, 0.04);
          label.position.copy(northPos);
          label.lookAt(new THREE.Vector3(0, 0, 0));
          label.children[1].rotation.y = Math.PI;
          label.children[0].rotation.y = Math.PI;
          label.userData.routeInfo = route;
          scene.add(label);

          if (!window.routeLabels) window.routeLabels = [];
          window.routeLabels.push(label.children[1]);
        }
      });
    })
    .catch(err => console.error('Error loading routes.json:', err));
});


const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Create scene
const scene = new THREE.Scene();
// Create camera
const camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.1, 1000);

//
const markers = []; // Global array

camera.position.x = 1 
camera.position.y = 1
camera.position.z = -10

camera.position.set(0, 0, 3); // 3 units away from the globe

// Convert Berlin's lat/lon to 3D position, then move outward
const germanyPos = latLonToXYZ(52.52, 13.405, 2.5); // 2.5 units from center
camera.position.copy(germanyPos);
camera.lookAt(0, 0, 0);

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
scene.background = new THREE.Color(0x222222); // dark gray background

// Earth texture
//let globe; // make globe a global variable
const textureLoader = new THREE.TextureLoader();

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // smooth drag
controls.dampingFactor = 0.05; // Keep it constant for damping
controls.enablePan = true;     // allow panning
controls.enableZoom = true;    // allow zooming

controls.maxdistance = 10; // Maximum zoom out distance
controls.minDistance = 1.1;
controls.maxPolarAngle = Math.PI - 0.01; // Prevents flipping over the top
controls.screenSpacePanning = false;

controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.PAN
};

// Web Images
//textureLoader.setCrossOrigin('anonymous');
//const proxyUrl = 'https://corsproxy.io/?url=';
//const imageUrl = 'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x21600x21600.A1.png'; //Stupid thing doesnt even work and is like 200mb
//const texture = textureLoader.load(proxyUrl + imageUrl,


const starTexture = new THREE.TextureLoader().load('src/1.jpg');
const starGeometry = new THREE.SphereGeometry(5, 64, 64);
const starMaterial = new THREE.MeshBasicMaterial({
  map: starTexture,
  side: THREE.BackSide
});
const starField = new THREE.Mesh(starGeometry, starMaterial);
//scene.add(starField);

// const texture = textureLoader.load('src/22.jpg',
//   (texture) => {
//     texture.minFilter = THREE.LinearMipMapLinearFilter;
//     texture.magFilter = THREE.LinearFilter;
//     texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

//     // Once the texture is loaded, hide the loading spinner
//     document.getElementById('loader-id').style.display = 'none';

//     scene.background = new THREE.Color(0x101010); // light gray background
//     // Create the sphere (globe)
//     const globeGeometry = new THREE.SphereGeometry(1, 32, 128); // radius of 1
//     const globeMaterial = new THREE.MeshBasicMaterial({
//       map: texture,
//     });
//     globe = new THREE.Mesh(globeGeometry, globeMaterial);
//     scene.add(globe);  


//     console.log(`Loaded Textures...`);
//   },
//   (error) => {
//     // Handle any loading errors
//     console.error('Error loading texture:', error);
//     document.getElementById('loader-id').innerHTML = 'Error loading texture!';
//   }
// );

const globeGeometry = new THREE.SphereGeometry(1, 32, 128);
const globeMaterial = new THREE.MeshBasicMaterial({ color: 0x222222, wireframe: false });
const globe = new THREE.Mesh(globeGeometry, globeMaterial);
scene.add(globe);


function createTextLabel3D(text, font, size = 0.03) {
  const textGeometry = new TextGeometry(text, {
    font: font,
    size: size,
    height: 0.005,
    curveSegments: 12,
    bevelEnabled: false,
  });

  // Center text horizontally
  textGeometry.computeBoundingBox();
  const bbox = textGeometry.boundingBox;
  const xOffset = -0.5 * (bbox.max.x - bbox.min.x);
  textGeometry.translate(xOffset, 0, 0);

  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    toneMapped: false,
  });

  const outlineMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.BackSide, // back side for outline
    toneMapped: false,
  });

  const textMesh = new THREE.Mesh(textGeometry, material);

  // Clone geometry for outline
  const outlineGeometry = textGeometry.clone();
  const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
  outlineMesh.scale.multiplyScalar(1.05); // slightly bigger for outline

  // Combine both into a group
  const group = new THREE.Group();
  group.add(outlineMesh);
  group.add(textMesh);

  return group;
}



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

function arcPoints(lat1, lon1, lat2, lon2, radius, segments = 64) {
  const start = latLonToXYZ(lat1, lon1, radius);
  const end = latLonToXYZ(lat2, lon2, radius);
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Slerp between start and end
    const pt = new THREE.Vector3().copy(start).lerp(end, t).normalize().multiplyScalar(radius);
    points.push(pt);
  }
  return points;
}

/*
function addMarker(latitude, longitude, name, placeInfo) {
  const radius = 1;
  const position = latLonToXYZ(latitude, longitude, radius);

  // Create sphere for the marker
  const markerGeometry = new THREE.SphereGeometry(0.01, 16, 16);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 });
  const clickableSphere = new THREE.Mesh(markerGeometry, markerMaterial);

  // Optional glow sprite
  const spriteMaterial = new THREE.SpriteMaterial({
    map: new THREE.TextureLoader().load('src/glow.png'),
    color: 0xff4444,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const glow = new THREE.Sprite(spriteMaterial);
  glow.scale.set(0.04, 0.05, 0.05);
  clickableSphere.add(glow);

  // Parent object to hold marker and text
  const marker = new THREE.Object3D();
  marker.position.copy(position);
  marker.add(clickableSphere);
  marker.userData.clickableMesh = clickableSphere; // reference for raycasting
  marker.userData.placeInfo = placeInfo; // Store all info for popup

  // Add label
  if (window.loadedFont) {
    const label = createTextLabel3D(name, window.loadedFont, 0.03);
    label.name = 'markerLabel';
    marker.add(label);
    marker.userData.labelMesh = label.children[1];

    // Compute bounding box for the text mesh
    label.children[1].geometry.computeBoundingBox();
    const bbox = label.children[1].geometry.boundingBox;
    const size = new THREE.Vector3();
    bbox.getSize(size);

    // Create an invisible box mesh for easier hover detection
    const boxGeometry = new THREE.BoxGeometry(size.x * 1.5, size.y * 2, size.z * 2);
    const boxMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const hoverBox = new THREE.Mesh(boxGeometry, boxMaterial);

    // Position the box at the same place as the label
    hoverBox.position.copy(label.position);

    // Make label face away from globe center
    label.lookAt(marker.position.clone().multiplyScalar(2));

    // Match box rotation to label rotation
    hoverBox.quaternion.copy(label.quaternion);

    marker.add(hoverBox);
    marker.userData.hoverBox = hoverBox;
  } else {
    console.warn("Font not loaded yet. Label will not show.");
  }

  scene.add(marker);
  markers.push(marker);

  console.log(renderer.capabilities.maxTextureSize);
}
*/


function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Check for route label clicks
  if (window.routeLabels) {
    const intersects = raycaster.intersectObjects(window.routeLabels, false);
    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      const label = window.routeLabels.find(l => l === clickedMesh);
      if (label && label.parent && label.parent.userData.routeInfo) {
        const info = label.parent.userData.routeInfo;
        const popup = document.getElementById('marker-popup');
        popup.querySelectorAll('#popup-text')[0].textContent = info.title || '';
        popup.querySelector('iframe').src = info.video || '';
        popup.querySelectorAll('#popup-text')[1].textContent = info.description || '';
        popup.style.left = '50%';
        popup.style.top = '50%';
        popup.style.display = 'block';
        popup.classList.add('show-popup');
        return;
      }
    }
  }
  // ... (optional: handle other clicks)
}

document.getElementById('close-popup-btn').onclick = function() {
  const popup = document.getElementById('marker-popup');
  popup.style.display = 'none';
  popup.classList.remove('show-popup');
};


const dummy = new THREE.Object3D(); // Only needs to be created once

function updatedzoom() {
  const distance = camera.position.length();
  controls.rotateSpeed = distance / 10;
  controls.zoomSpeed = Math.max(0.2, Math.min(2, distance * 0.3));
  controls.panSpeed = Math.max(0.05, Math.min(0.5, distance * 0.1)); // Less pan when close
}


// Track hovered label
let hoveredLabel = null;

// Listen for mouse movement
window.addEventListener('mousemove', onMouseMove, false);

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// Highlight label function
function highlightLabel() {
  raycaster.setFromCamera(mouse, camera);

  // Reset all route labels to white
  if (window.routeLabels) {
    window.routeLabels.forEach(mesh => mesh.material.color.set(0xffffff));
    const intersects = raycaster.intersectObjects(window.routeLabels, false);
    if (intersects.length > 0) {
      intersects[0].object.material.color.set(0xffff00); // yellow
      hoveredLabel = intersects[0].object;
    } else {
      hoveredLabel = null;
    }
  }
}

// Update the rotation speed during the animation loop
function animate() {
  requestAnimationFrame(animate);
  updatedzoom();
  controls.update();
  highlightLabel();

  // Scale marker spheres based on camera distance
  const distance = camera.position.length();
  markers.forEach(marker => {
    if (marker.userData.clickableMesh) {
      // Adjust the scaling factor as needed for your scene
      const scale = Math.max(0.01, 0.04 / distance);
      marker.userData.clickableMesh.scale.set(scale, scale, scale);
    }
  });

  renderer.render(scene, camera);
}
animate();

fetch('data/countries.json')
  .then(response => response.json())
  .then(geojson => {
    const positions = [];
    geojson.features.forEach(feature => {
      feature.geometry.coordinates.forEach(polygon => {
        const rings = Array.isArray(polygon[0][0]) ? polygon : [polygon];
        rings.forEach(ring => {
          for (let i = 0; i < ring.length - 1; i++) {
            const [lon1, lat1] = ring[i];
            const [lon2, lat2] = ring[i + 1];
            [ [lat1, lon1], [lat2, lon2] ].forEach(([lat, lon]) => {
              const v = latLonToXYZ(lat, lon, 1); // Use your function!
              positions.push(v.x, v.y, v.z);
            });
          }
        });
      });
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
    const lines = new THREE.LineSegments(geometry, material);
    scene.add(lines);

    document.getElementById('loader-id').style.display = 'none';
  });

renderer.domElement.addEventListener('dragstart', (e) => e.preventDefault());
renderer.domElement.addEventListener('selectstart', (e) => e.preventDefault());
