import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {dirLight1, } from "./Allgemeines.js";
import {TWEEN} from 'https://unpkg.com/three@0.139.0/examples/jsm/libs/tween.module.min.js';;
import { isMobileDevice, scene } from './Allgemeines.js';
import { lagerMarker, leaveproberaumMarker, proberaumlagerMarker, lagerproberaumMarker, toMischraumMarker, leaveMischraum, leavelagerMarker, toMarshallMarker, leaveMarshall, activeMarkers, markers} from "./Marker.js";
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { zeigeQuiz, speicherePunkte, quizFragen, quizPunkte } from "./Marker.js";
import { getUserQuizFragen, getNextTwoQuestions, getNextQuestions } from "./main.js";
// Bestimmen Sie das Event basierend auf dem Gerät
const inputEvent = isMobileDevice() ? 'touchstart' : 'click';

leaveMischraum.visible = false;
leaveMarshall.visible = false;

window.addEventListener(inputEvent, function (event) {
    const mouse = new THREE.Vector2();

    if (inputEvent === 'touchstart') {
        // Touch-Eingabe verarbeiten
        const touch = event.touches[0];
        mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    } else {
        // Maus-Eingabe verarbeiten
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    // Raycaster einstellen
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Marker überprüfen
    const intersects = raycaster.intersectObjects(activeMarkers);
    if (intersects.length > 0) {
        const clickedMarker = intersects[0].object;
        handleMarkerClick(clickedMarker);
    }
});

function handleMarkerClick(marker) {
    if (marker === lagerMarker) {
        goToLager();
    } else if (marker === proberaumlagerMarker && currentRoom == "Gesteinsraum") {
        fromProberaumtoLager();
    } else if (marker === lagerproberaumMarker && currentRoom == "Lager") {
        fromLagertoProberaum();
    } else if (marker === leaveproberaumMarker) {
        leaveView();
    } else if (marker === leavelagerMarker) {
        leaveView();
    } else if (marker === leaveMischraum) {
        leaveView();
    } else if (marker === toMarshallMarker && currentRoom == "Mischraum") {
        toMarshall();
    } else if (marker === leaveMarshall) {
        leaveView();
    } 
}

export let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
document.body.appendChild(renderer.domElement);
renderer.antialias = false;
renderer.outputEncoding = THREE.sRGBEncoding; // Verbessert Farben ohne zusätzlichen Speicherbedarf
renderer.shadowMap.enabled = false; // Nur aktivieren, wenn Schatten notwendig

// WebXR-Button hinzufügen
document.body.appendChild(VRButton.createButton(renderer));

// AR View für non IOS
export function startARView() {
    renderer.xr.enabled = true;
    scene.background = null;

    let arLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    arLight.position.set(0.5, 1, 0.25);
    scene.add(arLight);

    camera.position.set(20, 20, 5); // Durchschnittliche Augenhöhe
    camera.lookAt(0, 0, -1);

    renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
    });

}

// // AR View für IOS
// export function startARMode() {
//     console.log("AR-Modus gestartet. Wechsel zu AR.js-Ansicht.");

//     // Wechsel zur AR.js-Szene
//     document.body.innerHTML = `
//     <a-scene embedded arjs>
//         <a-box position="20 20 5" material="color: red;"></a-box>
//         <a-marker-camera preset="hiro"></a-marker-camera>
//     </a-scene>`;
// }

export let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(20, 20, 5);

export function animateCamera(targetPosition, targetLookAt) {
    const startPosition = camera.position.clone();
    const startLookAt = controls.target.clone();

    // Kamera-Position animieren
    new TWEEN.Tween(startPosition)
        .to(targetPosition, 2000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
            camera.position.copy(startPosition);
        })
        .start();

    // Zielpunkt (controls.target) animieren
    new TWEEN.Tween(startLookAt)
        .to(targetLookAt, 2000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
            controls.target.copy(startLookAt);
            controls.update();
        })
        .start();
}

// Kamera-Positionen für Lagerraum und Proberaum
let lagerViewpoint = new THREE.Vector3(-12.5, 1.5, 4);
let proberaumViewpoint = new THREE.Vector3(5, 1.5, -15);
let MischraumViewpoint = new THREE.Vector3(-8, 1.5, 7);
let MarshallViewpoint = new THREE.Vector3(-8, 1.5, 3);
export let currentRoom = ""
export function goToLager() {
    currentRoom = "Lager";
    // Zielposition und LookAt-Werte definieren
    const targetPosition = new THREE.Vector3(lagerViewpoint.x, lagerViewpoint.y, lagerViewpoint.z);
    const targetLookAt = new THREE.Vector3(lagerViewpoint.x, lagerViewpoint.y, lagerViewpoint.z + 0.1);

    // Kamera animiert bewegen
    animateCamera(targetPosition, targetLookAt);

    // Setze den Drehpunkt (target) auf die gewünschte Position
    controls.target.set(targetLookAt.x, targetLookAt.y, targetLookAt.z);
    controls.update();

    // Erlaube nur Rotation, kein Zoom
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableRotate = true;
    // if (isMobileDevice()) {
    //     exitARView();
    // }
    // Blende den `uiContainer`-Schieberegler aus
    document.getElementById('uiContainer').style.display = 'none';
    leaveMischraum.visible = false;
    leaveMarshall.visible = false;
    lagerproberaumMarker.visible = true; 
}

async function starteDoppelQuiz() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const naechsteFragen = await getNextTwoQuestions(userId);
    console.log(naechsteFragen)
    if (naechsteFragen.length > 0) await zeigeQuiz(naechsteFragen[0]);
    if (naechsteFragen.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 700)); // Kurze Pause
        await zeigeQuiz(naechsteFragen[1]);
    }
} 

export function fromLagertoProberaum() {
    currentRoom = "Gesteinsraum";
    starteDoppelQuiz();

    //Wegpunkte vom Lager ins Labor
    const points = [
        new THREE.Vector3(-12.5, 1.5, 4),  // Startpunkt (Lager)
        new THREE.Vector3(-12.5, 1.5, 9),    // Zwischenpunkt
        new THREE.Vector3(-2, 1.5, 9),    // Weitere Zwischenstation
        new THREE.Vector3(-1, 1.5, -9),    // Weitere Zwischenstation
        new THREE.Vector3(5, 1.5, -11),    // Weitere Zwischenstation
        new THREE.Vector3(5, 1.5, -15)    // Zielpunkt (Proberaum)
    ];

    // Erstelle die Kurve
    const curve = new THREE.CatmullRomCurve3(points);

    // Anzahl der Segmente der Animation
    const numPoints = 400;
    const curvePoints = curve.getPoints(numPoints);
    
    // Animation über den Pfad
    let index = 0;
    function animateAlongPath() {
        if (index < curvePoints.length - 1) {
            const currentPoint = curvePoints[index];
            const nextPoint = curvePoints[index + 1];

            // Setze die Kamera-Position
            camera.position.copy(currentPoint);
            controls.target.copy(nextPoint); // Setze Zielpunkt auf nächsten Punkt
            controls.update();

            index++;
            setTimeout(() => requestAnimationFrame(animateAlongPath), 30); // Verzögerung zwischen Frames
            leaveproberaumMarker.visible = false;
            proberaumlagerMarker.visible = false;
        } else {
            // Animation beendet
            leaveproberaumMarker.visible = true;
            proberaumlagerMarker.visible = true;
        }
    }   

    // Start der Animation
    animateAlongPath();

    // Schieberegler einblenden (optional)
    document.getElementById('uiContainer').style.display = 'none';

    leaveMarshall.visible = false;
    leaveMischraum.visible = false;
    lagerproberaumMarker.visible = false;

}

export function fromProberaumtoLager() {
    currentRoom = "Lager";
    //Wegpunkte vom Gesteinsraum ins Lager
    const points = [
        new THREE.Vector3(5, 1.5, -15),    // Zielpunkt (Proberaum)
        new THREE.Vector3(5, 1.5, -11),    // Weitere Zwischenstation
        new THREE.Vector3(-1, 1.5, -9),    // Weitere Zwischenstation
        new THREE.Vector3(-2, 1.5, 9),    // Weitere Zwischenstation
        new THREE.Vector3(-12.5, 1.5, 9),    // Zwischenpunkt
        new THREE.Vector3(-12.5, 1.5, 4),  // Startpunkt (Lager)
    ];

    // Erstelle die Kurve
    const curve = new THREE.CatmullRomCurve3(points);

    // Anzahl der Segmente der Animation
    const numPoints = 400;
    const curvePoints = curve.getPoints(numPoints);
    
    // Animation über den Pfad
    let index = 0;
    function animateAlongPath() {
        if (index < curvePoints.length - 1) {
            const currentPoint = curvePoints[index];
            const nextPoint = curvePoints[index + 1];

            // Setze die Kamera-Position
            camera.position.copy(currentPoint);
            controls.target.copy(nextPoint); // Setze Zielpunkt auf nächsten Punkt
            controls.update();

            index++;
            setTimeout(() => requestAnimationFrame(animateAlongPath), 30); // Verzögerung zwischen Frames
            leaveproberaumMarker.visible = false;
            proberaumlagerMarker.visible = false;
        } else {
            // Animation beendet
            leaveproberaumMarker.visible = true;
            lagerproberaumMarker.visible = true;
        }
    }   

    // Start der Animation
    animateAlongPath();

    // Schieberegler einblenden (optional)
    document.getElementBy
    Id('uiContainer').style.display = 'none';

    leaveMarshall.visible = false;
    leaveMischraum.visible = false;
}

export function goToMischraum() {
    currentRoom = 'Mischraum';
    starteDoppelQuiz();
    //Wegpunkte vom Gesteinsraum ins Lager
    const points = [
        new THREE.Vector3(5, 1.5, -15),    // Startpunkt
        new THREE.Vector3(5, 1.5, -11),    // Weitere Zwischenstation
        new THREE.Vector3(-1, 1.5, -9),    // Weitere Zwischenstation
        new THREE.Vector3(-2, 1.5, 6),    // Weitere Zwischenstation
        new THREE.Vector3(-8, 1.5, 7),    // Endpunkt
    ];

    // Erstelle die Kurve
    const curve = new THREE.CatmullRomCurve3(points);

    // Anzahl der Segmente der Animation
    const numPoints = 400;
    const curvePoints = curve.getPoints(numPoints);

    // Animation über den Pfad
    let index = 0;
    function animateAlongPath() {
        if (index < curvePoints.length - 1) {
            const currentPoint = curvePoints[index];
            const nextPoint = curvePoints[index + 1];

            // Setze die Kamera-Position
            camera.position.copy(currentPoint);
            controls.target.copy(nextPoint); // Setze Zielpunkt auf nächsten Punkt
            controls.update();

            index++;
            setTimeout(() => requestAnimationFrame(animateAlongPath), 30); // Verzögerung zwischen Frames
            leaveproberaumMarker.visible = false;
            proberaumlagerMarker.visible = false;
        } else {
            // Animation beendet
            leaveproberaumMarker.visible = true;
            
            const targetPosition = new THREE.Vector3(-8, 1.5, 7); // Neue Zielposition
            const targetLookAt = new THREE.Vector3(-8.5, 1.5, 6); // Zielblickpunkt im Mischraum
        
            // Kamera animiert bewegen
            animateCamera(targetPosition, targetLookAt);
        
            // Optional: Kontrollziele direkt setzen
            controls.target.set(targetLookAt.x, targetLookAt.y, targetLookAt.z);
            controls.update();
            controls.enableZoom = false;
            controls.enablePan = false;
            controls.enableRotate = true;
            leaveMischraum.visible = true;
            document.getElementById('bitumenUI').style.display = 'block';
        }

        
    }   

    leaveMarshall.visible = false;
    // Start der Animation
    animateAlongPath();

    // Schieberegler einblenden (optional)
    document.getElementById('uiContainer').style.display = 'none';

    // Blende den `bitumenUI`-Schieberegler ein
    // document.getElementById('bitumenUI').style.display = 'block';
}

export function leaveView() {
    // Zielposition und LookAt-Werte definieren
    const targetPosition = new THREE.Vector3(20, 20, 20);
    const targetLookAt = new THREE.Vector3(0, 0, 0);

    // Kamera animiert bewegen
    animateCamera(targetPosition, targetLookAt);

    // Setze den Drehpunkt (target) auf die gewünschte Position
    controls.target.set(targetLookAt.x, targetLookAt.y, targetLookAt.z);
    controls.update();

    camera.position.set(20, 20, 20);  // Beispielposition für die freie Ansicht
    camera.lookAt(0, 0, 0);
    
    // Kamera-Steuerung komplett freigeben (Zoom und Rotation)
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enabled = true;

    // "Verlasse Ansicht"-Button ausblenden
    document.getElementById('leaveView').style.display = 'none';
    document.getElementById('toProberaum').style.display = 'none';
    document.getElementById('toLager').style.display = 'none';  // Button ausblenden   

    // Blende den `uiContainer`-Schieberegler aus
    document.getElementById('uiContainer').style.display = 'none';

    // Blende den `bitumenUI`-Schieberegler aus
    document.getElementById('bitumenUI').style.display = 'none';

    // if (isMobileDevice()) {
    //     exitARView();
    // }

    leaveMarshall.visible = false;
    leaveMischraum.visible = false;
}

export async  function toMarshall() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    const naechsteFragen = await getNextQuestions(userId);
    zeigeQuiz(naechsteFragen[0]);
    // Wegpunkte vom Gesteinsraum ins Lager
    const points = [
        new THREE.Vector3(-8, 1.5, 7),    // Startpunkt
        new THREE.Vector3(-2, 1.5, 6),    // Weitere Zwischenstation
        new THREE.Vector3(-2, 1.5, 3),    // Weitere Zwischenstation
        new THREE.Vector3(MarshallViewpoint.x, MarshallViewpoint.y, MarshallViewpoint.z)    // Endpunkt
    ];

    // Erstelle die Kurve
    const curve = new THREE.CatmullRomCurve3(points);

    // Anzahl der Segmente der Animation
    const numPoints = 300;
    const curvePoints = curve.getPoints(numPoints);

    let index = 0;

    function animateAlongPath() {
        if (index < curvePoints.length - 1) {
            const currentPoint = curvePoints[index];
            const nextPoint = curvePoints[index + 1];

            // Setze die Kamera-Position
            camera.position.copy(currentPoint);
            controls.target.copy(nextPoint);
            controls.update();

            index++;
            setTimeout(() => requestAnimationFrame(animateAlongPath), 30);
        } else {
            leaveMarshall.visible = true;
            // Animation beendet
            leaveproberaumMarker.visible = true;
            
            const targetPosition = new THREE.Vector3(MarshallViewpoint.x, MarshallViewpoint.y, MarshallViewpoint.z); // Neue Zielposition
            const targetLookAt = new THREE.Vector3(-7.5, 1.5, 1); // Zielblickpunkt im Mischraum
        
            // Kamera animiert bewegen
            animateCamera(targetPosition, targetLookAt);
            // Optional: Kontrollziele direkt setzen
            controls.target.set(targetPosition.x, targetPosition.y, targetPosition.z);
            controls.update();

            // Erlaube nur Rotation, kein Zoom
            controls.enableZoom = false;
            controls.enablePan = false;
            controls.enableRotate = true;
        }
    }
    leaveMischraum.visible = false;
    
    // Start der Bewegung entlang des Pfades
    animateAlongPath();

    // UI-Elemente ausblenden
    document.getElementById('uiContainer').style.display = 'none';
    document.getElementById('bitumenUI').style.display = 'none';
}


//Orbit Controls
export let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;  // Smooth Camera Movements
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2; // Kamera darf nicht nach unten gehen

// Frame-Rate-Messung und Qualitätsanpassung
let frameTimes = [];
let qualityLevel = 3;

function measureFrameRate() {
    const now = performance.now();
    frameTimes.push(now);

    if (frameTimes.length > 60) {
        frameTimes.shift();
    }

    if (frameTimes.length >= 2) {
        const avgDeltaTime = (frameTimes[frameTimes.length - 1] - frameTimes[0]) / (frameTimes.length - 1);
        const fps = 1000 / avgDeltaTime;

        // Dynamische Anpassung
        if (fps < 30 && qualityLevel > 1) {
            qualityLevel--;
            updateQuality(qualityLevel);
        } else if (fps > 50 && qualityLevel < 3) {
            qualityLevel++;
            updateQuality(qualityLevel);
        }
    }

    requestAnimationFrame(measureFrameRate);
}

function updateQuality(level) {
    switch (level) {
        case 1:
            renderer.setPixelRatio(0.5);
            renderer.antialias = false;
            dirLight1.shadow.mapSize.set(256, 256); // Geringere Schattenauflösung
            break;
        case 2:
            renderer.setPixelRatio(1);
            renderer.antialias = true;
            dirLight1.shadow.mapSize.set(512, 512);
            break;
        case 3:
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.antialias = true;
            dirLight1.shadow.mapSize.set(1024, 1024);
            break;
    }
    dirLight1.shadow.needsUpdate = true; // Aktualisiere Schatten
}

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Kamera-Aspektverhältnis aktualisieren
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Renderer-Größe anpassen
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
}

// Initiale Anpassung beim Start
onWindowResize();


measureFrameRate();