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

function TextureSelector({ label, options, selectedId, onSelect, loadingState, category }) {
  const currentSelection = options.find(o => o.id === selectedId);
  
  return (
    <div style={{ marginBottom: '25px' }}>
      <span className="selector-label">
        {label} — <span style={{color: 'var(--color-grey-2)', fontWeight: 400}}>{currentSelection?.label}</span>
      </span>
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
              onClick={() => onSelect(opt)}
              className={`texture-option ${isSelected ? 'selected' : ''}`}
              title={opt.label}
              style={{ 
                 pointerEvents: isLoading ? 'none' : 'auto',
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

export default function Interface({ 
  openSections, toggleSection, 
  finishes,
  extState, intState,
  loadingState 
}) {
  
  // Filtro Categorie
  const laccati = finishes.filter(f => f.category === 'laccato');
  const hpl = finishes.filter(f => f.category === 'hpl');
  const nobilitati = finishes.filter(f => f.category === 'nobilitato');

  return (
    <div className="sidebar-content">
      
      {/* SEZIONE ESTERNI */}
      <AccordionItem title="Esterni" isOpen={openSections['esterni']} onClick={() => toggleSection('esterni')}>
        
        {/* Laccati Esterni */}
        <TextureSelector 
          label="Laccati (Opachi)" 
          category="ext_main" options={laccati} 
          selectedId={extState.finish.id} onSelect={extState.setFinish} loadingState={loadingState} 
        />
        
        {/* HPL Esterni */}
        <TextureSelector 
          label="HPL (Alta Resistenza)" 
          category="ext_main" options={hpl} 
          selectedId={extState.finish.id} onSelect={extState.setFinish} loadingState={loadingState} 
        />
      </AccordionItem>

      {/* SEZIONE INTERNI */}
      <AccordionItem title="Interni" isOpen={openSections['interni']} onClick={() => toggleSection('interni')}>
        
        {/* 1. Laccati Interni */}
        <TextureSelector 
          label="Laccati (Opachi)" 
          category="int_main" options={laccati} 
          selectedId={intState.finish.id} onSelect={intState.setFinish} loadingState={loadingState} 
        />

        {/* 2. HPL Interni */}
        <TextureSelector 
          label="HPL (Alta Resistenza)" 
          category="int_main" options={hpl} 
          selectedId={intState.finish.id} onSelect={intState.setFinish} loadingState={loadingState} 
        />

        {/* 3. Nobilitati Interni */}
        <TextureSelector 
          label="Nobilitato" 
          category="int_main" options={nobilitati} 
          selectedId={intState.finish.id} onSelect={intState.setFinish} loadingState={loadingState} 
        />

      </AccordionItem>
    </div>
  );
}