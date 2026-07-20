import * as THREE from 'three';


export function createSunLight(scene) {
    const sunLight = new THREE.DirectionalLight(0xffffff, 5.0);
    sunLight.target.position.set(0, 0, 0);
    return sunLight;
}
