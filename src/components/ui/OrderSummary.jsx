import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { TbDownload, TbCheck, TbPhoto } from "react-icons/tb";
import { supabase } from '../../config/supabaseClient';
import '../../styles/OrderSummary.css';

export default function OrderSummary({ 
  extFinish, 
  intFinish, 
  webglContextRef, 
  cameraPresets 
}) {
  const summaryRef = useRef(null);
  const pdfPage1Ref = useRef(null);
  const pdfPage2Ref = useRef(null);
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [configCode, setConfigCode] = useState('');
  
  const [screenshots, setScreenshots] = useState({
    external: null,
    internal: null,
    detail: null
  });

  // Genera un codice di configurazione casuale (stile Porsche: PT1VU844)
  useEffect(() => {
    setConfigCode('FIORE-' + Math.random().toString(36).substring(2, 8).toUpperCase());
  }, []);

  // --- 1. INTERSECTION OBSERVER ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setIsVisible(true);
        else setIsVisible(false);
      },
      { threshold: 0.1 } 
    );
    if (summaryRef.current) observer.observe(summaryRef.current);
    return () => { if (summaryRef.current) observer.unobserve(summaryRef.current); };
  }, []);

  // --- 2. CATTURA SCREENSHOTS 3D ---
  useEffect(() => {
    const handleCaptureScreenshots = async () => {
      if (!webglContextRef || !webglContextRef.current || !cameraPresets) return;
      setIsCapturing(true);
      await new Promise(resolve => setTimeout(resolve, 150)); 

      const { gl, scene, camera } = webglContextRef.current;
      const originalPos = camera.position.clone();
      const originalRot = camera.rotation.clone();
      const originalDpr = gl.getPixelRatio();

      gl.setPixelRatio(3); // Altissima risoluzione per il PDF

      const captureFrame = (positionArray, lookAtY = 0) => {
        camera.position.fromArray(positionArray);
        camera.lookAt(0, lookAtY, 0);
        gl.render(scene, camera);
        return gl.domElement.toDataURL('image/jpeg', 0.95);
      };

      try {
        const extImg = captureFrame(cameraPresets[0].position, 0);
        const intImg = captureFrame(cameraPresets[1].position, 0);
        const detImg = captureFrame([0.8, 1.2, 1.5], 1.0);

        setScreenshots({ external: extImg, internal: intImg, detail: detImg });
      } catch (error) {
        console.error("Errore cattura screen:", error);
      } finally {
        camera.position.copy(originalPos);
        camera.rotation.copy(originalRot);
        gl.setPixelRatio(originalDpr);
        gl.render(scene, camera);
        setIsCapturing(false);
      }
    };

    if (isVisible) handleCaptureScreenshots();
    else setScreenshots({ external: null, internal: null, detail: null });
    
  }, [isVisible, extFinish?.id, intFinish?.id]);

  // --- 3. GENERAZIONE PDF MULTIPAGINA PROFESSIONALE ---
  const handleDownloadPDF = async () => {
    if (!pdfPage1Ref.current || !pdfPage2Ref.current) return;
    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Opzioni per alta qualità
      const canvasOpts = { scale: 2, useCORS: true, backgroundColor: '#ffffff' };

      // Genera Pagina 1
      const canvas1 = await html2canvas(pdfPage1Ref.current, canvasOpts);
      pdf.addImage(canvas1.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, pdfWidth, pdfHeight);

      // Genera Pagina 2
      pdf.addPage();
      const canvas2 = await html2canvas(pdfPage2Ref.current, canvasOpts);
      pdf.addImage(canvas2.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, pdfWidth, pdfHeight);

      pdf.save(`Configurazione_${configCode}.pdf`);
    } catch (error) {
      console.error("Errore PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // --- 4. SALVATAGGIO DB ---
  const handleSaveConfiguration = async () => { /* Logica invariata */ };

  const PhotoBox = ({ src, label, isMain }) => (
    <div className={`photo-item ${isMain ? 'photo-main' : ''}`}>
      {src ? (
        <img src={src} alt={label} className="summary-image" crossOrigin="anonymous" />
      ) : (
        <div className="photo-placeholder">
          {isCapturing ? (
            <><div className="spinner spinner-sm"></div><span className="pulsing-text">Rendering {label}...</span></>
          ) : (
            <><TbPhoto size={36} className="placeholder-icon" /><span>In attesa...</span></>
          )}
        </div>
      )}
    </div>
  );

  const price = "€ 2.450,00";

  return (
    <>
      {/* =========================================
          UI VISIBILE SUL SITO
      ========================================= */}
      <div className="final-summary-section" id="order-summary" ref={summaryRef}>
        <div className="summary-left">
          <div className="photo-grid">
            <PhotoBox src={screenshots.external} label="Esterno" isMain={true} />
            <PhotoBox src={screenshots.internal} label="Interno" isMain={false} />
            <PhotoBox src={screenshots.detail} label="Dettaglio" isMain={false} />
          </div>
        </div>

        <div className="summary-right">
          <div className="summary-header">
            <span className="summary-eyebrow">Codice: {configCode}</span>
            <h2 className="brand-title">Nordic 01</h2>
          </div>

          <ul className="summary-list">
            <li><span className="summary-label">Esterno</span><span className="summary-value">{extFinish?.label || '-'}</span></li>
            <li><span className="summary-label">Interno</span><span className="summary-value">{intFinish?.label || '-'}</span></li>
            <li><span className="summary-label">Apertura</span><span className="summary-value">Destra</span></li>
            <li><span className="summary-label">Tipologia</span><span className="summary-value">Standard</span></li>
          </ul>

          <div className="total-price-box">
            <span className="price-label">Stima indicativa</span>
            <span className="price-value">{price}</span>
          </div>

          <div className="summary-actions" data-html2canvas-ignore="true">
            <button className="action-btn btn-secondary" onClick={handleDownloadPDF} disabled={isGeneratingPdf || !screenshots.external || isCapturing}>
              {isGeneratingPdf ? <div className="spinner spinner-sm"></div> : <><TbDownload size={20} />Scarica PDF</>}
            </button>
            <button className="action-btn btn-primary" onClick={handleSaveConfiguration} disabled={isSaving}>
              <TbCheck size={20} /> Richiedi Preventivo
            </button>
          </div>
        </div>
      </div>

      {/* =========================================
          TEMPLATE PDF NASCOSTO (A4 Sizing)
      ========================================= */}
      <div className="pdf-export-container">
        
        {/* PAGINA 1: Copertina e Vista Esterna */}
        <div className="pdf-page" ref={pdfPage1Ref}>
          <div className="pdf-header">
            <img src="/assets/logo_fiore_ebanisteria.png" alt="Logo" className="pdf-logo" />
            <div className="pdf-code">Codice Configurazione: <strong>{configCode}</strong></div>
          </div>
          
          <div className="pdf-hero">
            <h1 className="pdf-title">La tua configurazione di Nordic 01</h1>
            {screenshots.external && <img src={screenshots.external} alt="Esterno" className="pdf-hero-img" />}
          </div>

          <div className="pdf-summary-table">
            <div className="pdf-table-row pdf-table-header">
              <span>Riepilogo Costi</span>
              <span>Prezzo*</span>
            </div>
            <div className="pdf-table-row">
              <span>Modello Base Nordic 01</span>
              <span>€ 2.000,00</span>
            </div>
            <div className="pdf-table-row">
              <span>Optional & Finiture</span>
              <span>€ 450,00</span>
            </div>
            <div className="pdf-table-row pdf-total-row">
              <span>Prezzo Totale Stima</span>
              <span>{price}</span>
            </div>
            <p className="pdf-disclaimer">*IVA Inclusa. Le immagini visualizzate potrebbero non corrispondere completamente alla configurazione finale.</p>
          </div>
        </div>

        {/* PAGINA 2: Dettagli e Viste Interne */}
        <div className="pdf-page" ref={pdfPage2Ref}>
          <div className="pdf-header">
            <img src="/assets/logo_fiore_ebanisteria.png" alt="Logo" className="pdf-logo" />
            <div className="pdf-code">{configCode}</div>
          </div>

          <h2 className="pdf-section-title">Viste Dettagliate</h2>
          <div className="pdf-images-grid">
            <div className="pdf-img-box">
              {screenshots.internal && <img src={screenshots.internal} alt="Interno" />}
              <span className="pdf-img-label">Vista Interna</span>
            </div>
            <div className="pdf-img-box">
              {screenshots.detail && <img src={screenshots.detail} alt="Dettaglio" />}
              <span className="pdf-img-label">Dettaglio Materiali</span>
            </div>
          </div>

          <h2 className="pdf-section-title" style={{marginTop: '40px'}}>Specifiche Tecniche</h2>
          <div className="pdf-specs-table">
            <div className="pdf-spec-row">
              <span className="pdf-spec-cat">Esterno</span>
              <span className="pdf-spec-val">{extFinish?.label || 'Non selezionato'} ({extFinish?.category})</span>
            </div>
            <div className="pdf-spec-row">
              <span className="pdf-spec-cat">Interno</span>
              <span className="pdf-spec-val">{intFinish?.label || 'Non selezionato'} ({intFinish?.category})</span>
            </div>
            <div className="pdf-spec-row">
              <span className="pdf-spec-cat">Apertura</span>
              <span className="pdf-spec-val">Spinta a Destra</span>
            </div>
            <div className="pdf-spec-row">
              <span className="pdf-spec-cat">Tipologia Costruttiva</span>
              <span className="pdf-spec-val">Standard - Singola Anta</span>
            </div>
          </div>
          
          <div className="pdf-footer">
            <p>Fiore Ebanisteria - Documento generato automaticamente il {new Date().toLocaleDateString('it-IT')}</p>
          </div>
        </div>

      </div>
    </>
  );
}