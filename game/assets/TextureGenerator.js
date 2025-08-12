import * as THREE from 'three';
export class TextureGenerator {
    static cache = new Map();
    static generateAsphaltBase() {
        const key = 'asphalt_base';
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        // Base grey
        ctx.fillStyle = '#444444';
        ctx.fillRect(0, 0, size, size);
        // Add noise for texture
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 30;
            data[i] = Math.max(0, Math.min(255, data[i] + noise)); // R
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
        }
        ctx.putImageData(imageData, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        this.cache.set(key, texture);
        return texture;
    }
    static generateAsphaltNormal() {
        const key = 'asphalt_normal';
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        // Generate subtle normal map noise
        for (let i = 0; i < data.length; i += 4) {
            const x = (i / 4) % size;
            const y = Math.floor((i / 4) / size);
            // Simple noise-based normal
            const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 + 0.5;
            data[i] = 128 + noise * 20; // R (X)
            data[i + 1] = 128 + noise * 20; // G (Y)
            data[i + 2] = 255; // B (Z)
            data[i + 3] = 255; // A
        }
        ctx.putImageData(imageData, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.LinearSRGBColorSpace;
        this.cache.set(key, texture);
        return texture;
    }
    static generateAsphaltRoughness() {
        const key = 'asphalt_roughness';
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        // Base high roughness with subtle variation
        ctx.fillStyle = '#E0E0E0'; // ~0.88 roughness
        ctx.fillRect(0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const variation = (Math.random() - 0.5) * 20;
            const value = Math.max(200, Math.min(255, 224 + variation));
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
        }
        ctx.putImageData(imageData, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.LinearSRGBColorSpace;
        this.cache.set(key, texture);
        return texture;
    }
    static generateGrassBase() {
        const key = 'grass_base';
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        // Base grass green
        ctx.fillStyle = '#4a7c59';
        ctx.fillRect(0, 0, size, size);
        // Add grass texture variation
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 40;
            data[i] = Math.max(0, Math.min(255, 74 + noise)); // R
            data[i + 1] = Math.max(0, Math.min(255, 124 + noise)); // G  
            data[i + 2] = Math.max(0, Math.min(255, 89 + noise)); // B
        }
        ctx.putImageData(imageData, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        this.cache.set(key, texture);
        return texture;
    }
    static generateRumbleBase() {
        const key = 'rumble_base';
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        // Create red/white striped pattern
        const stripeWidth = size / 16; // 16 stripes
        for (let i = 0; i < 16; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#ff3333' : '#ffffff';
            ctx.fillRect(i * stripeWidth, 0, stripeWidth, size);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        this.cache.set(key, texture);
        return texture;
    }
    static generateCloudAlpha() {
        const key = 'cloud_alpha';
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        // Create soft cloud shape
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size * 0.3;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        // Add some noise for natural cloud look
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const x = (i / 4) % size;
            const y = Math.floor((i / 4) / size);
            const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) / radius;
            if (dist < 1) {
                const noise = Math.random() * 0.3;
                const alpha = data[i + 3] * (1 - noise);
                data[i + 3] = Math.max(0, alpha);
            }
        }
        ctx.putImageData(imageData, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        this.cache.set(key, texture);
        return texture;
    }
    static generateFenceAlpha() {
        const key = 'fence_alpha';
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        // Create chain link pattern
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, size, size);
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 2;
        const gridSize = 16;
        for (let x = 0; x < size; x += gridSize) {
            for (let y = 0; y < size; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + gridSize, y + gridSize);
                ctx.moveTo(x + gridSize, y);
                ctx.lineTo(x, y + gridSize);
                ctx.stroke();
            }
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        this.cache.set(key, texture);
        return texture;
    }
    static dispose() {
        this.cache.forEach(texture => texture.dispose());
        this.cache.clear();
    }
}
//# sourceMappingURL=TextureGenerator.js.map