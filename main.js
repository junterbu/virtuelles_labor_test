import { fromLagertoProberaum, goToLager, goToMischraum, toMarshall, jumpToGesteinsraum, jumpToMischraum } from './View_functions.js';
import * as THREE from 'three';
import { camera, scene } from './Allgemeines.js';

const BACKEND_URL = "https://backend-test-phase.vercel.app";
export let mouse = new THREE.Vector2();

// Raycaster und Mauskoordinaten definieren
export let raycaster = new THREE.Raycaster();

async function sendDataToServer(userId, data) {
    const response = await fetch(`${BACKEND_URL}/api/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, data })
    });

    const result = await response.json();
}

const steps = document.querySelectorAll('.step');
let visitedRooms = new Set();

export async function getUserData(userId) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/data/${userId}`);
        if (!response.ok) throw new Error("Fehler beim Abrufen der Daten");

        const data = await response.json();
        if (!data || typeof data !== "object") {
            console.error("⚠️ Ungültige Datenstruktur:", data);
            return {}; // Rückgabe eines leeren Objekts, um undefined zu vermeiden
        }

        return data;
    } catch (error) {
        console.error("❌ Fehler beim Abrufen der Benutzerdaten:", error);
        return {}; // Rückgabe eines leeren Objekts, um Fehler zu vermeiden
    }
}



// ✅ 1. sendQuizAnswer – jetzt mit expliziten Parametern
export async function sendQuizAnswer(userId, raum, antwort, punkte, frage, richtigeAntwort) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/quiz`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId,
                raum,
                antwort,
                punkte,
                frage,
                richtige_antwort: richtigeAntwort
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Fehler beim Speichern");
    } catch (err) {
        console.error("❌ Fehler beim Speichern der Antwort:", err);
    }
}

export async function getUserQuizFragen(userId) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/quizfragen/${userId}`);
        if (!response.ok) throw new Error("Fehler beim Abrufen der Quizfragen");

        const data = await response.json();
        return data.fragen;
    } catch (error) {
        console.error("❌ Fehler beim Abrufen der Fragen:", error);
        return [];
    }
}

export async function getUserBeantworteteFragen(userId) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/beantworteteFragen/${userId}`);
        if (!response.ok) throw new Error("Fehler beim Abrufen der beantworteten Fragen");

        const data = await response.json();

        // Extrahiere die Räume aus den gespeicherten Quiz-Ergebnissen
        return data.beantwortet || [];
    } catch (error) {
        console.error("❌ Fehler beim Abrufen der beantworteten Fragen:", error);
        return [];
    }
}

export async function getNextTwoQuestions(userId) {
    try {
        const nutzerFragen = await getUserQuizFragen(userId);
        const beantworteteFragen = await getUserBeantworteteFragen(userId);

        // Finde die nächsten zwei unbeantworteten Fragen
        const offeneFragen = nutzerFragen.filter(f => !beantworteteFragen.includes(f)).slice(0, 2);
        return offeneFragen;
    } catch (error) {
        console.error("❌ Fehler beim Abrufen der nächsten zwei Fragen:", error);
        return [];
    }
}

export async function getNextQuestions(userId) {
    try {
        const nutzerFragen = await getUserQuizFragen(userId);
        const beantworteteFragen = await getUserBeantworteteFragen(userId);

        // Finde die nächsten zwei unbeantworteten Fragen
        const offeneFragen = nutzerFragen.filter(f => !beantworteteFragen.includes(f)).slice(0, 1);
        return offeneFragen;
    } catch (error) {
        console.error("❌ Fehler beim Abrufen der nächsten zwei Fragen:", error);
        return [];
    }
}

function markVisited(room) {
    visitedRooms.add(room);
    steps.forEach(step => {
        if (visitedRooms.has(step.dataset.room)) {
            step.classList.add('visited');
        }
    });
}

// Raumwechsel bei Klick
steps.forEach(step => {
    step.addEventListener('click', () => {
        const room = step.dataset.room;
        if (room === "Lager") goToLager();
        else if (room === "Gesteinsraum") jumpToGesteinsraum(); // Annahme: von Proberaum zum Gesteinsraum
        else if (room === "Mischraum") jumpToMischraum();
        else if (room === "Marshall") toMarshall();
    });
});

const progressSteps = document.querySelectorAll('#progressBar .step');
const unlockedRooms = new Set(['Lager']); // nur Lager ist anfangs sichtbar

// Initialanzeige: nur Lager
progressSteps.forEach(step => {
    if (!unlockedRooms.has(step.dataset.room)) {
        step.style.display = 'none';
    }
});

function unlockRoom(room) {
    if (!unlockedRooms.has(room)) {
        unlockedRooms.add(room);
        const step = document.querySelector(`.step[data-room="${room}"]`);
        if (step) step.style.display = 'block';
    }

    // Markiere besuchte Räume visuell
    progressSteps.forEach(step => {
        if (unlockedRooms.has(step.dataset.room)) {
            step.classList.add('visited');
        }
    });
}

// Auf Raumwechsel reagieren
window.addEventListener('roomChanged', (e) => {
    unlockRoom(e.detail);
});

// Beispiel: Raumwechselhaken setzen (in jeder View-Funktion einbauen)
window.addEventListener('roomChanged', (e) => {
    markVisited(e.detail);
});

let isDragging = false;
let mouseDownPos = new THREE.Vector2();

window.addEventListener('mousedown', (event) => {
    isDragging = false;
    mouseDownPos.set(event.clientX, event.clientY);
});

window.addEventListener('mousemove', (event) => {
    const dx = event.clientX - mouseDownPos.x;
    const dy = event.clientY - mouseDownPos.y;
    if (Math.sqrt(dx * dx + dy * dy) > 3) {
        isDragging = true;
    }
});

window.addEventListener('mouseup', (event) => {
    if (isDragging) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);

    for (let i = 0; i < intersects.length; i++) {
        const obj = intersects[i].object;

        // Wichtig: unsichtbare Marker ignorieren
        if (!obj.visible) continue;

        // Marker nur handeln, wenn explizit gekennzeichnet
        if (obj.userData?.isMarker && typeof obj.userData.onClick === 'function') {
            obj.userData.onClick();
            break;
        }
    }
});

export function getVisibleIntersects(raycaster, objects) {
    const visibleObjects = objects.filter(obj => obj.visible);
    return raycaster.intersectObjects(visibleObjects, false);
}

function startExperience() {
    const anleitung = document.getElementById("AnleitungContainer");
    const userInput = document.getElementById("userIdContainer");

    // Anleitung sanft ausblenden
    anleitung.classList.remove("fade-in");
    anleitung.classList.add("fade-out");

    // Nach der Übergangszeit (500ms), Anleitung ausblenden und Eingabe anzeigen
    setTimeout(() => {
        anleitung.style.display = "none";
        userInput.style.display = "block";
        userInput.classList.remove("fade-out");
        userInput.classList.add("fade-in");
    }, 500);
}

window.anleitung = startExperience;