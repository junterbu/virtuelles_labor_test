# 📌 Laborpraktikum – Webbasierte 3D-Ansicht mit AR-Unterstützung

Dies ist ein interaktives Laborpraktikum mit einer webbasierten 3D-Ansicht, die mit **Three.js** umgesetzt wurde. Das Projekt unterstützt verschiedene Ansichten und beinhaltet eine AR-Funktionalität für mobile Geräte.

## 📂 Projektstruktur

```
📦 Dein-Projekt
├── 📜 index.html        # Hauptseite mit UI-Elementen, Three.js-Integration und Steuerung
├── 📜 main.js           # Zentrale Steuerlogik
├── 📜 Allgemeines.js    # Enthält allgemeine Funktionen und Szene-Konfigurationen
├── 📜 Marker.js         # Verwaltung von Markern für Navigation
├── 📜 View_functions.js # Funktionen für den Wechsel zwischen Ansichten
├── 📜 Lager.js          # Logik für den Lagerraum
├── 📜 Gesteinsraum.js   # Steuerung der Gesteinsproben im 3D-Raum
├── 📜 Mischraum.js      # Funktionen für den Mischraum
├── 📜 Marshall.js       # Marshall-Test Implementierung
├── 📜 Excel.js          # Export-/Verarbeitung von Daten mit Excel
└── 📂 assets/           # Modelle und zusätzliche Ressourcen
```

##  Funktionen

 **3D-Ansicht mit Three.js** – Darstellung interaktiver Räume  
 **Navigation zwischen Räumen** – Wechsel zwischen Lager, Mischraum & Marshall-Test  
 **UI-Elemente für Interaktion** – Schieberegler für Parametersteuerung  
 **AR-Unterstützung** – Wechsel in Augmented Reality (nur für mobile Geräte)  
 **Datenexport** – Speichern von Messergebnissen als Excel/PDF  

##  Installation & Nutzung

###  Nutzung über **GitHub Pages** (Empfohlen)
Das Projekt ist direkt über **GitHub Pages** erreichbar. Öffne einfach den folgenden Link in deinem Browser:

👉 **[https://junterbu.github.io/virtuelles_labor/](#)** 

###  Lokale Nutzung (Optional)
Falls du das Projekt lokal testen möchtest, kannst du es über einen lokalen Server ausführen:

```sh
npx http-server
```

Oder mit Python:

```sh
python -m http.server
```

Anschließend kannst du die **index.html** in einem Browser öffnen.

##  Wichtige Abhängigkeiten

- [Three.js](https://threejs.org/) – 3D-Darstellung
- [Chart.js](https://www.chartjs.org/) – Diagramme für Datenvisualisierung
- [nerdamer](http://nerdamer.com/) – Mathematische Berechnungen
- [jsPDF](https://github.com/parallax/jsPDF) – Export als PDF
- [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) – Tabellen in PDFs

##  Datenschutz & Urheberrecht

Diese Website sowie alle enthaltenen Dateien und Skripte wurden von **Jan Unterbuchschachner** erstellt.  
Jegliche Nutzung oder Vervielfältigung ohne vorherige Zustimmung ist nicht gestattet.

 **Erhobene Daten:**  
Das Projekt speichert keine personenbezogenen Daten oder nutzt Tracking-Technologien.

 **Externe Ressourcen:**  
Einige externe Bibliotheken (z. B. Three.js, Chart.js) werden über CDNs geladen. Bitte beachte deren Datenschutzrichtlinien.

Falls Fragen zum Datenschutz bestehen, kannst du mich jederzeit kontaktieren.

##  Kontakt

Falls Fragen oder Probleme auftauchen, gerne ein **Issue auf GitHub erstellen** oder mich kontaktieren! 🎯
