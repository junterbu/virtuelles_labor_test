import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { camera, renderer} from "./View_functions.js";
import {TWEEN} from 'https://unpkg.com/three@0.139.0/examples/jsm/libs/tween.module.min.js';

// Geräteerkennung
export function isMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobile = /Android|iPhone|iPod/i.test(userAgent) || 
                     (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    console.log(isMobile ? "Mobiles Gerät erkannt." : "Desktop-Gerät erkannt.");
    return isMobile;
}
// export function isIOSDevice() {
//     return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
// }

// Erstellen einer Instanz des DRACOLoaders (aktivieren wenn Datei mit Draco Komprimiert)
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/'); // Pfad zum Draco-Decoder (kann angepasst werden)

// Setup der Three.js Szene
export let scene = new THREE.Scene();

const basicMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });

// Licht hinzufügen
export let ambientLight = new THREE.AmbientLight(0xffffff, 2.5);  // Weiches Umgebungslicht
scene.add(ambientLight);

//let directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);  // Richtungslicht
//directionalLight.position.set(1, 1, 0);  // Beispielposition des Lichts
//scene.add(directionalLight);

// Globale Beleuchtung
let hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2.5);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

// Richtungslicht mit Schatten
export let dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight1.position.set(5, 20, 7.5);
dirLight1.castShadow = false;  // Schatten aktivieren
dirLight1.shadow.mapSize.width = 512;  // Schattenauflösung
dirLight1.shadow.mapSize.height = 512;
scene.add(dirLight1);

// Richtungslicht mit Schatten
export let dirLight2 = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight2.position.set(5, 20, -7.5);
dirLight2.castShadow = false;  // Schatten aktivieren
dirLight2.shadow.mapSize.width = 512;  // Schattenauflösung
dirLight2.shadow.mapSize.height = 512;
scene.add(dirLight2);

const pointLight = new THREE.PointLight(0xffffff, 1, 50); // Weißes Punktlicht
pointLight.position.set(-12.5, 10, 4); // Position über der Szene
scene.add(pointLight);

// const hdrLoader = new RGBELoader(); // Lade HDR-Umgebungstexturen new GLTFLoader();
// hdrLoader.load('Assets/rosendal_park_sunset_puresky_4k.hdr', function(texture) {
//     texture.mapping = THREE.EquirectangularReflectionMapping;
//     scene.background = texture; // Verwende die HDR als Hintergrund, und keine Lichtquelle (scene.environment)
// });

scene.background = new THREE.Color(0x87ceeb); // Hellblauer Himmel

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// // Bloom-Effekt hinzufügen
// const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
// bloomPass.threshold = 0;
// bloomPass.strength = 1.5;
// bloomPass.radius = 0;
// composer.addPass(bloomPass);

// Animation-Loop mit Composer
function animate_renderer() {
    requestAnimationFrame(animate_renderer);
    TWEEN.update(); // Tween-Animationen aktualisieren
    composer.render(); // Verwende Composer anstelle von renderer.render()
}

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
//renderer.setAntialias();

// GLTFLoader, um Modelle (Gebäude, Eimer, Siebturm) zu laden
export const loader_overview = new GLTFLoader();
loader_overview.setDRACOLoader(dracoLoader); //nur wenn datei mit Draco komprimiert!
loader_overview.setMeshoptDecoder(MeshoptDecoder);

// Lade das Gebäudemodell
loader_overview.load('Assets/overview-v1.glb', function(gltf) {
    scene.add(gltf.scene)
}, undefined, function(error) {
    console.error('Fehler beim Laden des GLTF-Modells:', error);
});

animate_renderer(); 

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// export function exitARView() {
//     // Hintergrund wiederherstellen
//     scene.background = new THREE.Color(0x87ceeb); // Hellblauer Himmel

//     // AR-Licht entfernen
//     scene.traverse((child) => {
//         if (child.isLight) {
//             scene.remove(child);
//         }
//     });

//     console.log("AR-Ansicht verlassen.");
// }