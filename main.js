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
    degreesLong
} from 'https://esm.sh/satellite.js@6.0.2';

import { ommWorldview3 } from './sats-info.js';
import { createLabel } from './label2d.js';
import { SunLight } from './sunlight.js';
import { World } from './world.js';
import { Earth } from './earth.js';
import { Satellite } from './satellite.js';

const world = new World();

document.getElementById("toggleECI")
    .addEventListener("click", () => world.toggleECIAxes());

const sunLight = new SunLight()
world.scene.add(sunLight.directionalLight);

const earth = new Earth();
world.scene.add(earth.mesh);

document.getElementById("toggleEquator")
    .addEventListener("click", () => earth.toggleEquator());

document.getElementById("toggleGrid")
    .addEventListener("click", () => earth.toggleGrid());

document.getElementById("toggleGraticule")
    .addEventListener("click", () => earth.toggleMeridiansParallels());


document.getElementById("toggleECF")
    .addEventListener("click", () => earth.toggleECFAxes());


const satellite = new Satellite();
world.scene.add(satellite.mesh);



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


function animate() {
    requestAnimationFrame(animate);

    const now = new Date();

    sunLight.updateSpatialPosition(now);

    // Compute Greewich Mean Sideral Time
    const gmst = gstime(now);

    // Update Earth rotation accordingly
    earth.mesh.rotation.y = gmst;

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
        satelliteGd.height + earth.radius);
    satellite.mesh.position.copy(newPos);


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
    <div>Satellite</div>
    <div>lat: <strong>${satelliteGd.latitude.toFixed(3)}</strong>°</div>
    <div>long: <strong>${satelliteGd.longitude.toFixed(3)}</strong>°</div>
    <div>alt: <strong>${satelliteGd.height.toFixed(3)}</strong> km</div>
    `;


    world.orbitControls.update();
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

