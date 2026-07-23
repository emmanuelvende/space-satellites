import * as THREE from 'three';

export class Satellite {

    constructor() {
        const satSize = 500;
        this.geometry = new THREE.BoxGeometry(satSize, satSize, satSize);
        this.material = new THREE.MeshPhongMaterial({ color: 0xffffff });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
    }
}