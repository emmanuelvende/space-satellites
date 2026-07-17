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

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
// camera.position.set(0, 500, 7000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;


// --- LUMIERES ---
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
sunLight.position.set(-10000, 0, 0);
scene.add(sunLight);


// --- LA TERRE ---
const earthRadius = 6371;
const earthGeometry = new THREE.IcosahedronGeometry(earthRadius, 15);

const earthMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    wireframe: true,
    transparent: true,
    opacity: 0.2
});

const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);



// --- LE SATELLITE ---
const satSize = 500; // 500 km de côté :)
const satGeometry = new THREE.BoxGeometry(satSize, satSize, satSize);
const satMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
const satelliteGrobThreeJS = new THREE.Mesh(satGeometry, satMaterial);

scene.add(satelliteGrobThreeJS);

camera.position.set(15000, 10000, 15000);
camera.near = 10;
camera.far = 50000;
camera.updateProjectionMatrix(); // appliquer chgt de clipping
controls.target.set(0, 0, 0);
controls.update();



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


const satRecWorldview3 = json2satrec(ommWorldview3);
console.log(satRecWorldview3);

const divInfo1 = document.getElementById("info1");
const divInfo2 = document.getElementById("info2");
const divInfo3 = document.getElementById("info3");



function animate() {
    requestAnimationFrame(animate);

    const now = new Date();
    divInfo1.innerHTML = `
    <div>DATE: <strong>${now.toLocaleString()}</strong></div>
    <div>NAME: <strong>${ommWorldview3.OBJECT_NAME}</strong></div>
    <div>ID: <strong>${ommWorldview3.OBJECT_ID}</strong></div>
    <div>NORAD: <strong>${ommWorldview3.NORAD_CAT_ID}</strong></div>
    `;

    const positionAndVelocityECI = propagate(satRecWorldview3, now);
    const positionECI = positionAndVelocityECI.position;

    divInfo2.innerHTML = `
    <div>ECI (Earth Centered Inertial):</div>
    <div>X: <strong>${positionECI.x.toFixed(2)}</strong> km</div>
    <div>Y: <strong>${positionECI.y.toFixed(2)}</strong> km</div>
    <div>Z: <strong>${positionECI.z.toFixed(2)}</strong> km</div>
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
    <div>Earth cordinates</div>
    <div>lat: <strong>${satelliteGd.latitude.toFixed(2)}</strong>°</div>
    <div>long: <strong>${satelliteGd.longitude.toFixed(2)}</strong>°</div>
    <div>alt: <strong>${satelliteGd.height.toFixed(2)}</strong> km</div>
    `;



    // Mise à jour de la position du satellite
    const newPos = latLonToVector3(
        satelliteGd.latitude,
        satelliteGd.longitude,
        satelliteGd.height + earthRadius);
    satelliteGrobThreeJS.position.copy(newPos);

    /*
    // Légère rotation de la Terre
    earth.rotation.y += 0.002;
*/
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
