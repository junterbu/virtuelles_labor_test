import * as THREE from "three";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getUserData } from "./main.js"; // Falls noch nicht importiert
import { sendQuizAnswer } from "./main.js";
import { getUserQuizFragen, getUserBeantworteteFragen } from "./main.js";

// Firestore-Instanz holen
const db = window.firebaseDB;



// Funktion zum Erstellen eines Markers
function createMarker(h, b, pxx, pxz, text, x, y, z, r) {
    const geometry = new THREE.PlaneGeometry(b, h);
    const material = new THREE.MeshStandardMaterial({ color: 0xbebdb8, side: THREE.DoubleSide });

    // Canvas für den Text
    const canvas = document.createElement('canvas');
    canvas.width = pxx;
    canvas.height = pxz;
    const context = canvas.getContext('2d');
    context.font = '50px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    material.map = new THREE.CanvasTexture(canvas);
    const marker = new THREE.Mesh(geometry, material);
    marker.rotation.y = Math.PI*r;
    marker.position.set(x, y, z);

    return marker;
}

export const proberaumlagerMarker = createMarker(0.5, 1, 256, 128, "zum Lager", 4, 1.5, -10, 1);
export const lagerMarker = createMarker(1, 2, 256, 128, "Start", -12, 10, 4, 0);
// export const proberaumMarker = createMarker(1, 2, 256, 128, "Proberaum", 6.3, 10, -15, 0);
export const leavelagerMarker = createMarker(0.5, 2, 512, 128, "zur Übersicht", -12.5, 1.5, -2, 0);
export const leaveproberaumMarker = createMarker(0.5, 2, 512, 128, "zur Übersicht", 2, 1.5, -10, 1);
export const lagerproberaumMarker = createMarker(0.5, 2, 512, 128, "zum Gesteinsraum", -12.5, 1.5, 8, 1);
export const toMischraumMarker = createMarker(0.5, 1.5, 384, 128, "zum Mischer", 6, 1.5, -10, 1);
export const leaveMischraum = createMarker(0.5, 1.5, 512, 128, "zur Übersicht", -3, 1.5, 6, 1.5);
export const toMarshallMarker = createMarker(0.5, 1, 640, 128, "zum Marshall-Verdichter", -8, 2, 4.5, 2)
export const leaveMarshall = createMarker(0.5, 1.5, 512, 128, "zur Übersicht", -3, 1.5, 3, 1.5);
// export let totalProzentMesh = createMarker(1, 0.5, 256, 128, "Total: 0%", 8, 2, -16.75, -2);

export let markers = [lagerMarker, leaveproberaumMarker, proberaumlagerMarker, lagerproberaumMarker, leavelagerMarker, leaveMischraum, toMarshallMarker, leaveMarshall];  // Die Marker-Objekte
export let activeMarkers = [lagerMarker, leaveproberaumMarker, proberaumlagerMarker, lagerproberaumMarker, leavelagerMarker, leaveMischraum, toMarshallMarker, leaveMarshall];  // Die aktiven Marker (wird leer sein, wenn in einem Viewpoint)

lagerproberaumMarker.visible = false;
toMarshallMarker.visible = false;

export let quizPunkte = 0;
export const quizFragen = {
    "Gesteinsraum": {
        frage: "Welche Aussage zur CE-Kennzeichnung von Asphaltmischgut ist korrekt?",
        optionen: ["Sie garantiert eine hohe Qualität des Produkts", "Sie zeigt an, dass gesetzliche Vorschriften eingehalten wurden", "Sie ist nur für importierte Baustoffe erforderlich", "Sie wird nur auf Wunsch des Herstellers vergeben"],
        antwort: "Sie zeigt an, dass gesetzliche Vorschriften eingehalten wurden",
        punkte: 10
    },
    "Mischer": {
        frage: "Warum ist eine Typprüfung von Asphaltmischgut notwendig?",
        optionen: ["Um den richtigen Mischguttyp für eine Baustelle zu ermitteln", "Um die normgemäßen Anforderungen an das Mischgut zu überprüfen", "Um die optimale Temperatur für das Mischen festzulegen", "Um den Recyclinganteil im Asphalt zu bestimmen"],
        antwort: "Um die normgemäßen Anforderungen an das Mischgut zu überprüfen",
        punkte: 10
    },
    "Marshall": {
        frage: "Wie wird der optimale Bindemittelgehalt eines Asphaltmischguts ermittelt?",
        optionen: ["Durch eine rechnerische Ableitung der Sieblinie", "Durch Erhitzen des Mischguts auf eine festgelegte Temperatur", "Durch Erstellen einer Polynomfunktion und Finden des Maximums der Raumdichten", "Durch Zugabe von Bindemittel in 1%-Schritten und Sichtprüfung"],
        antwort: "Durch Erstellen einer Polynomfunktion und Finden des Maximums der Raumdichten",
        punkte: 10
    },
    "Rohdichte": {
        frage: "Mit welchem volumetrischen Kennwert wird die maximale Dichte eines Asphaltmischguts ohne Hohlräume beschrieben?",
        optionen: ["Raumdichte", "Rohdichte", "Schüttdichte", "lose Dichte"],
        antwort: "Rohdichte",
        punkte: 10
    },
    "Pyknometer": {
        frage: "Wofür steht die Masse m_2 im Volumetrischen Verfahren zur Ermittlung der Rohdichte nach ÖNORM EN 12697-8?",
        optionen: ["Masse des Pyknometers mit Aufsatz, Feder und Laborprobe", "Masse des Pyknometers mit Aufsatz, Feder, Laborprobe und Wasser", "Masse des Pyknometers mit Aufsatz und Feder", "Volumen des Pyknometers bei Füllung bis zur Messmarke"],
        antwort: "Masse des Pyknometers mit Aufsatz, Feder und Laborprobe",
        punkte: 10
    },
    "Hohlraumgehalt": {
        frage: "Ab wie viel % Hohlraumgehalt ist Verfahren D: Raumdichte durch Ausmessen der ÖNORM EN 12697-6 empfohlen?",
        optionen: ["Ab 1%", "Ab 10%", "Ab 7%", "Ab 23%"],
        antwort: "Ab 10%",
        punkte: 10
    },
    "ÖNORM EN 12697-8": {
        frage: "Wie wird der Hohlraumgehalt eines Probekörpers nach ÖNORM EN 12697-8 ermittelt?",
        optionen: ["Aus der Differenz von Raumdichte und Rohdichte", "Aus der Raumdichte und den Abmessungen", "Aus der Rohdichte und den Abmessungen", "Aus den Abmessungen und dem Volumen"],
        antwort: "Aus der Differenz von Raumdichte und Rohdichte",
        punkte: 10 
    },
    "NaBe": {
        frage: "Wie viele Recyclingasphalt muss ein Asphaltmischgut gemäß „Aktionsplan nachhaltige öffentlichen Beschaffung (naBe)“ mindestens enthalten?",
        optionen: ["0M%", "10M%", "20M%", "30M%"],
        antwort: "10M%",
        punkte: 10 
    },
    "WPK": {
        frage: "Wozu dient die Werkseigene Produktionskontrolle (WPK)?",
        optionen: ["Zur Qualitätssicherung während der Produktion in Eigenüberwachung", "Zur Sicherstellung eines wirtschaftlichen Produktionsablaufs", "Zur Maximierung des Produktionsvolumens", "Zur Qualitätssicherung nach dem Einbau"],
        antwort: "Zur Qualitätssicherung während der Produktion in Eigenüberwachung",
        punkte: 10
    },
    "Grenzsieblinien": {
        frage: "Wo findet man Grenzsieblinien von Asphaltmischgütern?",
        optionen: ["In den Produktanforderungen für Asphaltmischgut (ÖNORM B 358x-x)", "In den Produktanforderungen für Gesteinskörnungen (ÖNORM B 3130)", "In den Richtlinien für Anforderungen an Asphaltschichten (RVS 08.16.01)", "In der Richtlinie für die Ausführung (RVS 08.07.03)"],
        antwort: "In den Produktanforderungen für Asphaltmischgut (ÖNORM B 358x-x)",
        punkte: 10
    },
    "Raumdichte": {
        frage: "Welche Verfahren zur Bestimmung der Raumdichte von Asphaltprobekörpern nach ÖNORM EN 12697-6 sind für dichte Probekörper bis etwa 7% Hohlraumgehalt geeignet?",
        optionen: ["Verfahren A: Raumdichte — trocken und Verfahren B: Raumdichte — SSD ", "Nur Verfahren B: Raumdichte — SSD ", "Nur Verfahren A: Raumdichte — trocken", "Verfahren C: Raumdichte — umhüllter Probekörper und Verfahren D: Raumdichte durch Ausmessen"],
        antwort: "Verfahren A: Raumdichte — trocken und Verfahren B: Raumdichte — SSD ",
        punkte: 10
    }
};

async function getDatabase() {
    while (!window.firebaseDB) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Warten, bis Firebase geladen ist
    }
    return window.firebaseDB;
}

// Lade gespeicherte User-ID oder zeige das Eingabefeld
let userId = localStorage.getItem("userId");

if (!userId) {
    document.getElementById("userIdContainer").style.display = "block"; // Eingabe anzeigen
}

function setUserId() {
    const userId = document.getElementById("userIdInput").value.trim();

    if (userId === "") {
        alert("Bitte eine gültige Matrikelnummer eingeben.");
        return;
    }

    localStorage.setItem("userId", userId);
    document.getElementById("userIdContainer").style.display = "none"; // Eingabemaske ausblenden
}

let beantworteteRäume = new Set();

export async function zeigeQuiz(raum) {
    return new Promise(async (resolve) => {
        const userId = localStorage.getItem("userId");
        if (!userId) {
            alert("Bitte zuerst eine Matrikelnummer eingeben.");
            document.getElementById("userIdContainer").style.display = "block";
            resolve();
            return;
        }

        const nutzerFragen = await getUserQuizFragen(userId);
        const beantworteteFragen = await getUserBeantworteteFragen(userId);

        if (!nutzerFragen.includes(raum) || beantworteteFragen.includes(raum)) {
            resolve();
            return;
        }

        if (quizFragen[raum]) {
            document.getElementById("quizFrage").innerText = quizFragen[raum].frage;
            const optionenContainer = document.getElementById("quizOptionen");
            optionenContainer.innerHTML = "";

            quizFragen[raum].optionen.forEach(option => {
                const button = document.createElement("button");
                button.innerText = option;
                button.classList.add("quiz-option");

                button.addEventListener("click", async () => {
                    await sendQuizAnswer(userId, raum, option);
                    schließeQuiz();
                    resolve();
                });

                optionenContainer.appendChild(button);
            });

            document.getElementById("quizContainer").style.display = "block";
        }
    });
}


export async function speicherePunkte(raum, auswahl) {
    userId = localStorage.getItem("userId");

    if (!userId) return;

    const docRef = doc(db, "quizErgebnisse", userId);
    const docSnap = await getDoc(docRef);

    let quizPunkteNeu = 0;
    let beantworteteRäume = [];

    if (docSnap.exists()) {
        beantworteteRäume = docSnap.data().beantworteteRäume;
        quizPunkteNeu = docSnap.data().punkte;
    }

    if (!beantworteteRäume.includes(raum)) {
        if (quizFragen[raum].antwort === auswahl) {
            quizPunkteNeu += quizFragen[raum].punkte;
        }
        beantworteteRäume.push(raum);
    }

    await setDoc(docRef, {
        punkte: quizPunkteNeu,
        beantworteteRäume: beantworteteRäume
    });

}

function schließeQuiz() {
    document.getElementById("quizContainer").style.display = "none";
}

window.setUserId = setUserId;

// // Marker für den Proberaum zum Lagerraum
// let proberaumlagerMarkerGeometry = new THREE.PlaneGeometry(1, 0.5);
// let proberaumlagerMarkerMaterial = new THREE.MeshStandardMaterial({ color: 0xbebdb8 ,side: THREE.DoubleSide })  

// // Text Canvas erstellen
// let canvas_Probe_Lager = document.createElement('canvas');
// canvas_Probe_Lager.width = 256;  // Breite des Canvas
// canvas_Probe_Lager.height = 128;  // Höhe des Canvas
// let context_Probe_Lager = canvas_Probe_Lager.getContext('2d');
// context_Probe_Lager.font = '50px Arial';
// context_Probe_Lager.fillStyle = 'white';

// // Textausrichtung und Basislinie setzen, um Text zu zentrieren
// context_Probe_Lager.textAlign = 'center';  // Horizontal zentriert
// context_Probe_Lager.textBaseline = 'middle';  // Vertikal zentriert

// context_Probe_Lager.fillText("zum Lager", canvas_Probe_Lager.width / 2, canvas_Probe_Lager.height / 2);  // Text

// let texture_Probe_Lager = new THREE.CanvasTexture(canvas_Probe_Lager);
// proberaumlagerMarkerMaterial.map = texture_Probe_Lager;

// let proberaumlagerMarker = new THREE.Mesh(proberaumlagerMarkerGeometry, proberaumlagerMarkerMaterial);
// proberaumlagerMarker.rotation.y = Math.PI;
// proberaumlagerMarker.position.set(4, 1.5, -10);  // Setze den Marker an die gewünschte Position im Proberaum
// scene.add(proberaumlagerMarker);