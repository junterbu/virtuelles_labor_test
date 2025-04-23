// Marshall.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { scene } from './Allgemeines.js';
import { renderer, camera } from './View_functions.js';
import { Rohdichten, bitumenAnteil, bitumengehalt, dichteBitumen } from './Mischraum.js';
import { canvasSieblinie, eimerWerte, selectedMix } from './Gesteinsraum.js';
import { isMobileDevice } from './Allgemeines.js';
import { generatePDFReportintern, generatePDFReportextern } from './Excel.js';
import { zeigeQuiz } from './Marker.js';
import { getUserQuizFragen, getNextTwoQuestions } from './main.js';

const inputEvent = isMobileDevice() ? 'touchstart' : 'click';

const loader = new GLTFLoader();

let animationMixer;
let buttonOn; // Der Button aus der GLB-Datei
let action; // Die Animation selbst
let clock = new THREE.Clock(); // Uhr für präzise Delta-Zeit
const FPS = 24; // Frame-Rate

let probekörper; // Referenz auf das Objekt

// Funktion zum Laden und Einfügen des Modells
function loadMarshallModel() {
    loader.load(
        'Assets/Marshall.glb', // Pfad zur GLB
        (gltf) => {
            const marshallModel = gltf.scene;
            marshallModel.position.set(-8.5, 0.025, 1); // Positionierung in der Szene
            scene.add(marshallModel);

            // Animationen initialisieren
            if (gltf.animations.length > 0) {
                animationMixer = new THREE.AnimationMixer(marshallModel);
                action = animationMixer.clipAction(gltf.animations[0]);

                // Setze die Animationseigenschaften
                action.setLoop(THREE.LoopOnce); // Animation nur einmal abspielen
                action.clampWhenFinished = true; // Animation hält an, wenn sie endet
                action.timeScale = 24 / FPS; // Geschwindigkeit der Animation

                // Suche nach dem Button "button_on" und dem Objekt "Probekörper" in der Szene
                marshallModel.traverse((child) => {
                    if (child.isMesh) {
                        if (child.name === 'Button_on') {
                            buttonOn = child;
                        
                            if (isMobileDevice()) {
                                let hitboxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); // Größere Hitbox
                                let hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false }); // Unsichtbar
                                let hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
                                hitbox.position.set(-8.33631535, 1, 1);
                                scene.add(hitbox);
                                buttonOn = hitbox; // WICHTIG: Ersetze buttonOn durch die Hitbox!
                            }
                        }                        
                        if (child.name === 'Probekörper') {
                            probekörper = child;
                            probekörper.visible = false; // Standardmäßig unsichtbar
                        }
                    }
                });

                // Überprüfen, ob der Button gefunden wurde
                if (buttonOn) {
                    window.addEventListener(inputEvent, (event) => {
                        const mouse = new THREE.Vector2();
                        if (inputEvent === 'touchstart') {
                            const touch = event.touches[0];
                            mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
                            mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
                        } else {
                            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                        }
                        
                        const raycaster = new THREE.Raycaster();
                        raycaster.setFromCamera(mouse, camera);

                        let intersects = raycaster.intersectObject(buttonOn, true);

                        if (intersects.length > 0) {
                            playAnimation();
                            animate();
                            // generateExcelAfterMarshall();
                        }
                    });
                } else {
                    console.warn('Button "button_on" wurde in der GLB-Datei nicht gefunden.');
                }
            }
        },
        undefined,
        (error) => {
            console.error('Fehler beim Laden des Modells:', error);
        }
    );
}

function berechneMittelwerte(raumdichten) {
    return raumdichten.map(row => {
        const sum = row.reduce((acc, val) => acc + parseFloat(val), 0);
        return (sum / row.length).toFixed(3); // Mittelwert berechnen & auf 3 Nachkommastellen runden
    });
}

let animationCompleted = false; // Variable zur Verfolgung des Animationsstatus
export let raumdichten = Array(3).fill(null).map(() => Array(4).fill(null)); // 3 Rohdichten mit je 4 Raumdichten
// Update-Funktion für Animation und Sichtbarkeitssteuerung
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // Zeitdifferenz in Sekunden
    if (animationMixer) {
        animationMixer.update(delta); // Animation basierend auf Delta-Zeit aktualisieren

        // Sichtbarkeitssteuerung basierend auf der Zeit
        if (action) {
            const currentFrame = action.time * FPS; // Aktueller Frame basierend auf der Zeit
            if (probekörper) {
                if (currentFrame >= 115 && !probekörper.visible) {
                    probekörper.visible = true; // Sichtbar machen
                }
            }
        }


        if (action && action.isRunning() === false && !animationCompleted) {
            animationCompleted = true; // Setze den Status auf abgeschlossen
            
            let HFB = Math.random() * (85 - 75) + 75;

            let y=[];
            let Bx, By;

            // Bestimme die Werte für Bx und By basierend auf aktuellerAsphalt
            if (selectedMix === "AC 11 deck A1") {
                Bx = 5 + 0.4 * Math.random();
                By = 1
            } else if (selectedMix === "AC 22 bin H1") {
                Bx = 4.3 + 0.4 * Math.random();
                By = 1
            } else if (selectedMix === "AC 32 trag T3") {
                Bx = 4 + 0.4 * Math.random();
                By = 1
            } else {
                alert("Bitte Asphaltmischung auswählen!");
                return;
            }

            for (let i = 0; i < bitumengehalt.length; i++) {
                y.push(findPoint(Bx, By, bitumengehalt[i]));
            }
        
            for (let i = 0; i < Rohdichten.length; i++) {
                if (Rohdichten[i] !== null) {
                    raumdichten[i] = berechneRaumdichte(Rohdichten[i], eimerWerte, y[i], HFB);
                }
            }

            context.clearRect(0, 0, canvas.width, canvas.height); // Lösche den alten Text
            context.font = '20px Arial'; // Kleinere Schrift für mehrere Werte
            let startX = 125;
            let startY = 75;
            let lineHeight = 30;
            let colWidth = 175; // Spaltenbreite
            let rowHeight = 50; // Zeilenhöhe

            context.fillText("Raumdichten Übersicht:", canvas.width / 2, 20);

            // Werte anzeigen
            for (let i = 0; i < raumdichten.length; i++) {
                for (let j = 0; j < raumdichten[i].length; j++) {
                    const value = raumdichten[i][j];
                    if (value !== null) {
                        context.fillText(
                            `R${i + 1}-${j + 1}: ${value} g/cm³`,
                            startX + j * colWidth,
                            startY + i * rowHeight
                        );
                    } else {
                        context.fillText(
                            `R${i + 1}-${j + 1}: N/A`,
                            startX + j * colWidth,
                            startY + i * rowHeight
                        );
                    }
                }
            }
            
            
            
            const sieblinieCanvas = document.querySelector("#canvas-container canvas"); // Sieblinie Canvas abrufen
            // generatePDFReport(selectedMix, eimerWerte, bitumengehalt, Rohdichten, raumdichten, canvasSieblinie);
            texture.needsUpdate = true; // Textur aktualisieren
        }
    }

    renderer.render(scene, camera);
}

// Modul initialisieren
function init() {
    loadMarshallModel();
}

init();


// Funktion zur Berechnung von Hohlraumgehalt basierend auf Größtkorn mit Zufallsbereich
function getHohlraumgehalt(maxKorn) {
    // Werte für H_M,bit aus der Abbildung
    const hohlraumTabelle = {
        0: 0,
        0.63: 28,
        2: 24,
        4: 20.2,
        8: 17.2,
        11: 14.4,
        16: 12.4,
        22: 11,
        32: 10
    };

    const baseValue = hohlraumTabelle[maxKorn] || null; // Basiswert aus der Tabelle
    if (baseValue === null) {
        updatePlaneText("kein Gestein ausgew.");
        return null;
    } else {
        updatePlaneText("Marshall-Verdichter mit grünem Knopf starten")
    }

    // // Zufälligen Wert im Bereich +-0.5 hinzufügen
    // const randomFactor = (1 - 0.95) * (Math.random()-0.5); // Bereich: [-0.025, 0.025]
    // const randomizedValue = baseValue + randomFactor;
    return baseValue; // Auf zwei Dezimalstellen runden
}

const eimeraktuell = eimerWerte


// Funktion zur Berechnung des Größtkorns
export function berechneGroesstkorn(eimeraktuell) {
    let maxKorn = 0;

    // Iteriere durch alle Schlüssel im Objekt
    for (const [key, value] of Object.entries(eimeraktuell)) {
        if (value > 0) {
            // Extrahiere das Größtkorn aus dem Eimerbereich
            const bereich = key.split('/');
            const obergrenze = bereich.length > 1 ? parseInt(bereich[1]) : 0;

            if (obergrenze > maxKorn) {
                maxKorn = obergrenze;
            }
        }
    }

    return maxKorn;
}

let sol = 0

function findPoint(Bx, By, bitumenAnteil) {

    let Ax = Bx - 1;
    let Ay = By - 0.05;
    let Cx = Bx + 1;
    let Cy = By - 0.005;

    // Erstelle die Matrix A und den Vektor B
    let A = [
        [Ax ** 2, Ax, 1],
        [Bx ** 2, Bx, 1],
        [Cx ** 2, Cx, 1]
    ];
    let B = [Ay, By, Cy];

    // Löse das lineare Gleichungssystem Ax = B für x (also für a, b, c)
    let [a, b, c] = solveLinearSystem(A, B);

    // Berechne y-Wert für das gegebene x
    let y = a * bitumenAnteil ** 2 + b * bitumenAnteil + c;
    return y;
}

// Funktion zur Lösung eines linearen Gleichungssystems (Matrix Inversion)
export function solveLinearSystem(A, B) {
    let invA = invertMatrix(A);
    return multiplyMatrixVector(invA, B);
}

// Matrix-Inversion mit der Cramer'schen Regel
export function invertMatrix(matrix) {
    let det = 
        matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
        matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
        matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);

    if (det === 0) throw new Error("Matrix ist nicht invertierbar");

    let inv = [
        [
            (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) / det,
            -(matrix[0][1] * matrix[2][2] - matrix[0][2] * matrix[2][1]) / det,
            (matrix[0][1] * matrix[1][2] - matrix[0][2] * matrix[1][1]) / det
        ],
        [
            -(matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) / det,
            (matrix[0][0] * matrix[2][2] - matrix[0][2] * matrix[2][0]) / det,
            -(matrix[0][0] * matrix[1][2] - matrix[0][2] * matrix[1][0]) / det
        ],
        [
            (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]) / det,
            -(matrix[0][0] * matrix[2][1] - matrix[0][1] * matrix[2][0]) / det,
            (matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]) / det
        ]
    ];
    return inv;
}

// Matrix-Vektor-Multiplikation
export function multiplyMatrixVector(matrix, vector) {
    return matrix.map(row => row.reduce((sum, value, index) => sum + value * vector[index], 0));
}

// Funktion zur Berechnung der Raumdichte
function berechneRaumdichte(rhoRM, eimerWerte, y, HFB) {
    const maxKorn = berechneGroesstkorn(eimerWerte);
    const hohlraumgehalt = getHohlraumgehalt(maxKorn);

    if (!hohlraumgehalt) {
        return Array(4).fill(null); // Wenn keine gültigen Werte, fülle mit null
    }
    let raumdichtenSet = [];
    for (let i = 0; i < 4; i++) {
        let H_bit = (hohlraumgehalt/100) - (HFB / 100) * (hohlraumgehalt/100);
        let rhoA = rhoRM - rhoRM * H_bit; // Berechnung der Raumdichte
        let rhoA_fitted = rhoA*y-Math.random()*0.01;
        raumdichtenSet.push(rhoA_fitted.toFixed(3));
    }
    return raumdichtenSet;
}

// Plane und Text erstellen
let canvas = document.createElement('canvas');
canvas.width = 768;
canvas.height = 256;
let context = canvas.getContext('2d');
context.font = '30px Arial';
context.fillStyle = 'white';
context.textAlign = 'center';
context.textBaseline = 'middle';
context.fillText('Gestein oder Bitumengehalt auswählen', canvas.width / 2, canvas.height / 2);

let texture = new THREE.CanvasTexture(canvas);
let material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
let planeGeometry = new THREE.PlaneGeometry(3, 1.25); // Breite und Höhe der Plane
let planeMesh = new THREE.Mesh(planeGeometry, material);
planeMesh.position.set(-6, 2, 1); // Setze die Position im Raum
scene.add(planeMesh);

function updatePlaneText(newText) {
    context.clearRect(0, 0, canvas.width, canvas.height); // Lösche den alten Text
    context.font = '30px Arial'; // Anpassung für bessere Lesbarkeit
    let lines = newText.split('\n');
    lines.forEach((line, index) => {
        context.fillText(line, canvas.width / 2, (canvas.height / 4) * (index + 1));
    });
    texture.needsUpdate = true; // Aktualisiere die Textur
}

async function starteDoppelQuiz() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const naechsteFragen = await getNextTwoQuestions(userId);
    if (naechsteFragen.length > 0) await zeigeQuiz(naechsteFragen[0]);
    if (naechsteFragen.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 700)); // Kurze Pause
        await zeigeQuiz(naechsteFragen[1]);
    }
}


async function playAnimation() {
    if (action) {
        action.reset();
        action.timeScale = 24 / FPS;
        probekörper.visible = false;
        updatePlaneText('Marshall-Verdichter läuft...');
        animationCompleted = false;
        action.play();

        // Starte die zwei Quizfragen
        await starteDoppelQuiz();
        
        // Warte auf das Ende der Animation
        await warteAufAnimation();

        // Erst dann PDF generieren
        if (selectedMix != "Bitte klicken"){
            generatePDFReportextern(selectedMix, eimerWerte, bitumengehalt, Rohdichten, raumdichten, canvasSieblinie);
            generatePDFReportintern(selectedMix, eimerWerte, bitumengehalt, Rohdichten, raumdichten, canvasSieblinie);
        }
    }
}


function warteAufAnimation() {
    return new Promise(resolve => {
        function checkAnimation() {
            if (action && !action.isRunning()) {
                resolve();
            } else {
                requestAnimationFrame(checkAnimation);
            }
        }
        checkAnimation();
    });
}

document.getElementById('bitumenRange').addEventListener('input', () => {
    updatePlaneText('Marshall-Verdichter mit grünem Knopf starten');
});

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});


