import * as THREE from 'three';
import { createLabel } from './utils.js';

export function setupEarthGrid(earth, earthRadius) {
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
}