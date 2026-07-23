import * as THREE from 'three';
import {
    json2satrec,
    propagate,
    gstime,
    eciToGeodetic,
    degreesLat,
    degreesLong
} from 'https://esm.sh/satellite.js@6.0.2';

export class Satellite {

    constructor(omm, earthRadius) {
        const satSize = 500;
        this.geometry = new THREE.BoxGeometry(satSize, satSize, satSize);
        this.material = new THREE.MeshPhongMaterial({ color: 0xffffff });
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.geodeticPosition = {
            latitude: 0.0,
            longitude: 0.0,
            height: 0.0
        }

        this.satRec = json2satrec(omm);
    }

    updateSpatialPosition(nowDate, earthRadius) {
        // Compute Satellite Earth Centered Inertial coordinates
        const positionAndVelocityECI = propagate(this.satRec, nowDate);
        const positionECI = positionAndVelocityECI.position;

        const gmst = gstime(nowDate);

        // Compute Satellite Geodetic coordinates
        const positionGeodeticSatellite = eciToGeodetic(positionECI, gmst);
        this.geodeticPosition = {
            latitude: degreesLat(positionGeodeticSatellite.latitude),
            longitude: degreesLong(positionGeodeticSatellite.longitude),
            height: positionGeodeticSatellite.height
        }

        // Convert Geodetic Lat Long Height into THREE.Vector3 and use it as satellite graphic object coords
        const spatialPosition = latLonToVector3(
            positionGeodeticSatellite.latitude,
            positionGeodeticSatellite.longitude,
            positionGeodeticSatellite.height + earthRadius);

        this.mesh.position.copy(spatialPosition);
    }
}


// R : Rayon de votre Terre 3D + Altitude du satellite
// lat : Latitude en degrés (-90 à 90)
// lon : Longitude en degrés (-180 à 180)
// Inversion d'axe : satellite.js (Z = Nord) -> Three.js (Y = Nord)
function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.sin(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);

    return new THREE.Vector3(x, y, z);
}
