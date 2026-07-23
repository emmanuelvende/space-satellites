import * as THREE from 'three';
import {
    sunPos,
    jday
} from 'https://esm.sh/satellite.js@6.0.2';

const AU = 149600000;

export class SunLight {
    constructor() {
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 5.0);
        this.directionalLight.target.position.set(0, 0, 0);
    }

    setPosition(positionVector3) {
        this.directionalLight.position.copy(positionVector3);
        this.directionalLight.target.position.set(0, 0, 0);
        this.directionalLight.target.updateMatrixWorld();
    }

    updateSpatialPosition(nowDate) {
        const julianDayNow = jday(nowDate.getUTCFullYear(),
            nowDate.getUTCMonth() + 1,
            nowDate.getUTCDate(),
            nowDate.getUTCHours(),
            nowDate.getUTCMinutes(),
            nowDate.getUTCSeconds()
        );
        const sunPositionInfoECI = sunPos(julianDayNow);
        const sunPositionV3ECI = sunPositionInfoECI.rsun;
        const sunPositionV3WorldAU = new THREE.Vector3(sunPositionV3ECI[0], sunPositionV3ECI[2], -sunPositionV3ECI[1]);
        const sunPositionV3World = sunPositionV3WorldAU.multiplyScalar(AU);
        this.setPosition(sunPositionV3World);
    }
}