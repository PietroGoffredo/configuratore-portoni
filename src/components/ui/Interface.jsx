import React from 'react';
import '../../styles/App.css'; 

function AccordionItem({ title, isOpen, onClick, children }) {
  return (
    <div className="accordion-item">
      <div className="accordion-header" onClick={onClick}>
        <span className="accordion-title">{title}</span>
        <span className="accordion-icon">{isOpen ? "−" : "+"}</span>
      </div>
      {isOpen && <div className="accordion-content">{children}</div>}
    </div>
  );
}

// category: stringa univoca (es. 'ext_central')
// loadingState: oggetto { category, id }
function TextureSelector({ label, options, selectedId, onSelect, loadingState, category }) {
  const currentSelection = options.find(o => o.id === selectedId);
  return (
    <div style={{ marginBottom: '25px' }}>
      <span className="selector-label">{label} — <span style={{color: '#333'}}>{currentSelection?.label}</span></span>
      <div className="selector-grid">
        {options.map((opt) => {
          const isSelected = selectedId === opt.id;
          
          // LA LOGICA CHIAVE PER IL LOADER SINGOLO:
          // Deve coincidere l'ID della texture E la categoria del selettore
          const isLoading = loadingState.category === category && loadingState.id === opt.id;

          return (
            <div 
              key={opt.id} 
              onClick={() => onSelect(opt)}
              className={`texture-option ${isSelected ? 'selected' : ''}`}
              title={opt.label}
              style={{ pointerEvents: isLoading ? 'none' : 'auto' }} 
            >
              {isLoading && (
                <div className="loading-overlay">
                  <div className="spinner"></div>
                </div>
              )}
              
              <div className="texture-img-container">
                <img 
                  src={`/textures/${opt.folder}/${opt.file}`} 
                  alt={opt.label}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
                {opt.tint && opt.tint !== '#ffffff' && (
                  <div style={{ 
                    position:'absolute', top:0, left:0, width:'100%', height:'100%', 
                    backgroundColor: opt.tint, opacity: 0.6, mixBlendMode: 'multiply' 
                  }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Interface({ 
  openSections, toggleSection, 
  availableOptions,
  extState, intState,
  loadingState // Riceviamo l'oggetto loadingState
}) {
  return (
    <div className="sidebar-content">
      <AccordionItem title="Colore e Materiali Esterni" isOpen={openSections['esterni']} onClick={() => toggleSection('esterni')}>
        {/* Passiamo la categoria univoca a ogni selettore */}
        <TextureSelector 
          label="Pannello Principale" 
          category="ext_central"
          options={availableOptions} 
          selectedId={extState.central.id} 
          onSelect={extState.setCentral} 
          loadingState={loadingState} 
        />
        <TextureSelector 
          label="Cornice" 
          category="ext_cornice"
          options={availableOptions} 
          selectedId={extState.cornice.id} 
          onSelect={extState.setCornice} 
          loadingState={loadingState} 
        />
      </AccordionItem>

      <AccordionItem title="Accessori Esterni" isOpen={openSections['accessori_ext']} onClick={() => toggleSection('accessori_ext')}>
        <span className="selector-label">Finitura Maniglione</span>
        <div className="btn-group">
          <button onClick={() => extState.setManiglia("silver")} className={`finish-btn ${extState.maniglia === "silver" ? "active" : ""}`}>Argento Satinato</button>
          <button onClick={() => extState.setManiglia("nero")} className={`finish-btn ${extState.maniglia === "nero" ? "active" : ""}`}>Nero Opaco</button>
        </div>
      </AccordionItem>

      <AccordionItem title="Interni" isOpen={openSections['interni']} onClick={() => toggleSection('interni')}>
        <TextureSelector 
          label="Pannello Interno" 
          category="int_central"
          options={availableOptions} 
          selectedId={intState.central.id} 
          onSelect={intState.setCentral} 
          loadingState={loadingState} 
        />
         <span className="selector-label">Maniglia Interna</span>
        <div className="btn-group">
          <button onClick={() => intState.setManiglia("silver")} className={`finish-btn ${intState.maniglia === "silver" ? "active" : ""}`}>Standard</button>
          <button onClick={() => intState.setManiglia("nero")} className={`finish-btn ${intState.maniglia === "nero" ? "active" : ""}`}>Black Edition</button>
        </div>
      </AccordionItem>
    </div>
  );
}