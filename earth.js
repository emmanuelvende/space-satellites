import * as THREE from 'three';

export class Earth {
    constructor() {
        this.radius = 6371;
        const earthGeometry = new THREE.SphereGeometry(this.radius, 64, 32);
        const textureLoader = new THREE.TextureLoader();
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

        this.mesh = new THREE.Mesh(earthGeometry, earthMaterial);

        this.createEquator();

    }

    createEquator() {
        const equatorGeometry = new THREE.TorusGeometry(this.radius + 20, 30, 16, 100);
        const equatorMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        this.equator = new THREE.Mesh(equatorGeometry, equatorMaterial);
        this.equator.rotation.x = Math.PI / 2;
        this.mesh.add(this.equator);
    }

    toggleEquator() {
        this.equator.visible = !this.equator.visible;
    }
}
