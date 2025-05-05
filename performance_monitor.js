import * as THREE from 'three';

let frames = 0;
let lastTime = performance.now();
let lowFPSCounter = 0;
const fpsThreshold = 30;

export function monitorPerformance(renderer, scene) {
    function checkFPS() {
        const now = performance.now();
        frames++;
        if (now - lastTime >= 1000) {
            const fps = frames;
            if (fps < fpsThreshold) lowFPSCounter++;
            else lowFPSCounter = 0;

            if (lowFPSCounter >= 5) {
                downgradeGraphics(renderer, scene);
            }

            frames = 0;
            lastTime = now;
        }
        requestAnimationFrame(checkFPS);
    }
    checkFPS();
}

function downgradeGraphics(renderer, scene) {
    console.warn("Downgrading graphics due to low FPS...");

    // Schatten deaktivieren
    renderer.shadowMap.enabled = false;

    // Materialien vereinfachen
    scene.traverse(obj => {
        if (obj.isMesh) {
            obj.material = new THREE.MeshBasicMaterial({ color: 0xcccccc });
        }
    });

    alert("Grafikleistung wurde reduziert, um die Performance zu verbessern.");
}

export function logGPUInfo(renderer) {
    const gl = renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const rendererInfo = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        console.log("GPU Vendor:", vendor);
        console.log("GPU Renderer:", rendererInfo);

        if (!vendor.toLowerCase().includes("nvidia") && !vendor.toLowerCase().includes("amd")) {
            alert("Hinweis: Es scheint, als würde die integrierte GPU verwendet. Bitte stelle sicher, dass dein Browser die dedizierte GPU nutzt.");
        }
    }
}