import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TbInfoCircle, TbX } from "react-icons/tb"; 
import '../../styles/App.css'; 
import '../../styles/Interface.css';

// --- DATI DESCRIZIONI E INFOBOX ---
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
  },
  controtelaio: {
    title: "Il Controtelaio",
    text: "Il controtelaio (o falso telaio) è l'anima in acciaio zincato che viene murata direttamente nella parete grezza. Su di esso verrà poi fissato (avvitato) il telaio definitivo del portone. Scegli 'Sì' se ti trovi in una fase di cantiere o ristrutturazione profonda con il vano porta ancora al grezzo."
  },
  soglia: {
    title: "Soglia Fissa",
    text: "La soglia fissa a pavimento è un profilo a taglio termico che unisce i due montanti del telaio a terra. Garantisce la massima tenuta termica e acustica contro acqua, vento e spifferi. È altamente consigliata (se non obbligatoria) per le porte che affacciano direttamente alle intemperie esterne."
  }
};

// --- DATI TIPOLOGIE DI COSTRUZIONE ---
const CONSTRUCTION_TYPES = [
  { id: 'standard', label: 'Solo porta' },
  { id: 'fiancoluce_sx', label: 'Fiancoluce SX' },
  { id: 'fiancoluce_dx', label: 'Fiancoluce DX' },
  { id: 'fiancoluce_doppio', label: 'Doppio Fiancoluce' },
  { id: 'sopraluce', label: 'Sopraluce' },
  { id: 'sopraluce_sx', label: 'Sopra + F.luce SX' },
  { id: 'sopraluce_dx', label: 'Sopra + F.luce DX' },
  { id: 'sopraluce_doppio', label: 'Sopra + Doppio F.luce' }
];

// --- COMPONENTE SIDE PANEL INFO (PORTAL CON TRANSIZIONE FLUIDA) ---
function InfoPanel({ data, onClose, isClosing }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (data && !isClosing) {
      const timer = setTimeout(() => setIsMounted(true), 10);
      return () => clearTimeout(timer);
    } else if (isClosing) {
      setIsMounted(false);
    }
  }, [data, isClosing]);

  if (!data) return null;

  return createPortal(
    <div className={`info-panel-overlay ${isMounted ? 'active' : ''}`} onClick={onClose}>
      <div className={`info-panel-content ${isMounted ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
        
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

// --- SECTION ITEM ---
function SectionItem({ title, onInfoClick, children }) {
  return (
    <div className="section-container">
      <div className="section-header">
        <span className="section-title">{title}</span>
        {onInfoClick && (
          <button 
            className="info-icon-btn" 
            onClick={onInfoClick} 
            title="Scheda tecnica"
          >
            <TbInfoCircle size={18} />
          </button>
        )}
      </div>
      <div className="section-body">
        {children}
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
              data-label={opt.label}
              tabIndex={0}
              onMouseLeave={(e) => e.currentTarget.blur()}
              onClick={() => {
                if (!isSelected && !isLoading) {
                  onSelect(opt);
                }
              }}
              className={`texture-option ${isSelected ? 'selected' : ''}`}
              style={{ 
                 pointerEvents: isLoading ? 'none' : 'auto',
                 cursor: 'pointer', 
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
  finishes,
  extState, intState,
  loadingState 
}) {
  
  // Stati del form aggiuntivi
  const [opening, setOpening] = useState('destra');
  const [construction, setConstruction] = useState('standard');
  const [needsSubframe, setNeedsSubframe] = useState(false);
  const [extAccessory, setExtAccessory] = useState('standard');
  const [intHandle, setIntHandle] = useState('standard');
  const [hasPeephole, setHasPeephole] = useState(false);
  const [hasFixedThreshold, setHasFixedThreshold] = useState(false);

  // Stati Pannello Info
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

        {/* 1. HEADER / SEZIONE MODELLO */}
        <div className="sidebar-header">
          <div className="header-eyebrow">
            <span className="config-subtitle">Configurazione Attiva</span>
            <span className="collection-tag">Serie Nordic</span>
          </div>
          <h1 className="brand-title">Nordic 01</h1>
          <a href="#" className="change-model-link" onClick={(e) => e.preventDefault()}>Modifica selezione modello</a>
        </div>

        {/* 2. SENSO DI APERTURA */}
        <SectionItem title="Senso di apertura">
          <div className="form-btn-group">
            <button 
              className={`form-btn ${opening === 'sinistra' ? 'active' : ''}`}
              onClick={() => setOpening('sinistra')}
            >
              Spinta a Sinistra
            </button>
            <button 
              className={`form-btn ${opening === 'destra' ? 'active' : ''}`}
              onClick={() => setOpening('destra')}
            >
              Spinta a Destra
            </button>
          </div>
        </SectionItem>

        {/* 3. TIPOLOGIA DI COSTRUZIONE */}
        <SectionItem title="Tipologia di costruzione">
          <div className="form-grid">
            {CONSTRUCTION_TYPES.map((type) => (
              <button
                key={type.id}
                className={`form-btn ${construction === type.id ? 'active' : ''}`}
                onClick={() => setConstruction(type.id)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </SectionItem>

        {/* 4. CONTROTELAIO (Con InfoBox) */}
        <SectionItem 
          title="Hai bisogno del controtelaio?" 
          onInfoClick={() => handleOpenInfo(DESCRIPTIONS.controtelaio)}
        >
          <div className="form-btn-group">
            <button className={`form-btn ${needsSubframe === true ? 'active' : ''}`} onClick={() => setNeedsSubframe(true)}>Sì</button>
            <button className={`form-btn ${needsSubframe === false ? 'active' : ''}`} onClick={() => setNeedsSubframe(false)}>No</button>
          </div>
        </SectionItem>
        
        {/* 5. RIVESTIMENTO ESTERNO */}
        <SectionItem title="Rivestimento Esterno">
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
        </SectionItem>

        {/* 6. RIVESTIMENTO INTERNO */}
        <SectionItem title="Rivestimento Interno">
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
        </SectionItem>

        {/* 7. ACCESSORI ESTERNI */}
        <SectionItem title="Accessori Esterni">
          <select 
            className="form-select"
            value={extAccessory} 
            onChange={(e) => setExtAccessory(e.target.value)}
          >
            <option value="standard">Maniglione Standard (Predefinito)</option>
            <option value="pomolo">Pomolo Girevole</option>
            <option value="nessuno">Nessun accessorio (Solo predisposizione)</option>
          </select>
        </SectionItem>

        {/* 8. MANIGLIE INTERNE */}
        <SectionItem title="Maniglia Interna">
          <select 
            className="form-select"
            value={intHandle} 
            onChange={(e) => setIntHandle(e.target.value)}
          >
            <option value="standard">Maniglia Standard Argento</option>
            <option value="nera">Maniglia Nera Opaca</option>
            <option value="oro">Maniglia Oro Ottone</option>
          </select>
        </SectionItem>

        {/* 9. SPIONCINO */}
        <SectionItem title="Spioncino">
          <div className="form-btn-group">
            <button className={`form-btn ${hasPeephole === true ? 'active' : ''}`} onClick={() => setHasPeephole(true)}>Sì</button>
            <button className={`form-btn ${hasPeephole === false ? 'active' : ''}`} onClick={() => setHasPeephole(false)}>No</button>
          </div>
        </SectionItem>

        {/* 10. SOGLIA FISSA (Con InfoBox) */}
        <SectionItem 
          title="Hai bisogno della soglia fissa?" 
          onInfoClick={() => handleOpenInfo(DESCRIPTIONS.soglia)}
        >
          <div className="form-btn-group">
            <button className={`form-btn ${hasFixedThreshold === true ? 'active' : ''}`} onClick={() => setHasFixedThreshold(true)}>Sì</button>
            <button className={`form-btn ${hasFixedThreshold === false ? 'active' : ''}`} onClick={() => setHasFixedThreshold(false)}>No</button>
          </div>
        </SectionItem>

      </div>

      {/* PANNELLO INFO DINAMICO */}
      <InfoPanel 
        data={activeInfo} 
        onClose={handleCloseInfo} 
        isClosing={isClosing} 
      />
    </>
  );
}