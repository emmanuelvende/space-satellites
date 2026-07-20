import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import {
    json2satrec,
    propagate,
    gstime,
    degreesToRadians,
    eciToGeodetic,
    degreesLat,
    degreesLong,
    jday,
    sunPos
} from 'https://esm.sh/satellite.js@6.0.2';

import { ommWorldview3 } from './sats-info.js';
import { setupEarthGrid } from './earth-grid.js';
import { createLabel } from './utils.js';
import { createSunLight } from './sunlight.js';
import { World } from './world.js';

const world = new World();
const sunLight = createSunLight();
world.scene.add(sunLight);


// ==========================================
// --- LA TERRE ---
// ==========================================
const earthRadius = 6371;
const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 32); // 64 segments horizontaux et 32 verticaux pour une belle rondeur lisse
// ==========================================
// --- TEXTURE ET MATÉRIAU DE LA TERRE ---
// ==========================================
// 1. On charge la texture (Image de la Terre en haute définition)
const textureLoader = new THREE.TextureLoader();
// const earthTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');
// const earthTexture = textureLoader.load('./8k_earth_daymap.jpg');
// 2. On utilise MeshPhongMaterial pour qu'elle réagisse magnifiquement à ton SunLight
const earthMaterial = new THREE.MeshPhongMaterial({
    map: textureLoader.load('./8k_earth_daymap.jpg'),
    specularMap: textureLoader.load('./8k_earth_specular_map.tif'),
    specular: new THREE.Color('grey'),
    wireframe: false,
    transparent: true,
    opacity: 0.9,
    shininess: 15,
    // specular: new THREE.Color(0x404040),
    // emissive: new THREE.Color(0x001020)
});

const earthGrob = new THREE.Mesh(earthGeometry, earthMaterial);
world.scene.add(earthGrob);

// ==========================================
// --- REPÈRE ECI (Axes X, Y, Z) ---
// ==========================================
const axesHelper = new THREE.AxesHelper(50000);
world.scene.add(axesHelper);

const labelN = createLabel('ECI NORD (Y)', '#00ff00');
labelN.position.set(0, 12500, 0); // Placé juste au bout de l'axe vert
world.scene.add(labelN);

// Étiquette pour l'axe Vernal (X)
const labelX = createLabel('ECI X (0°)', '#ff0000');
labelX.position.set(12500, 0, 0);
world.scene.add(labelX);

// ==========================================
// --- L'ÉQUATEUR ---
// ==========================================
// On crée un anneau fin (Torus) légèrement plus large que la Terre
// Rayon interne : 6371 + 20km (pour pas qu'il rentre dans le maillage)
// Épaisseur du tube : 30km (pour être visible de loin)
const equatorGeometry = new THREE.TorusGeometry(earthRadius + 20, 30, 16, 100);

const equatorMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00, // Jaune vif pour bien le distinguer
    transparent: true,
    opacity: 0.8
});

const equator = new THREE.Mesh(equatorGeometry, equatorMaterial);

// Par défaut, l'anneau est dressé verticalement (sur le plan X-Y).
// On le couche à plat (rotation de 90° = Math.PI / 2 sur l'axe X) pour qu'il coupe la Terre au centre.
equator.rotation.x = Math.PI / 2;

world.scene.add(equator);



// ==========================================
// --- REPERE ECF (Tourne avec la Terre) ---
// ==========================================
// On crée un deuxième AxesHelper. Pour le différencier du ECI, 
// on le fait un peu plus court (9000 km)
const axesHelperECF = new THREE.AxesHelper(9000);

// TRÈS IMPORTANT : On l'ajoute à "earth", pas à "scene" !
earthGrob.add(axesHelperECF);


setupEarthGrid(earthGrob, earthRadius);

// --- LE SATELLITE ---
const satSize = 500;
const satGeometry = new THREE.BoxGeometry(satSize, satSize, satSize);
const satMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
const satelliteGrobThreeJS = new THREE.Mesh(satGeometry, satMaterial);

world.scene.add(satelliteGrobThreeJS);

world.camera.position.set(15000, 10000, 15000);
world.camera.near = 10;
world.camera.far = 400000;
world.camera.updateProjectionMatrix(); // appliquer chgt de clipping
world.controls.target.set(0, 0, 0);
world.controls.update();





const satRecWorldview3 = json2satrec(ommWorldview3);

const divInfo1 = document.getElementById("info1");
const divInfo2 = document.getElementById("info2");
const divInfo3 = document.getElementById("info3");


/*
const poitiersGd = {
    latitude: degreesToRadians(46.55677300119089),
    longitude: degreesToRadians(0.31380768108744067),
    height: 0.128
};
*/

const AU = 149600000;

function animate() {
    requestAnimationFrame(animate);

    const now = new Date();

    // Compute Sun position
    const jdayNow = jday(now.getUTCFullYear(),
        now.getUTCMonth() + 1,
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
    );

    const sunPosInfo = sunPos(jdayNow);
    const sunPosNow = sunPosInfo.rsun;
    const sunDirection = new THREE.Vector3(sunPosNow[0], sunPosNow[2], -sunPosNow[1]);
    sunDirection.multiplyScalar(AU);
    sunLight.position.copy(sunDirection);
    sunLight.target.position.set(0, 0, 0);
    sunLight.target.updateMatrixWorld();

    // Compute Greewich Mean Sideral Time
    const gmst = gstime(now);

    // Update Earth rotation accordingly
    earthGrob.rotation.y = gmst;

    // Compute Satellite Earth Centered Inertial coordinates
    const positionAndVelocityECI = propagate(satRecWorldview3, now);
    const positionECI = positionAndVelocityECI.position;

    // Compute Satellite Geodetic coordinates
    const positionGeodeticSatellite = eciToGeodetic(positionECI, gmst);
    const satelliteGd = {
        latitude: degreesLat(positionGeodeticSatellite.latitude),
        longitude: degreesLong(positionGeodeticSatellite.longitude),
        height: positionGeodeticSatellite.height
    }

    // Convert Geodetic Lat Long Height into THREE.Vector3 and use it as satellite graphic object coords
    const newPos = latLonToVector3(
        satelliteGd.latitude,
        satelliteGd.longitude,
        satelliteGd.height + earthRadius);
    satelliteGrobThreeJS.position.copy(newPos);


    divInfo1.innerHTML = `
    <div>DATE: <strong>${now.toLocaleString()}</strong></div>
    <div>NAME: <strong>${ommWorldview3.OBJECT_NAME}</strong></div>
    <div>ID: <strong>${ommWorldview3.OBJECT_ID}</strong></div>
    <div>NORAD: <strong>${ommWorldview3.NORAD_CAT_ID}</strong></div>
    `;

    divInfo2.innerHTML = `
    <div>ECI (Earth Centered Inertial):</div>
    <div>X: <strong>${positionECI.x.toFixed(3)}</strong> km</div>
    <div>Y: <strong>${positionECI.y.toFixed(3)}</strong> km</div>
    <div>Z: <strong>${positionECI.z.toFixed(3)}</strong> km</div>
    `;

    divInfo3.innerHTML = `
    <div>Earth cordinates</div>
    <div>lat: <strong>${satelliteGd.latitude.toFixed(3)}</strong>°</div>
    <div>long: <strong>${satelliteGd.longitude.toFixed(3)}</strong>°</div>
    <div>alt: <strong>${satelliteGd.height.toFixed(3)}</strong> km</div>
    `;


    world.controls.update();
    world.wegGLRenderer.render(world.scene, world.camera);
    world.labelRenderer.render(world.scene, world.camera);
}

animate();

// --- 7. REDIMENSIONNEMENT FENÊTRE ---
window.addEventListener('resize', () => {
    world.camera.aspect = window.innerWidth / window.innerHeight;
    world.camera.updateProjectionMatrix();
    world.wegGLRenderer.setSize(window.innerWidth, window.innerHeight);
    world.labelRenderer.setSize(window.innerWidth, window.innerHeight);
});




// R : Rayon de votre Terre 3D + Altitude du satellite
// lat : Latitude en degrés (-90 à 90)
// lon : Longitude en degrés (-180 à 180)
// Inversion d'axe : satellite.js (Z = Nord) -> Three.js (Y = Nord)
function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.sin(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);

    return new THREE.Vector3(x, y, z);
}

