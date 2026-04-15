// src/views/PortalHomeView.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TbArrowRight, TbDownload, TbEye, TbX } from "react-icons/tb";
import '../styles/PortalHomeView.css';

const MODELS = [
  {
    id: '01', name: 'Modello 01',
    description: 'Rivestimento esterno in HPL tinta unita con incisioni orizzontali. Caratterizzato da pomolo quadro cromo satinato e defender modello minimal.',
    image: '/assets/nordic-01.jpg' 
  },
  {
    id: '02', name: 'Modello 02',
    description: 'Incisioni orizzontali e verticali con elegante maniglione pressopiegato incassato e illuminazione led integrata.',
    image: '/assets/nordic-02.jpg' 
  },
  {
    id: '03', name: 'Modello 03',
    description: 'Design distintivo con maniglione pressopiegato a rilievo dotato di led. Rivestimento in HPL e defender minimal.',
    image: '/assets/nordic-03.jpg'
  },
  {
    id: '04', name: 'Modello 04',
    description: 'Inserto in vetro camera satinato per un perfetto connubio di luce e materia, con maniglione in acciaio inox aisi 316.',
    image: '/assets/nordic-04.jpg'
  },
  {
    id: '05', name: 'Modello 05',
    description: 'Contrasto materico ricercato con fascia verticale in HPL effetto pietra e fasce orizzontali HPL effetto legno.',
    image: '/assets/nordic-05.jpg'
  },
  {
    id: '06', name: 'Modello 06',
    description: 'Design esclusivo bubble con maniglione in leccio finitura bronzo, progettato per illuminare e valorizzare la bellezza della porta.',
    image: '/assets/nordic-06.jpg'
  }
];

export default function PortalHomeView() {
  const navigate = useNavigate();
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const handleConfigure = (modelId = '') => {
    const url = modelId ? `/configuratore?model=${modelId}` : '/configuratore';
    navigate(url);
  };

  // --- SCROLL FLUIDO CORRETTO PER IL CONTENITORE PRINCIPALE ---
  const scrollToModels = () => {
    // Recuperiamo il contenitore effettivo che ha lo scroll (dichiarato in App.jsx)
    const scrollContainer = document.getElementById('main-scroll-container');
    const target = document.getElementById('scelta-modello');
    
    if (!scrollContainer || !target) return;

    // Calcoliamo la distanza esatta dal contenitore corrente
    const startPosition = scrollContainer.scrollTop;
    const targetY = target.getBoundingClientRect().top;
    const containerY = scrollContainer.getBoundingClientRect().top;
    
    // Distanza da percorrere + offset visivo di -40px per non attaccarsi al margine superiore
    const distance = targetY - containerY - 40;
    const duration = 600; // Esattamente 0.6s (600ms)
    let start = null;

    // Curva di accelerazione/decelerazione per fluidità (Ease In Out Quart)
    const easeInOutQuart = (time, begin, change, d) => {
      if ((time /= d / 2) < 1) return change / 2 * time * time * time * time + begin;
      return -change / 2 * ((time -= 2) * time * time * time - 2) + begin;
    };

    const animation = (currentTime) => {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const run = easeInOutQuart(timeElapsed, startPosition, distance, duration);
      
      // Applichiamo lo scorrimento al div che funge da contenitore
      scrollContainer.scrollTop = run;
      
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        // Garantisce che alla fine del timer si arrivi al pixel esatto
        scrollContainer.scrollTop = startPosition + distance;
      }
    };

    requestAnimationFrame(animation);
  };

  return (
    <div className="portal-container">
      
      {/* SEZIONE 1: HERO PARALLAX NORDIC IMMERSIVA */}
      <section className="portal-hero-parallax">
        <div className="hero-parallax-bg"></div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title" style={{ fontWeight: 600 }}>Collezione Nordic</h1>
          <p className="hero-subtitle">
            Linee pure, prestazioni termiche di assoluto rigore e una palette di finiture ricercate. Un sistema all'avanguardia che fonde estetica minimale e tecnologia costruttiva per un ingresso dal fascino intramontabile.
          </p>
          <div className="hero-main-actions">
            <button className="btn-portal-primary" onClick={scrollToModels}>
              Scegli il modello da configurare
            </button>
          </div>
        </div>
      </section>

      {/* SEZIONE 2: SCELTA RAPIDA MODELLO */}
      <section id="scelta-modello" className="portal-selection-section">
        <div className="section-header-center">
          <h2 className="section-title-large">Configura il tuo modello</h2>
          <p className="section-subtitle-large">
            Seleziona uno dei modelli della collezione Nordic. Personalizza finiture materiche, design e dettagli tecnici per creare un ingresso su misura, perfettamente integrato nel tuo progetto.
          </p>
        </div>

        <div className="portal-models-grid">
          {MODELS.map((model) => (
            <div key={model.id} className="portal-model-card">
              <div className="model-img-box">
                <img src={model.image} alt={model.name} 
                     onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.classList.add('no-image'); }}/>
              </div>
              <div className="model-content-box">
                <div className="model-text-area">
                  <h3>{model.name}</h3>
                  <p>{model.description}</p>
                </div>
                <button className="btn-quick-config" onClick={() => handleConfigure(model.id)}>
                  <span>Configura</span> <TbArrowRight className="btn-arrow-icon" size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEZIONE 3: DOCUMENTAZIONE E CATALOGO PDF */}
      <section className="portal-catalog-section">
        <div className="catalog-oikos-layout">
          
          {/* Copertina personalizzata (Oro + Logo) */}
          <div className="catalog-cover-wrapper">
            <div className="catalog-cover-box">
              <div className="catalog-cover-inner">
                <h3 className="cover-title">Collezione Nordic</h3>
              </div>
              <img src="/assets/logo_fiore_ebanisteria.png" alt="Logo Fiore Ebanisteria" className="cover-logo-bottom" />
            </div>
          </div>
          
          <div className="catalog-info-box">
            <h2 className="catalog-info-title">Catalogo tecnico serie Nordic</h2>
            <p className="catalog-info-desc">
              Ogni grande progetto inizia con un'idea. Consulta il catalogo completo per approfondire i dettagli costruttivi, le sezioni tecniche e l'intera gamma cromatica disponibile.
            </p>
            
            <div className="catalog-action-list">
              <button onClick={() => setIsPdfModalOpen(true)} className="btn-catalog-link unstyled-btn">
                <TbEye size={20} className="catalog-icon" /> 
                <span>Sfoglia</span>
              </button>
              <a href="/assets/catalogo-nordic.pdf" download="Catalogo Nordic – Fiore Ebanisteria.pdf" className="btn-catalog-link">
                <TbDownload size={20} className="catalog-icon" /> 
                <span>Scarica</span>
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* MODALE VISUALIZZATORE PDF (Perfettamente centrato e pulito) */}
      {isPdfModalOpen && (
        <div className="pdf-modal-overlay" onClick={() => setIsPdfModalOpen(false)}>
          <div className="pdf-modal-content" onClick={(e) => e.stopPropagation()}>
            <object 
              data="/assets/catalogo-nordic.pdf#toolbar=0&navpanes=0&scrollbar=0&view=FitH" 
              type="application/pdf" 
              width="100%" 
              height="100%"
              className="pdf-iframe-full"
            >
              <div className="pdf-fallback">
                <p>Il tuo browser non supporta la visualizzazione diretta dei PDF.</p>
                <a href="/assets/catalogo-nordic.pdf" download="Catalogo_Nordic.pdf">Scarica il catalogo</a>
              </div>
            </object>
          </div>
        </div>
      )}

    </div>
  );
}