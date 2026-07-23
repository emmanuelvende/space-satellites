import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import {
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


const satellite = new Satellite(ommWorldview3);
world.scene.add(satellite.mesh);


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

    satellite.updateSpatialPosition(now, earth.radius);


    divInfo1.innerHTML = `
    <div>DATE: <strong>${now.toLocaleString()}</strong></div>
    <div>NAME: <strong>${ommWorldview3.OBJECT_NAME}</strong></div>
    <div>ID: <strong>${ommWorldview3.OBJECT_ID}</strong></div>
    <div>NORAD: <strong>${ommWorldview3.NORAD_CAT_ID}</strong></div>
    `;


    divInfo2.innerHTML = `
    <div>Satellite</div>
    <div>lat: <strong>${satellite.geodeticPosition.latitude.toFixed(3)}</strong>°</div>
    <div>long: <strong>${satellite.geodeticPosition.longitude.toFixed(3)}</strong>°</div>
    <div>alt: <strong>${satellite.geodeticPosition.height.toFixed(3)}</strong> km</div>
    `;

    world.updateControlsAndRender();

}

animate();
