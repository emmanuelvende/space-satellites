import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
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

// --- SCENE ---
const scene = new THREE.Scene();

// --- CAMERA ---
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

// --- RENDERER WEBGL ---
const wegGLRenderer = new THREE.WebGLRenderer({ antialias: true });
wegGLRenderer.setSize(window.innerWidth, window.innerHeight);
wegGLRenderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(wegGLRenderer.domElement);

// --- ORBIT CONTROLS ---
const controls = new OrbitControls(camera, wegGLRenderer.domElement);
controls.enableDamping = true;

// --- RENDERER TEXTE HTML SUPERPOSE ---
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none'; // Pour que la souris passe à travers et contrôle la 3D
document.body.appendChild(labelRenderer.domElement);

// =====================
// --- AMBIENT LIGHT ---
// =====================
const ambientLight = new THREE.AmbientLight(0x808080, 0.3);
scene.add(ambientLight);

// =====================
// ---   SUN LIGHT   ---
// =====================
const sunLight = new THREE.DirectionalLight(0xffffff, 5.0);
// sunLight.position.set(-10000, 0, 0);
sunLight.target.position.set(0, 0, 0);
scene.add(sunLight);

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

const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// ==========================================
// --- REPÈRE ECI (Axes X, Y, Z) ---
// ==========================================
const axesHelper = new THREE.AxesHelper(50000);
scene.add(axesHelper);

const labelN = createLabel('ECI NORD (Y)', '#00ff00');
labelN.position.set(0, 12500, 0); // Placé juste au bout de l'axe vert
scene.add(labelN);

// Étiquette pour l'axe Vernal (X)
const labelX = createLabel('ECI X (0°)', '#ff0000');
labelX.position.set(12500, 0, 0);
scene.add(labelX);

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

scene.add(equator);



// ==========================================
// --- REPERE ECF (Tourne avec la Terre) ---
// ==========================================
// On crée un deuxième AxesHelper. Pour le différencier du ECI, 
// on le fait un peu plus court (9000 km)
const axesHelperECF = new THREE.AxesHelper(9000);

// TRÈS IMPORTANT : On l'ajoute à "earth", pas à "scene" !
earth.add(axesHelperECF);



// ==========================================
// --- GRILLE DES MÉRIDIENS ET PARALLÈLES ---
// ==========================================
const gridGeometry = new THREE.SphereGeometry(earthRadius + 50, 36, 36);
const edges = new THREE.EdgesGeometry(gridGeometry);
const gridMaterial = new THREE.LineBasicMaterial({
    color: 0x00ffaa,
    transparent: true,
    opacity: 0.4
});

const earthGrid = new THREE.LineSegments(edges, gridMaterial);

// On l'ajoute aussi à "earth" pour qu'il tourne avec !
earth.add(earthGrid);

// Méridien de Greenwich (0° Longitude, posé sur l'Équateur)
const labelGreenwich = createLabel('0° (Greenwich)', '#00ffaa');
labelGreenwich.position.set(earthRadius + 250, 0, 0); // Axe X de la Terre
earth.add(labelGreenwich);

// Longitude 90° Est
const label90E = createLabel('90° E', '#00ffaa');
label90E.position.set(0, 0, -(earthRadius + 250));
earth.add(label90E);

// Parallèle 45° Nord (par exemple)
const label45N = createLabel('45° N', '#ffff00');
// On calcule la position en hauteur pour 45°
const h45 = earthRadius * Math.sin(Math.PI / 4);
const r45 = earthRadius * Math.cos(Math.PI / 4);
label45N.position.set(r45 + 250, h45, 0);
earth.add(label45N);



// --- LE SATELLITE ---
const satSize = 500; // 500 km de côté :)
const satGeometry = new THREE.BoxGeometry(satSize, satSize, satSize);
const satMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
const satelliteGrobThreeJS = new THREE.Mesh(satGeometry, satMaterial);

scene.add(satelliteGrobThreeJS);

camera.position.set(15000, 10000, 15000);
camera.near = 10;
camera.far = 400000;
camera.updateProjectionMatrix(); // appliquer chgt de clipping
controls.target.set(0, 0, 0);
controls.update();





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
    earth.rotation.y = gmst;

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


    controls.update();
    wegGLRenderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

animate();

// --- 7. REDIMENSIONNEMENT FENÊTRE ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    wegGLRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
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


// Création étiquette tectuelle
function createLabel(text, color = '#ffffff') {
    const div = document.createElement('div');
    div.className = 'spatial-label';
    div.textContent = text;
    div.style.color = color;
    div.style.fontFamily = 'monospace';
    div.style.fontSize = '12px';
    div.style.padding = '2px 4px';
    div.style.background = 'rgba(0, 0, 0, 0.6)';
    div.style.borderRadius = '3px';
    div.style.border = `1px solid ${color}`;

    const label = new CSS2DObject(div);
    return label;
}