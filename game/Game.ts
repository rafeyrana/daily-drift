import * as THREE from 'three';
import { ChaseCamera } from './camera/ChaseCamera';
import { Engine } from './core/Engine';
import { Input } from './core/Input';
import { Car } from './entities/Car';
import { GameOptions } from './index';
import { createMaterials, disposeMaterials, GameMaterials } from './materials/Materials';
import { CarPhysics, PhysicsParams } from './physics/CarPhysics';
import { DriftController } from './physics/DriftController';
import { createOvalTrack } from './track/OvalTrack';
import { CenterlineSample, findNearestOnCenterline, isOffTrack } from './track/TrackUtil';
import { HUD } from './ui/HUD';
import { radToDeg } from './util/MathUtil';

export class Game {
  private engine: Engine;
  private input: Input;
  private materials: GameMaterials;
  private car: Car;
  private carPhysics: CarPhysics;
  private driftController: DriftController;
  private chaseCamera: ChaseCamera;
  private hud: HUD;
  private centerlineSamples: CenterlineSample[] = [];

  constructor(
    private container: HTMLElement,
    private options: GameOptions
  ) {
    this.setupEngine();
    this.setupInput();
    this.setupScene();
    this.setupTrack();
    this.setupCar();
    this.setupCamera();
    this.setupHUD();

    this.setupEngineHooks();
  }

  private setupEngine(): void {
    this.engine = new Engine(this.container);
  }

  private setupInput(): void {
    this.input = new Input();
  }

  private setupScene(): void {
    // Create materials
    this.materials = createMaterials();

    // Add lights
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x4a7c59, 0.6);
    this.engine.scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 25);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    this.engine.scene.add(directionalLight);

    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(400, 400);
    const groundMesh = new THREE.Mesh(groundGeometry, this.materials.grass);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    this.engine.scene.add(groundMesh);
  }

  private setupTrack(): void {
    const trackMeshes = createOvalTrack(
      this.options.majorRadius,
      this.options.minorRadius,
      this.options.trackWidth,
      this.options.samples,
      this.options.enableWalls
    );

    // Add track meshes to scene
    trackMeshes.trackMesh.receiveShadow = true;
    this.engine.scene.add(trackMeshes.trackMesh);
    this.engine.scene.add(trackMeshes.startLineMesh);

    if (trackMeshes.wallsGroup) {
      trackMeshes.wallsGroup.children.forEach((wall) => {
        wall.castShadow = true;
        wall.receiveShadow = true;
      });
      this.engine.scene.add(trackMeshes.wallsGroup);
    }

    this.centerlineSamples = trackMeshes.centerlineSamples;
  }

  private setupCar(): void {
    // Create car entity
    this.car = new Car(this.materials);
    this.engine.scene.add(this.car.object3d);

    // Create physics
    const physicsParams: PhysicsParams = {
      wheelBase: this.options.wheelBase,
      mass: this.options.mass,
      cgToFront: this.options.cgToFront,
      cgToRear: this.options.cgToRear,
      maxSteer: this.options.maxSteer,
      engineForce: this.options.engineForce,
      brakeForce: this.options.brakeForce,
      dragCoeff: this.options.dragCoeff,
      frontalArea: this.options.frontalArea,
      airDensity: this.options.airDensity,
      rollingResistance: this.options.rollingResistance,
      baseFrontGrip: this.options.baseFrontGrip,
      baseRearGrip: this.options.baseRearGrip,
      yawInertia: this.options.yawInertia,
      lateralDamping: this.options.lateralDamping,
    };

    this.carPhysics = new CarPhysics(physicsParams);
    this.driftController = new DriftController();

    // Position car at start line
    if (this.centerlineSamples.length > 0) {
      const startSample = this.centerlineSamples[0];
      const startHeading = Math.atan2(startSample.tangent.z, startSample.tangent.x);

      this.carPhysics.setPose(startSample.position.x, startSample.position.z, startHeading);

      this.car.setPose({ x: startSample.position.x, z: startSample.position.z }, startHeading);
    }
  }

  private setupCamera(): void {
    this.chaseCamera = new ChaseCamera(
      this.engine.camera,
      this.options.cameraDistance,
      this.options.cameraHeight
    );

    // Initialize camera position
    if (this.centerlineSamples.length > 0) {
      const startSample = this.centerlineSamples[0];
      const startHeading = Math.atan2(startSample.tangent.z, startSample.tangent.x);
      this.chaseCamera.reset(startSample.position, startHeading);
    }
  }

  private setupHUD(): void {
    this.hud = new HUD(this.container);
  }

  private setupEngineHooks(): void {
    this.engine.setHooks({
      onFixedUpdate: this.onFixedUpdate.bind(this),
      onRender: this.onRender.bind(this),
      onResize: this.onResize.bind(this),
    });
  }

  private onFixedUpdate(deltaTime: number): void {
    // Get input
    const kinematics = this.carPhysics.getKinematics();
    const inputData = this.input.update(deltaTime, kinematics.speed);

    // Update drift controller
    const driftEffects = this.driftController.update(
      deltaTime,
      inputData.state,
      inputData.events,
      kinematics.speed,
      kinematics.driftAngle
    );

    // Step car physics
    this.carPhysics.step(deltaTime, inputData.state, driftEffects);

    // Update car visual pose
    const updatedKinematics = this.carPhysics.getKinematics();
    this.car.setPose(updatedKinematics.position, updatedKinematics.heading);

    // Update wheel visuals
    const steerAngle = this.carPhysics.getSteerAngle(inputData.state.steer);
    this.car.updateWheelVisuals(steerAngle, updatedKinematics.speed, deltaTime);
  }

  private onRender(interpAlpha: number): void {
    const kinematics = this.carPhysics.getKinematics();
    const carPosition = new THREE.Vector3(kinematics.position.x, 0, kinematics.position.z);
    const inputData = this.input.getInputs();

    // Update camera with an approximate render dt derived from engine timeStep (fallback 1/60)
    const renderDt = 1 / 60; // TODO: wire actual render delta if available from engine
    this.chaseCamera.update(renderDt, {
      position: carPosition,
      heading: kinematics.heading,
      speed: kinematics.speed,
      steerInput: inputData.state.steer,
      driftAngle: kinematics.driftAngle,
    });

    // Update HUD
    const driftStatus = this.driftController.getStatus(kinematics.driftAngle);

    // Check if off-track
    const nearestPoint = findNearestOnCenterline(carPosition, this.centerlineSamples);
    const offTrack = isOffTrack(nearestPoint.lateralDistance, this.options.trackWidth);

    this.hud.update({
      speedKmh: kinematics.speed * 3.6, // Convert m/s to km/h
      driftDeg: radToDeg(Math.abs(kinematics.driftAngle)),
      isDrifting: driftStatus.isDrifting,
      offTrack,
    });
  }

  private onResize(width: number, height: number): void {
    // Camera aspect ratio is handled by the engine
    // HUD is responsive by default
  }

  start(): void {
    this.input.attach(this.container);
    this.engine.start();
  }

  stop(): void {
    this.engine.stop();
    this.input.detach(this.container);
    this.hud.dispose();
    disposeMaterials(this.materials);
    this.engine.dispose();
  }
}
