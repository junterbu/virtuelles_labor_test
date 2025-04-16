const fs = require('fs');
const path = require('path');
const { NodeIO } = require('@gltf-transform/core');
const { dedup, draco, weld, simplify, prune, join, instance, flatten, sparse } = require('@gltf-transform/functions');
const { KHRONOS_EXTENSIONS } = require('@gltf-transform/extensions');
const MeshoptDecoder = require('meshoptimizer').MeshoptDecoder;
const MeshoptEncoder = require('meshoptimizer').MeshoptEncoder;
const MeshoptSimplifier = require('meshoptimizer').MeshoptSimplifier;
const { textureCompress } = require('@gltf-transform/functions');
const { sharp } = require('sharp');
const { KHRDracoMeshCompression, KHRMaterialsClearcoat, KHRMaterialsTransmission, KHRMaterialsSpecular, EXTTextureWebP } = require('@gltf-transform/extensions');
const {draco3d} = require("draco3dgltf");
const { KHRMaterialsPBRSpecularGlossiness } = require('@gltf-transform/extensions');

/**
 * Findet alle Nodes, deren Name ein bestimmtes Muster enthält.
 * @param {Document} document - Das GLB-Dokument.
 * @param {string} pattern - Das Muster, nach dem gesucht werden soll.
 * @returns {Array} - Liste der gefundenen Nodes.
 */
function findNodesByNamePattern(document, pattern) {
    const root = document.getRoot();
    return root.listNodes().filter(node => node.getName() && node.getName().includes(pattern));
}

async function optimizeGLB(inputFile, outputFile, options = {}) {
    const io = new NodeIO()
        .registerExtensions([KHRDracoMeshCompression, KHRMaterialsPBRSpecularGlossiness, KHRMaterialsClearcoat, KHRMaterialsTransmission, KHRMaterialsSpecular, EXTTextureWebP])
        .registerDependencies({
            'draco3d.decoder': await require('draco3dgltf').createDecoderModule(),
            'draco3d.encoder': await require('draco3dgltf').createEncoderModule(),
            'meshopt.decoder': MeshoptDecoder,
            'meshopt.encoder': MeshoptEncoder // Falls du Encoder-Funktionen nutzt
        });
    
    try {
        const document = await io.read(inputFile);
        console.log('Dokument erfolgreich geladen:', document);

        // Alle Nodes finden, deren Name "Eimer" enthält
        const bucketNodes = findNodesByNamePattern(document, 'Cylinder');
        console.log('Gefundene Eimer-Nodes:', bucketNodes.map(node => node.getName()));

        // Den MixButton finden
        const mixButtonNodes = findNodesByNamePattern(document, 'MixButton');
        console.log('Gefundene MixButton-Nodes:', mixButtonNodes.map(node => node.getName()));

        // Beide Gruppen zusammenführen
        const protectedNodes = [...bucketNodes, ...mixButtonNodes];

        // Geschützte Nodes in einer separaten Szene isolieren
        const root = document.getRoot();
        const scene = root.listScenes()[0]; // Standard-Szene holen
        if (!scene) {
            throw new Error('Keine Szene im GLB gefunden!');
        }

        const protectedGroup = document.createNode('ProtectedGroup');
        protectedNodes.forEach(node => {
            protectedGroup.addChild(node);
        });
        scene.addChild(protectedGroup);

        // Überprüfe Nodes auf Meshes
        const allNodes = document.getRoot().listNodes();
        allNodes.forEach(node => {
            if (!node.getMesh()) {
                console.warn(`Node ohne Mesh: ${node.getName()}`);
            }
        });

        protectedNodes.forEach(node => {
            node.setTranslation([node.getTranslation()]);
            node.setRotation([node.getRotation()]);
            node.setScale([node.getScale()]);
        });

        protectedNodes.forEach(node => {
            scene.removeChild(node);
        });
       
        // Optimierung anwenden (ProtectedGroup bleibt unberührt)
        console.log('Optimiere Datei...');
        await document.transform(
            dedup(),
            instance({min: 5}),
            flatten(),
            // join(),
            // weld({ tolerance: options.weldTolerance }),
            prune(),
            simplify({
                 simplifier: MeshoptSimplifier,
                ratio: 0.0,
                error: 0.001,
                lockBorder: true,
            }),
            // sparse({ ratio: 0.2 }),
            textureCompress({
                encoder: sharp,
                targetFormat: 'webp',
                resize: [1024, 1024],
            }),
            draco(),
        );

        // Geschützte Nodes zurück in die Szene verschieben
        protectedGroup.listChildren().forEach(node => {
            scene.addChild(node);
        });

        scene.removeChild(protectedGroup);
        // Optimierte Datei speichern
        await io.write(outputFile, document);
        console.log(`Optimierte Datei wurde gespeichert: ${outputFile}`);
    } catch (error) {
        console.error('Fehler bei der Optimierung:', error.message);
    }
}

// Skript-Eingaben
const inputFilePath = process.argv[2];
const outputFilePath = process.argv[3] || inputFilePath.replace('.glb', '_optimized.glb');

if (!inputFilePath) {
    console.error('Bitte eine Eingabedatei angeben! Nutzung: node optimize.js input.glb [output.glb]');
    process.exit(1);
}

const options = {
    weldTolerance: 0.0001,
};

optimizeGLB(inputFilePath, outputFilePath, options);