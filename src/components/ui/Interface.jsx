import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { TbInfoCircle, TbX, TbChevronDown } from "react-icons/tb"; 
import '../../styles/App.css'; 

// --- DATI DESCRIZIONI ---
const DESCRIPTIONS = {
  laccato: {
    title: "Finitura Laccata",
    text: "La laccatura opaca è la scelta ideale per chi cerca eleganza e sobrietà. Realizzata attraverso molteplici passaggi di verniciatura ecologica a base d'acqua, offre una superficie setosa al tatto, uniforme e priva di riflessi. Garantisce un'ottima copertura cromatica e una resa estetica moderna e raffinata, perfetta per integrarsi in ambienti di design contemporaneo e minimale."
  },
  hpl: {
    title: "Laminato HPL",
    text: "L'HPL (High Pressure Laminate) è un materiale di eccellenza tecnologica, costituito da strati di fibre cellulosiche impregnati di resine termoindurenti. Offre una resistenza meccanica superiore a graffi, urti e abrasioni ed è particolarmente indicato per l'esterno grazie alla sua stabilità agli sbalzi termici e ai raggi UV, mantenendo inalterata la bellezza delle texture materiche nel tempo."
  },
  nobilitato: {
    title: "Nobilitato",
    text: "Il pannello nobilitato unisce versatilità estetica e praticità d'uso. Composto da un pannello di base rivestito con carte melaminiche decorative, riproduce fedelmente le venature del legno o texture moderne. È una soluzione resistente, facile da pulire e durevole, ideale per le parti interne del portone dove si richiede coerenza stilistica con l'arredamento domestico."
  }
};

// --- COMPONENTE SIDE PANEL INFO (PORTAL) ---
function InfoPanel({ data, onClose, isClosing }) {
  if (!data) return null;

  return createPortal(
    <div className={`info-panel-overlay ${isClosing ? 'closing' : 'active'}`} onClick={onClose}>
      <div className={`info-panel-content ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
        
        <div className="info-header">
          <h3 className="info-title">{data.title}</h3>
          <button className="info-close-btn" onClick={onClose}>
            <TbX size={22} />
          </button>
        </div>

        <div className="info-body">
          <p className="info-text">{data.text}</p>
        </div>

      </div>
    </div>,
    document.body
  );
}

// --- ACCORDION ITEM ---
function AccordionItem({ title, isOpen, onClick, children }) {
  return (
    <div className={`accordion-item ${isOpen ? 'open' : ''}`}>
      <div className="accordion-header" onClick={onClick}>
        <span className="accordion-title">{title}</span>
        <span className="accordion-icon-wrapper">
           <TbChevronDown size={20} className="accordion-chevron" />
        </span>
      </div>
      
      <div className="accordion-collapse" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
        <div className="accordion-body">
          {children}
        </div>
      </div>
    </div>
  );
}

// --- SELETTORE TEXTURE ---
function TextureSelector({ 
  label, 
  descriptionKey, 
  options, 
  selectedId, 
  onSelect, 
  loadingState, 
  category,
  onOpenInfo 
}) {
  
  const currentSelection = options.find(o => o.id === selectedId);

  return (
    <div className="selector-wrapper">
      
      <div className="selector-header-row">
        <span className="selector-label-title">{label}</span>
        <button 
          className="info-icon-btn" 
          onClick={(e) => {
            e.stopPropagation();
            onOpenInfo(DESCRIPTIONS[descriptionKey]);
          }}
          title="Scheda tecnica"
        >
          <TbInfoCircle size={18} />
        </button>
      </div>

      {currentSelection && (
        <div className="selector-dynamic-name fade-in-text">
          {currentSelection.label}
        </div>
      )}

      <div className="selector-grid">
        {options.map((opt) => {
          const isSelected = selectedId === opt.id;
          const isLoading = loadingState.category === category && loadingState.id === opt.id;
          
          const useImage = opt.isTextured || opt.icon;
          const imageUrl = opt.icon 
             ? `/textures/${opt.folder}/${opt.icon}` 
             : null; 

          return (
            <div 
              key={opt.id} 
              // MODIFICA IMPORTANTE: Aggiunto data-label per il tooltip CSS
              data-label={opt.label}
              onClick={() => {
                if (!isSelected && !isLoading) {
                  onSelect(opt);
                }
              }}
              className={`texture-option ${isSelected ? 'selected' : ''}`}
              style={{ 
                 pointerEvents: isLoading ? 'none' : 'auto',
                 cursor: isSelected ? 'default' : 'pointer',
                 backgroundColor: !useImage ? opt.hex : 'transparent' 
              }} 
            >
              {isLoading && (
                <div className="loading-overlay"><div className="spinner"></div></div>
              )}
              
              {useImage && imageUrl && (
                <div className="texture-img-container">
                  <img src={imageUrl} alt={opt.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- INTERFACE PRINCIPALE ---
export default function Interface({ 
  openSections, toggleSection, 
  finishes,
  extState, intState,
  loadingState 
}) {
  
  const [activeInfo, setActiveInfo] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleOpenInfo = (data) => {
    setActiveInfo(data);
    setIsClosing(false);
  };

  const handleCloseInfo = () => {
    setIsClosing(true);
    setTimeout(() => {
      setActiveInfo(null);
      setIsClosing(false);
    }, 400);
  };

  const laccati = finishes.filter(f => f.category === 'laccato');
  const hpl = finishes.filter(f => f.category === 'hpl');
  const nobilitati = finishes.filter(f => f.category === 'nobilitato');

  return (
    <>
      <div className="sidebar-content">
        
        <AccordionItem title="Esterni" isOpen={openSections['esterni']} onClick={() => toggleSection('esterni')}>
          <TextureSelector 
            label="Laccati" descriptionKey="laccato" category="ext_main" 
            options={laccati} selectedId={extState.finish.id} onSelect={extState.setFinish} 
            loadingState={loadingState} onOpenInfo={handleOpenInfo}
          />
          <TextureSelector 
            label="HPL" descriptionKey="hpl" category="ext_main" 
            options={hpl} selectedId={extState.finish.id} onSelect={extState.setFinish} 
            loadingState={loadingState} onOpenInfo={handleOpenInfo}
          />
        </AccordionItem>

        <AccordionItem title="Interni" isOpen={openSections['interni']} onClick={() => toggleSection('interni')}>
          <TextureSelector 
            label="Laccati" descriptionKey="laccato" category="int_main" 
            options={laccati} selectedId={intState.finish.id} onSelect={intState.setFinish} 
            loadingState={loadingState} onOpenInfo={handleOpenInfo}
          />
          <TextureSelector 
            label="HPL" descriptionKey="hpl" category="int_main" 
            options={hpl} selectedId={intState.finish.id} onSelect={intState.setFinish} 
            loadingState={loadingState} onOpenInfo={handleOpenInfo}
          />
          <TextureSelector 
            label="Nobilitato" descriptionKey="nobilitato" category="int_main" 
            options={nobilitati} selectedId={intState.finish.id} onSelect={intState.setFinish} 
            loadingState={loadingState} onOpenInfo={handleOpenInfo}
          />
        </AccordionItem>
      </div>

      <InfoPanel 
        data={activeInfo} 
        onClose={handleCloseInfo} 
        isClosing={isClosing} 
      />
    </>
  );
}