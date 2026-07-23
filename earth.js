import * as THREE from 'three';
import { createLabel } from './label2d.js';

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
        this.createGrid();
        this.createMeridiansParallels();
        this.setupECFAxes();
    }

    createEquator() {
        const equatorGeometry = new THREE.TorusGeometry(this.radius + 20, 30, 16, 100);
        const equatorMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        this.equatorMesh = new THREE.Mesh(equatorGeometry, equatorMaterial);
        this.equatorMesh.rotation.x = Math.PI / 2;
        this.mesh.add(this.equatorMesh);
    }

    toggleEquator() {
        this.equatorMesh.visible = !this.equatorMesh.visible;
    }

    createGrid() {
        const gridGeometry = new THREE.SphereGeometry(this.radius + 50, 36, 36);
        const edges = new THREE.EdgesGeometry(gridGeometry);
        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0x00ffc0,
            transparent: true,
            opacity: 0.4
        });

        this.gridMesh = new THREE.LineSegments(edges, gridMaterial);
        this.mesh.add(this.gridMesh);
    }
    toggleGrid() {
        this.gridMesh.visible = !this.gridMesh.visible;
    }

    createMeridiansParallels() {
        const greenwichGeometry = new THREE.TorusGeometry(this.radius + 20, 30, 16, 100);
        const meridiansParallelsMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffc0,
            transparent: true,
            opacity: 0.8
        });
        this.greenwichMesh = new THREE.Mesh(greenwichGeometry, meridiansParallelsMaterial);
        this.mesh.add(this.greenwichMesh);
        this.labelGreenwich = createLabel('0° (Greenwich)', '#00ffc0');
        this.labelGreenwich.position.set(this.radius + 250, 0, 0);
        this.mesh.add(this.labelGreenwich);

        // Longitude 90° E
        const meridian90EGeometry = new THREE.TorusGeometry(this.radius + 20, 30, 16, 100);
        this.meridian90EMesh = new THREE.Mesh(meridian90EGeometry, meridiansParallelsMaterial);
        this.meridian90EMesh.rotation.x = Math.PI / 2;
        this.meridian90EMesh.rotation.y = Math.PI / 2;
        this.mesh.add(this.meridian90EMesh);
        this.label90E = createLabel('90° E', '#00ffaa');
        this.label90E.position.set(0, 0, -(this.radius + 250));
        this.mesh.add(this.label90E);

        // Latitude 45° N
        const parallel45NGeometry = new THREE.TorusGeometry(this.radius * Math.sin(Math.PI / 4) + 20, 30, 16, 100);
        this.parallel45NMesh = new THREE.Mesh(parallel45NGeometry, meridiansParallelsMaterial);
        this.parallel45NMesh.rotation.x = Math.PI / 2;
        this.parallel45NMesh.position.y = this.radius * Math.sin(Math.PI / 4);
        this.mesh.add(this.parallel45NMesh);

        this.label45N = createLabel('45° N', '#00ffaa');
        const h45 = this.radius * Math.sin(Math.PI / 4);
        const r45 = this.radius * Math.cos(Math.PI / 4);
        this.label45N.position.set(r45 + 250, h45, 0);
        this.mesh.add(this.label45N);

    }

    toggleMeridiansParallels() {
        this.labelGreenwich.visible = !this.labelGreenwich.visible;
        this.greenwichMesh.visible = !this.greenwichMesh.visible;

        this.label90E.visible = !this.label90E.visible;
        this.meridian90EMesh.visible = !this.meridian90EMesh.visible;

        this.label45N.visible = !this.label45N.visible;
        this.parallel45NMesh.visible = !this.parallel45NMesh.visible;
    }

    setupECFAxes() {
        this.ECFAxes = new THREE.AxesHelper(this.radius + 3000);
        this.mesh.add(this.ECFAxes);
    }

    toggleECFAxes() {
        this.ECFAxes.visible = !this.ECFAxes.visible;
    }
}
