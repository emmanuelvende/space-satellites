import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

export class World {

    constructor() {
        this.setupScene();
        this.setupCamera();
        this.setUpWebGLRenderer();
        this.setupOrbitControls();
        this.setupLabelRenderer();
        this.setupAmbientLight();
    }

    setupScene() {
        this.scene = new THREE.Scene();
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000);
    }

    setUpWebGLRenderer() {
        this.wegGLRenderer = new THREE.WebGLRenderer({ antialias: true });
        this.wegGLRenderer.setSize(window.innerWidth, window.innerHeight);
        this.wegGLRenderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.wegGLRenderer.domElement);
    }

    setupOrbitControls() {
        this.controls = new OrbitControls(this.camera, this.wegGLRenderer.domElement);
        this.controls.enableDamping = true;
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
}
