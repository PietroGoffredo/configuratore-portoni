import { useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import CryptoJS from 'crypto-js';

const _A1 = "Fiore_Eb";
const _A2 = "anis";
const _B1 = "teria_Su";
const _B2 = "per_";
const _C1 = "Sec";
const _C2 = "ret_2024!";

// --- LA MAGIA: CACHE GLOBALE ---
// Questa memoria salva i file già decriptati. Evita che il browser
// faccia lo schermo bianco o ricalcoli l'algoritmo al cambio di vista o durante le foto.
const decryptedCache = new Map();

export function useEncryptedGLTF(url) {
  // Se l'URL è già in cache, partiamo subito carichi, zero caricamenti!
  const [decryptedUrl, setDecryptedUrl] = useState(decryptedCache.get(url) || null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Se non c'è url o l'abbiamo già decriptato nella cache, fermati.
    if (!url || decryptedCache.has(url)) return;
    
    let isMounted = true;

    async function decryptFile() {
      try {
        const host = window.location.hostname;
        const trusted = [
          'localhost', 
          '127.0.0.1', 
          'fiorebanisteria.com', 
          'www.fiorebanisteria.com',
          'fiorebianisteria-configuratore.vercel.app' // <-- AGGIUNGI QUESTO
        ];
        if (!trusted.some(d => host.includes(d))) throw new Error("Security Violation");

        const response = await fetch(url);
        if (!response.ok) throw new Error("Resource not found");
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) throw new Error("Invalid format");

        const encryptedData = await response.text();
        const _K = _A1 + _A2 + _B1 + _B2 + _C1 + _C2;

        const bytes = CryptoJS.AES.decrypt(encryptedData, _K);
        const base64Data = bytes.toString(CryptoJS.enc.Utf8);
        if (!base64Data) throw new Error("Decryption failure");

        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytesArray = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytesArray[i] = binaryString.charCodeAt(i);

        const blob = new Blob([bytesArray], { type: 'model/gltf-binary' });
        const blobUrl = URL.createObjectURL(blob);
        
        // SALVIAMO NELLA CACHE GLOBALE
        decryptedCache.set(url, blobUrl);
        
        if (isMounted) setDecryptedUrl(blobUrl);

        bytesArray.fill(0); 
        let _cleaner = base64Data;
        _cleaner = null;

      } catch (e) {
        console.error("⛔ Security Block:", e.message);
        if (isMounted) setError(true);
      }
    }

    decryptFile();

    return () => {
      isMounted = false;
    };
  }, [url]);

  const tempUrl = useEmptyGLTF(); 
  const gltf = useGLTF(decryptedUrl || tempUrl);

  if (error || !decryptedUrl) return { scene: null, nodes: {}, materials: {} };
  return gltf;
}

// --- FUNZIONE DI PRELOAD SICURA ---
// Questa funzione viene chiamata per decriptare i file in background all'avvio dell'app
export async function preloadEncryptedGLTF(url) {
    if (decryptedCache.has(url)) return; // Già pronto

    try {
        const response = await fetch(url);
        if (!response.ok) return;
        const encryptedData = await response.text();
        const _K = _A1 + _A2 + _B1 + _B2 + _C1 + _C2;
        
        const bytes = CryptoJS.AES.decrypt(encryptedData, _K);
        const base64Data = bytes.toString(CryptoJS.enc.Utf8);
        if (!base64Data) return;

        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytesArray = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytesArray[i] = binaryString.charCodeAt(i);

        const blob = new Blob([bytesArray], { type: 'model/gltf-binary' });
        const blobUrl = URL.createObjectURL(blob);
        
        decryptedCache.set(url, blobUrl);
        useGLTF.preload(blobUrl); // Diciamo a Three.js di prepararlo in memoria video
        
        bytesArray.fill(0);
    } catch (e) {
        console.warn("Preload saltato per:", url);
    }
}

let _cachedEmpty = null;
function useEmptyGLTF() {
    if (!_cachedEmpty) {
        const empty = JSON.stringify({ asset: { version: "2.0" }, scenes: [{ nodes: [] }], nodes: [] });
        const blob = new Blob([empty], { type: 'application/json' });
        _cachedEmpty = URL.createObjectURL(blob);
    }
    return _cachedEmpty;
}