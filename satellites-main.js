import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
    json2satrec,
    propagate,
    gstime,
    degreesToRadians,
    eciToGeodetic,
    degreesLat,
    degreesLong
} from 'https://esm.sh/satellite.js@6.0.2';

import { ommWorldview3 } from './satellites-worldview3.js';
// <script type="module" src="./satellites-worldview3.js"> </script>




// --- 1. CONFIGURATION DE LA SCÈNE ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --- 2. LUMIÈRES ---
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
sunLight.position.set(5, 3, 5);
scene.add(sunLight);

// --- 3. LA TERRE (Sphère de rayon 4) ---
const earthRadius = 4;
const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);

// Texture de base simplifiée en couleur (vous pourrez y ajouter une vraie image de la Terre plus tard)
const earthMaterial = new THREE.MeshPhongMaterial({
    color: 0x154360,
    wireframe: true // Mode grille pour bien voir l'effet 3D et le mouvement
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// --- 4. LE SATELLITE ---
const satGeometry = new THREE.SphereGeometry(0.15, 16, 16);
const satMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
const satelliteGrobThreeJS = new THREE.Mesh(satGeometry, satMaterial);
scene.add(satelliteGrobThreeJS);

// Tracé de l'orbite (Optionnel, pour le style)
const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x444444 });
const orbitPoints = [];
// On dessine un cercle d'orbite à une altitude fixe de 1.5 unités au-dessus de la Terre
const orbitalRadius = earthRadius + 1.5;
for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    orbitPoints.push(new THREE.Vector3(Math.cos(angle) * orbitalRadius, 0, Math.sin(angle) * orbitalRadius));
}
const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
scene.add(orbitLine);

// Inclinaison de l'orbite de 45 degrés pour qu'elle ne soit pas plate
orbitLine.rotation.x = Math.PI / 4;

// --- 5. FONCTION DE CONVERSION COORDONNÉES ---
function getSatellitePosition(lat, lon, alt) {
    const r = earthRadius + alt;
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    return new THREE.Vector3(
        -(r * Math.sin(phi) * Math.sin(theta)),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.cos(theta)
    );
}

// --- 6. BOUCLE D'ANIMATION ---
let longitude = 0;
const latitude = 45; // On garde une latitude fixe pour cette démo d'orbite simple
const altitude = 1.5; // Altitude par rapport à la surface



const satRecWorldview3 = json2satrec(ommWorldview3);
console.log(satRecWorldview3);

const divInfo1 = document.getElementById("info1");
const divInfo2 = document.getElementById("info2");
const divInfo3 = document.getElementById("info3");



function animate() {
    requestAnimationFrame(animate);



    const now = new Date();
    divInfo1.innerHTML = `<strong>Date:</strong> ${now.toString()}`;

    const positionAndVelocityECI = propagate(satRecWorldview3, now);
    const positionECI = positionAndVelocityECI.position;

    divInfo2.innerHTML = `
    <p>ECI (Earth Centered Inertial):</p>
    <p>X: ${positionECI.x.toFixed(2)}km</p>
    <p>Y: ${positionECI.y.toFixed(2)}km</p>
    <p>Z: ${positionECI.z.toFixed(2)}km</p>
    `;

    const poitiersGd = {
        latitude: degreesToRadians(46.55677300119089),
        longitude: degreesToRadians(0.31380768108744067),
        height: 0.128
    };

    const gmst = gstime(now);
    const positionGeodeticSatellite = eciToGeodetic(positionECI, gmst);

    const satelliteGd = {
        latitude: degreesLat(positionGeodeticSatellite.latitude),
        longitude: degreesLong(positionGeodeticSatellite.longitude),
        height: positionGeodeticSatellite.height
    }

    divInfo3.innerHTML = `
    <p>Earth cordinates</p>
    <p>lat: ${satelliteGd.latitude.toFixed(2)}°</p>
    <p>long: ${satelliteGd.longitude.toFixed(2)}°</p>
    <p>alt: ${satelliteGd.height.toFixed(2)}km</p>
    `;



    // Mise à jour de la position du satellite
    const newPos = latLonToVector3(satelliteGd.latitude, satelliteGd.longitude, satelliteGd.height);
    satelliteGrobThreeJS.position.copy(newPos);

    // Légère rotation de la Terre
    earth.rotation.y += 0.002;

    controls.update();
    renderer.render(scene, camera);
}

animate();

// --- 7. REDIMENSIONNEMENT FENÊTRE ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});






// R : Rayon de votre Terre 3D + Altitude du satellite
// lat : Latitude en degrés (-90 à 90)
// lon : Longitude en degrés (-180 à 180)
function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.sin(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);

    return new THREE.Vector3(x, y, z);
}