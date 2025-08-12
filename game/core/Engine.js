import * as THREE from 'three';
import { FixedTimeStep } from './Time';
import { disposeRenderer, disposeScene } from './Dispose';
export class Engine {
    renderer;
    scene;
    camera;
    container;
    timeStep;
    animationId = null;
    hooks = {};
    resizeObserver = null;
    constructor(container) {
        this.container = container;
        this.timeStep = new FixedTimeStep(1 / 120, 5);
        // Create renderer with NASCAR-optimized settings
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x87CEEB, 1); // Sky blue
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 300);
        // Create camera
        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
        // Setup container
        this.setupContainer();
        // Setup resize observer
        this.setupResize();
    }
    setupContainer() {
        const rect = this.container.getBoundingClientRect();
        this.renderer.setSize(rect.width, rect.height);
        this.camera.aspect = rect.width / rect.height;
        this.camera.updateProjectionMatrix();
        this.container.appendChild(this.renderer.domElement);
    }
    setupResize() {
        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                this.handleResize(width, height);
            }
        });
        this.resizeObserver.observe(this.container);
    }
    handleResize(width, height) {
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        if (this.hooks.onResize) {
            this.hooks.onResize(width, height);
        }
    }
    setHooks(hooks) {
        this.hooks = hooks;
    }
    start() {
        if (this.animationId !== null)
            return;
        this.timeStep.reset();
        this.animate();
    }
    stop() {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    animate = (time = 0) => {
        this.animationId = requestAnimationFrame(this.animate);
        // Fixed timestep physics updates
        const interpAlpha = this.timeStep.update(time, (dt) => {
            if (this.hooks.onFixedUpdate) {
                this.hooks.onFixedUpdate(dt);
            }
        });
        // Render
        if (this.hooks.onRender) {
            this.hooks.onRender(interpAlpha);
        }
        this.renderer.render(this.scene, this.camera);
    };
    dispose() {
        this.stop();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
        disposeScene(this.scene);
        disposeRenderer(this.renderer);
    }
}
//# sourceMappingURL=Engine.js.map