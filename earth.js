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
        this.createGrid();

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
            color: 0x00ffaa,
            transparent: true,
            opacity: 0.4
        });

        this.gridMesh = new THREE.LineSegments(edges, gridMaterial);

        this.mesh.add(this.gridMesh);

        /*
        // Méridien de Greenwich (0° Longitude, posé sur l'Équateur)
        const labelGreenwich = createLabel('0° (Greenwich)', '#00ffaa');
        labelGreenwich.position.set(earthRadius + 250, 0, 0); // Axe X de la Terre
        earthGrob.add(labelGreenwich);

        // Longitude 90° Est
        const label90E = createLabel('90° E', '#00ffaa');
        label90E.position.set(0, 0, -(earthRadius + 250));
        earthGrob.add(label90E);

        // Parallèle 45° Nord (par exemple)
        const label45N = createLabel('45° N', '#ffff00');
        // On calcule la position en hauteur pour 45°
        const h45 = earthRadius * Math.sin(Math.PI / 4);
        const r45 = earthRadius * Math.cos(Math.PI / 4);
        label45N.position.set(r45 + 250, h45, 0);
        earthGrob.add(label45N);
        */
    }

    toggleGrid() {
        this.gridMesh.visible = !this.gridMesh.visible;
    }
}
