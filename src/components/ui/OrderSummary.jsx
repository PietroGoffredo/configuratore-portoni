import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { TbDownload, TbCheck, TbPhoto } from "react-icons/tb";
import '../../styles/OrderSummary.css';

export default function OrderSummary({ 
  extFinish, 
  intFinish, 
  webglContextRef, 
  cameraPresets 
}) {
  const summaryRef = useRef(null);
  
  // Stati per la gestione del PDF e della cattura
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Stato per salvare le immagini (svuotato per risparmiare memoria)
  const [screenshots, setScreenshots] = useState({
    external: null,
    internal: null,
    detail: null
  });

  // --- 1. INTERSECTION OBSERVER (Lazy Loading & Memory Clear) ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        // Se almeno il 10% della sezione riepilogo è visibile
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      { threshold: 0.1 } 
    );

    if (summaryRef.current) {
      observer.observe(summaryRef.current);
    }

    return () => {
      if (summaryRef.current) observer.unobserve(summaryRef.current);
    };
  }, []);

  // --- 2. LOGICA CATTURA SCREENSHOTS AUTOMATICA ---
  // Si attiva solo se il componente è visibile E se cambiano le finiture
  useEffect(() => {
    const handleCaptureScreenshots = async () => {
      if (!webglContextRef || !webglContextRef.current || !cameraPresets) return;
      
      setIsCapturing(true);
      // Breve attesa per permettere alla UI di renderizzare lo stato di caricamento
      await new Promise(resolve => setTimeout(resolve, 150)); 

      const { gl, scene, camera } = webglContextRef.current;

      const originalPos = camera.position.clone();
      const originalRot = camera.rotation.clone();
      const originalDpr = gl.getPixelRatio();

      // Alta risoluzione per il PDF
      gl.setPixelRatio(2.5);

      const captureFrame = (positionArray, lookAtY = 0) => {
        camera.position.fromArray(positionArray);
        camera.lookAt(0, lookAtY, 0);
        gl.render(scene, camera);
        return gl.domElement.toDataURL('image/jpeg', 0.9);
      };

      try {
        const extImg = captureFrame(cameraPresets[0].position, 0);
        const intImg = captureFrame(cameraPresets[1].position, 0);
        const detImg = captureFrame([0.8, 1.2, 1.5], 1.0);

        setScreenshots({
          external: extImg,
          internal: intImg,
          detail: detImg
        });
      } catch (error) {
        console.error("Errore durante la cattura degli screen:", error);
      } finally {
        camera.position.copy(originalPos);
        camera.rotation.copy(originalRot);
        gl.setPixelRatio(originalDpr);
        gl.render(scene, camera);
        setIsCapturing(false);
      }
    };

    if (isVisible) {
      // Se visibile, scatta le foto (reagisce in tempo reale ai cambi di extFinish/intFinish)
      handleCaptureScreenshots();
    } else {
      // Se NON visibile, puliamo la memoria (Garbage Collection)
      setScreenshots({ external: null, internal: null, detail: null });
    }
    
    // Dipendenze: si riattiva quando si entra nella sezione o quando le finiture cambiano
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, extFinish?.id, intFinish?.id]);


  // --- 3. LOGICA GENERAZIONE PDF ---
  const handleDownloadPDF = async () => {
    if (!summaryRef.current) return;
    
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(summaryRef.current, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Configurazione_Nordic_01.pdf');
      
    } catch (error) {
      console.error("Errore durante la generazione del PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // --- COMPONENTE FOTO RIPETIBILE ---
  const PhotoBox = ({ src, label, isMain }) => (
    <div className={`photo-item ${isMain ? 'photo-main' : ''}`}>
      {src ? (
        <img src={src} alt={`Rendering ${label}`} className="summary-image" crossOrigin="anonymous" />
      ) : (
        <div className="photo-placeholder">
          {isCapturing ? (
            <>
              <div className="spinner spinner-sm"></div>
              <span className="pulsing-text">Generazione {label}...</span>
            </>
          ) : (
            <>
              <TbPhoto size={36} className="placeholder-icon" />
              <span>In attesa...</span>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="final-summary-section" id="order-summary" ref={summaryRef}>
      
      {/* --- SEZIONE SINISTRA: FOTO --- */}
      <div className="summary-left">
        <div className="photo-grid">
          <PhotoBox src={screenshots.external} label="Esterno" isMain={true} />
          <PhotoBox src={screenshots.internal} label="Interno" isMain={false} />
          <PhotoBox src={screenshots.detail} label="Dettaglio" isMain={false} />
        </div>
      </div>

      {/* --- SEZIONE DESTRA: DATI E AZIONI --- */}
      <div className="summary-right">
        
        <div className="summary-header">
          <span className="summary-eyebrow">Riepilogo Configurazione</span>
          <h2 className="brand-title">Nordic 01</h2>
        </div>

        <ul className="summary-list">
          <li>
            <span className="summary-label">Rivestimento Esterno</span>
            <span className="summary-value">{extFinish?.label || 'Non selezionato'}</span>
          </li>
          <li>
            <span className="summary-label">Rivestimento Interno</span>
            <span className="summary-value">{intFinish?.label || 'Non selezionato'}</span>
          </li>
          <li>
            <span className="summary-label">Senso di Apertura</span>
            <span className="summary-value">Spinta a Destra</span>
          </li>
          <li>
            <span className="summary-label">Tipologia</span>
            <span className="summary-value">Standard (Solo porta)</span>
          </li>
        </ul>

        <div className="total-price-box">
          <span className="price-label">Stima indicativa</span>
          <span className="price-value">€ 2.450,00</span>
        </div>

        {/* --- BOTTONI (Ignorati nel PDF) --- */}
        <div className="summary-actions" data-html2canvas-ignore="true">
          <button 
            className="action-btn btn-secondary" 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf || !screenshots.external || isCapturing}
          >
            {isGeneratingPdf ? (
              <div className="spinner spinner-sm"></div>
            ) : (
              <>
                <TbDownload size={20} />
                Scarica PDF
              </>
            )}
          </button>
          
          <button className="action-btn btn-primary">
            <TbCheck size={20} />
            Richiedi Preventivo
          </button>
        </div>

      </div>
    </div>
  );
}