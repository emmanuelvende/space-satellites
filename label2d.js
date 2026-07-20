import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export function createLabel(text, color = '#ffffff') {
    const div = document.createElement('div');
    div.className = 'spatial-label';
    div.textContent = text;
    div.style.color = color;
    div.style.fontFamily = 'monospace';
    div.style.fontSize = '12px';
    div.style.padding = '2px 4px';
    div.style.background = 'rgba(0, 0, 0, 0.6)';
    div.style.borderRadius = '3px';
    div.style.border = `1px solid ${color}`;

    const label = new CSS2DObject(div);
    return label;
}
