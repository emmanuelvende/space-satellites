import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { createLabel } from './label2d.js';

export class World {

    constructor() {
        this.setupScene();
        this.setUpWebGLRenderer();
        this.setupLabelRenderer();

        this.setupCamera();
        this.setupOrbitControls();

        this.setupAmbientLight();
        this.setupECIAxes();

    }

    setupScene() {
        this.scene = new THREE.Scene();
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            10,
            400000);
        this.camera.position.set(15000, 10000, 15000);
        this.camera.updateProjectionMatrix();
    }

    setUpWebGLRenderer() {
        this.wegGLRenderer = new THREE.WebGLRenderer({ antialias: true });
        this.wegGLRenderer.setSize(window.innerWidth, window.innerHeight);
        this.wegGLRenderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.wegGLRenderer.domElement);
    }

    setupOrbitControls() {
        this.orbitControls = new OrbitControls(this.camera, this.wegGLRenderer.domElement);
        this.orbitControls.enableDamping = true;

        this.orbitControls.target.set(0, 0, 0);
        this.orbitControls.update();
    }

    setupLabelRenderer() {
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        this.labelRenderer.domElement.style.pointerEvents = 'none';
        document.body.appendChild(this.labelRenderer.domElement);
    }

    setupAmbientLight() {
        const ambientLight = new THREE.AmbientLight(0x808080, 0.3);
        this.scene.add(ambientLight);
    }

    setupECIAxes() {
        this.ECIAxes = new THREE.AxesHelper(50000);
        this.scene.add(this.ECIAxes);

        this.ECILabelN = createLabel('ECI North (Y)', '#00ff00');
        this.ECILabelN.position.set(0, 12500, 0);
        this.ECIAxes.add(this.ECILabelN);

        this.ECILabelX = createLabel('ECI 0° (X)', '#ff0000');
        this.ECILabelX.position.set(12500, 0, 0);
        this.ECIAxes.add(this.ECILabelX);
    }

    toggleECIAxes() {
        this.ECIAxes.visible = !this.ECIAxes.visible;
        this.ECILabelN.visible = !this.ECILabelN.visible;
        this.ECILabelX.visible = !this.ECILabelX.visible;
    }
}
