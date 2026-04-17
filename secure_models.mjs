import fs from 'fs';
import path from 'path';
import gltfPipeline from 'gltf-pipeline';
import CryptoJS from 'crypto-js';

// CORREZIONE: Usiamo processGlb invece di processGltf per leggere i file binari .glb
const processGlb = gltfPipeline.processGlb; 

// --- LA TUA CHIAVE SEGRETA ---
const SECRET_KEY = "Fiore_Ebanisteria_Super_Secret_2024!"; 

const INPUT_DIR = './modelli_da_criptare'; 
const OUTPUT_DIR = './public/models/nordic_secure'; 

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function secureModels() {
    const files = fs.readdirSync(INPUT_DIR).filter(file => file.endsWith('.glb'));

    if (files.length === 0) {
        console.log("⚠️ Nessun file .glb trovato in", INPUT_DIR);
        return;
    }

    for (const file of files) {
        const inputPath = path.join(INPUT_DIR, file);
        const outputFileName = file.replace('.glb', '.enc');
        const outputPath = path.join(OUTPUT_DIR, outputFileName);

        console.log(`\n🔒 Elaborazione: ${file}...`);

        try {
            // 1. Legge il file originale .glb
            const glbBuffer = fs.readFileSync(inputPath);

            // 2. Compressione DRACO (ora usando processGlb)
            console.log("   -> Compressione Draco in corso...");
            const results = await processGlb(glbBuffer, {
                dracoOptions: { compressionLevel: 7 }
            });

            // 3. Conversione del buffer compresso in Base64
            const base64Data = results.glb.toString('base64');

            // 4. Crittografia AES-256
            console.log("   -> Crittografia AES-256 in corso...");
            const encryptedData = CryptoJS.AES.encrypt(base64Data, SECRET_KEY).toString();

            // 5. Salvataggio del file .enc
            fs.writeFileSync(outputPath, encryptedData);
            
            console.log(`✅ Fatto! Salvato come: ${outputFileName}`);

        } catch (error) {
            console.error(`❌ Errore con ${file}:`, error);
        }
    }
    console.log("\n🎉 Tutti i modelli sono stati blindati con successo!");
}

secureModels();