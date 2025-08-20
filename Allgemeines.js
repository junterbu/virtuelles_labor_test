import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import {TWEEN} from 'https://unpkg.com/three@0.139.0/examples/jsm/libs/tween.module.min.js';


let renderer = new THREE.WebGLRenderer({
  antialias: false,
  alpha: false,
  powerPreference: 'high-performance'
});

const container = document.getElementById('canvas-container') || document.body;
container.appendChild(renderer.domElement);

// DPR leicht clampen, schont iGPU
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.0));
// volle Fenstergröße, kein /2
renderer.setSize(window.innerWidth, window.innerHeight, false);

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = false;
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(20, 20, 5);

// Geräteerkennung
export function isMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobile = /Android|iPhone|iPod/i.test(userAgent) || 
                     (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
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
function handleResize() {
  const width  = window.innerWidth;
  const height = window.innerHeight;

  // Kamera
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  // Renderer (interne Auflösung)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.0));
  renderer.setSize(width, height, false);

  // !!! Composer mitresizen, sonst weißes Bild
  if (typeof composer !== 'undefined' && composer) {
    composer.setSize(width, height);
  }
}

window.addEventListener('resize', handleResize);

export {renderer, camera}