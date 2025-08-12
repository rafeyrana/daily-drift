import * as THREE from 'three';
export class Car {
    object3d;
    body;
    wheels = [];
    frontWheels = [];
    // Car dimensions
    carLength = 4.0;
    carWidth = 1.8;
    carHeight = 1.2;
    wheelRadius = 0.3;
    wheelWidth = 0.2;
    wheelBase = 2.6;
    constructor(materials) {
        this.object3d = new THREE.Group();
        this.createCarBody(materials);
        this.createWheels(materials);
    }
    createCarBody(materials) {
        // Main body
        const bodyGeometry = new THREE.BoxGeometry(this.carLength, this.carHeight, this.carWidth);
        this.body = new THREE.Mesh(bodyGeometry, materials.carBody);
        this.body.position.y = this.carHeight / 2;
        this.body.castShadow = true;
        this.body.receiveShadow = true;
        this.object3d.add(this.body);
        // Windshield (slightly transparent)
        const windshieldGeometry = new THREE.BoxGeometry(this.carLength * 0.6, this.carHeight * 0.4, this.carWidth * 0.8);
        const windshieldMaterial = new THREE.MeshPhongMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.3,
            shininess: 100,
        });
        const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
        windshield.position.y = this.carHeight * 0.8;
        windshield.position.x = -0.2; // Slightly towards rear
        this.object3d.add(windshield);
    }
    createWheels(materials) {
        const wheelGeometry = new THREE.CylinderGeometry(this.wheelRadius, this.wheelRadius, this.wheelWidth, 12);
        // Wheel positions relative to car center
        const wheelPositions = [
            { x: this.wheelBase / 2, z: -this.carWidth / 2 - this.wheelWidth / 2, front: true }, // Front left
            { x: this.wheelBase / 2, z: this.carWidth / 2 + this.wheelWidth / 2, front: true }, // Front right
            { x: -this.wheelBase / 2, z: -this.carWidth / 2 - this.wheelWidth / 2, front: false }, // Rear left
            { x: -this.wheelBase / 2, z: this.carWidth / 2 + this.wheelWidth / 2, front: false }, // Rear right
        ];
        wheelPositions.forEach((pos, index) => {
            const wheel = new THREE.Mesh(wheelGeometry, materials.carWheel);
            wheel.position.set(pos.x, this.wheelRadius, pos.z);
            wheel.rotation.z = Math.PI / 2; // Rotate to be vertical
            wheel.castShadow = true;
            this.wheels.push(wheel);
            if (pos.front) {
                this.frontWheels.push(wheel);
            }
            this.object3d.add(wheel);
        });
    }
    setPose(position, heading, roll = 0) {
        this.object3d.position.set(position.x, 0, position.z);
        this.object3d.rotation.y = heading;
        this.object3d.rotation.z = roll;
    }
    updateWheelVisuals(steerAngle, speed, dt) {
        // Update front wheel steering
        this.frontWheels.forEach((wheel) => {
            wheel.rotation.y = steerAngle;
        });
        // Update wheel spin based on speed
        const wheelRotation = speed / this.wheelRadius; // rad/s
        this.wheels.forEach((wheel) => {
            wheel.rotation.x += wheelRotation * dt;
        });
    }
    getPosition() {
        return this.object3d.position.clone();
    }
    getHeading() {
        return this.object3d.rotation.y;
    }
    // Get center of mass position (slightly forward of geometric center)
    getCenterOfMass() {
        const comOffset = new THREE.Vector3(0.2, 0, 0); // 20cm forward
        const worldCom = comOffset.clone();
        worldCom.applyMatrix4(this.object3d.matrixWorld);
        return worldCom;
    }
}
//# sourceMappingURL=Car.js.map