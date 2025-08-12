import * as THREE from 'three';
import { ChaseCamera } from './camera/ChaseCamera';
import { Engine } from './core/Engine';
import { Input } from './core/Input';
import { Car } from './entities/Car';
import { GameOptions } from './index';
import { createMaterials, disposeMaterials, GameMaterials } from './materials/Materials';
import { CarPhysics, PhysicsParams } from './physics/CarPhysics';
import { DriftController } from './physics/DriftController';
import { createNASCARTrack, createOvalTrack } from './track/OvalTrack';
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
    this.materials = createMaterials(this.options);

    // Setup NASCAR-style lighting
    this.setupNASCARLighting();

    // Setup sky and environment
    this.setupSkyEnvironment();

    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(800, 800);
    const groundMesh = new THREE.Mesh(groundGeometry, this.materials.grass);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    this.engine.scene.add(groundMesh);
  }

  private setupNASCARLighting(): void {
    // Daytime hemisphere light (sky blue top, grass green bottom)
    const hemisphereLight = new THREE.HemisphereLight(0xbfd9ff, 0x9ecb8d, 0.5);
    this.engine.scene.add(hemisphereLight);

    // Main sun (directional light)
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(200, 300, 150);
    sunLight.castShadow = true;

    // Configure shadow camera to cover the entire track area
    const shadowSize = 150;
    sunLight.shadow.mapSize.width = this.options.shadowQuality;
    sunLight.shadow.mapSize.height = this.options.shadowQuality;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 600;
    sunLight.shadow.camera.left = -shadowSize;
    sunLight.shadow.camera.right = shadowSize;
    sunLight.shadow.camera.top = shadowSize;
    sunLight.shadow.camera.bottom = -shadowSize;
    sunLight.shadow.bias = -0.0001;

    this.engine.scene.add(sunLight);
  }

  private setupSkyEnvironment(): void {
    // Create day sky gradient
    const skyGeometry = new THREE.SphereGeometry(500, 16, 8);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x87ceeb) },
        bottomColor: { value: new THREE.Color(0xe0f6ff) },
        offset: { value: 50 },
        exponent: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
    });

    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.engine.scene.add(sky);

    // Add clouds if enabled
    if (this.options.enableClouds) {
      this.addClouds();
    }
  }

  private addClouds(): void {
    const cloudGroup = new THREE.Group();
    const cloudCount = 15;

    for (let i = 0; i < cloudCount; i++) {
      const cloudGeometry = new THREE.PlaneGeometry(
        100 + Math.random() * 100,
        60 + Math.random() * 40
      );
      const cloudMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6 + Math.random() * 0.2,
        side: THREE.DoubleSide,
      });

      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);

      // Position clouds around the track
      const angle = (i / cloudCount) * Math.PI * 2;
      const distance = 200 + Math.random() * 150;
      cloud.position.set(
        Math.cos(angle) * distance,
        120 + Math.random() * 60,
        Math.sin(angle) * distance
      );

      // Random rotation
      cloud.rotation.z = Math.random() * Math.PI * 2;

      cloudGroup.add(cloud);
    }

    this.engine.scene.add(cloudGroup);

    // Slow cloud drift animation
    const animateClouds = () => {
      cloudGroup.rotation.y += 0.0002;
      requestAnimationFrame(animateClouds);
    };
    animateClouds();
  }

  private setupTrack(): void {
    let trackMeshes;
    try {
      // Preferred: NASCAR-style oval with banking and visuals
      trackMeshes = createNASCARTrack(this.options, this.materials);
    } catch (err) {
      console.error('Failed to create NASCAR track, falling back to simple oval:', err);
      // Fallback: simple ellipse ribbon so the game still mounts
      trackMeshes = createOvalTrack(
        this.options.majorRadius,
        this.options.minorRadius,
        this.options.trackWidth,
        this.options.samples,
        this.options.enableWalls
      );
    }

    // Add track meshes to scene
    trackMeshes.trackMesh.receiveShadow = true;
    this.engine.scene.add(trackMeshes.trackMesh);
    this.engine.scene.add(trackMeshes.startLineMesh);

    if (trackMeshes.wallsGroup) {
      trackMeshes.wallsGroup.children.forEach((wall) => {
        (wall as THREE.Mesh).castShadow = true;
        (wall as THREE.Mesh).receiveShadow = true;
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

    // Hard boundary: if off-track, snap car back inside the edge and kill outward lateral velocity
    if (offTrack) {
      const s = this.centerlineSamples[nearestPoint.sampleIndex];
      this.carPhysics.constrainToTrack(
        s.position.x,
        s.position.z,
        s.normal.x,
        s.normal.z,
        this.options.trackWidth
      );
    }

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
