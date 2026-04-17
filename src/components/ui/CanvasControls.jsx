import React, { useState, useEffect, useRef } from 'react';
import '../../styles/CanvasControls.css';
import { 
  TbDoorEnter, TbDoorExit, TbArrowsMaximize, TbArrowsMinimize, 
  TbCamera, TbView360Number
} from "react-icons/tb";
import { VscSymbolColor } from "react-icons/vsc";

// ESPORTIAMO I COLORI: Il primo elemento di ogni array sarà il default automatico.

// Colori Muro Esterno
export const EXT_WALL_COLORS = [
  { id: 'bianco_intonaco', hex: '#F2F0EB', label: 'Bianco' }, 
  { id: 'beige_sabbia', hex: '#D4C9B9', label: 'Beige sabbia' },
  { id: 'tortora_est', hex: '#A39A8F', label: 'Tortora' },
  { id: 'grigio_pietra', hex: '#8C8E8B', label: 'Grigio pietra' },
  { id: 'antracite', hex: '#4A4F54', label: 'Grigio antracite' },
  { id: 'mattone', hex: '#9C5B48', label: 'Rosso mattone' }
];

// Colori Parete Interna
export const INT_WALL_COLORS = [
  { id: 'bianco_opaco', hex: '#F8F8F8', label: 'Bianco opaco' }, 
  { id: 'tortora_int', hex: '#D5CEC4', label: 'Tortora chiaro' },
  { id: 'grigio_nuvola', hex: '#D1D5D8', label: 'Grigio nuvola' },
  { id: 'salvia', hex: '#8A9A86', label: 'Verde salvia' },
  { id: 'blu_polvere', hex: '#7A8B99', label: 'Blu polvere' },
  { id: 'terracotta', hex: '#C6876D', label: 'Terracotta' }
];

export default function CanvasControls({
  isFullscreen, toggleFullscreen,
  viewMode, handleViewChange,
  isTakingPhoto, handleTakePhoto,
  isMobile, interactionMode, toggleInteractionMode,
  extWallColor, setExtWallColor, 
  intWallColor, setIntWallColor, 
  uiActiveAngleId 
}) {
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const colorMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorMenuRef.current && !colorMenuRef.current.contains(event.target)) {
        setIsColorMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsColorMenuOpen(false);
  }, [uiActiveAngleId, isFullscreen, viewMode, interactionMode]);

  // Logica Dinamica basata sulla vista corrente
  const isExternal = viewMode === 'external';
  const activeColorsList = isExternal ? EXT_WALL_COLORS : INT_WALL_COLORS;
  const activeColor = isExternal ? extWallColor : intWallColor;
  const activeSetColor = isExternal ? setExtWallColor : setIntWallColor;
  
  // Titoli più professionali e accattivanti
  const menuTitle = isExternal ? "Colore facciata esterna" : "Colore parete interna";
  const buttonLabel = isExternal ? "Modifica facciata" : "Modifica parete";

  return (
    <div className="canvas-ui-overlay">
      
      <button 
        className="ui-btn btn-fullscreen" 
        onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
        onMouseLeave={(e) => e.currentTarget.blur()}
        data-label={isFullscreen ? "Chiudi" : "Schermo Intero"}
      >
        {isFullscreen ? <TbArrowsMinimize size={26} /> : <TbArrowsMaximize size={26} />}
      </button>

      <div className={`view-controls-vertical ${interactionMode === 'static' ? 'hidden-controls' : ''}`}>
        <button 
          className={`ui-btn btn-view ${viewMode === 'external' ? 'active' : ''}`} 
          onClick={(e) => { e.stopPropagation(); handleViewChange('external'); }}
          onMouseLeave={(e) => e.currentTarget.blur()}
          data-label="Vista esterna"
        >
          <TbDoorEnter size={26} />
        </button>
        
        <button 
          className={`ui-btn btn-view ${viewMode === 'internal' ? 'active' : ''}`} 
          onClick={(e) => { e.stopPropagation(); handleViewChange('internal'); }}
          onMouseLeave={(e) => e.currentTarget.blur()}
          data-label="Vista interna"
        >
          <TbDoorExit size={26} />
        </button>
      </div>

      <div className="bottom-left-controls" ref={colorMenuRef}>
        
        <div className={`color-popup-menu ${isColorMenuOpen ? 'open' : ''}`}>
          <span className="color-menu-title">{menuTitle}</span>
          
          <div className="color-options-wrapper">
            {activeColorsList.map((c) => (
              <div
                key={c.id}
                className={`color-option ${activeColor === c.hex ? 'active' : ''}`}
                style={{ backgroundColor: c.hex }}
                data-label={c.label}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeColor !== c.hex) {
                    activeSetColor(c.hex);
                  }
                }}
              />
            ))}
          </div>
        </div>

        <button 
          className="ui-btn"
          onClick={(e) => { 
            e.stopPropagation(); 
            setIsColorMenuOpen(!isColorMenuOpen); 
          }}
          onMouseLeave={(e) => e.currentTarget.blur()}
          data-label={buttonLabel}
        >
          <VscSymbolColor size={26} />
        </button>

        <button 
          className="ui-btn"
          onClick={(e) => { e.stopPropagation(); handleTakePhoto(); }}
          onMouseLeave={(e) => e.currentTarget.blur()}
          data-label="Cattura screenshot"
          disabled={isTakingPhoto}
        >
          {isTakingPhoto ? <div className="spinner spinner-sm"></div> : <TbCamera size={26} />}
        </button>

      </div>

      <div className="bottom-right-controls">
        {!isMobile && (
          <button
            className={`ui-btn ${interactionMode === '3d' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleInteractionMode(); }}
            onMouseLeave={(e) => e.currentTarget.blur()}
            data-label={interactionMode === 'static' ? "Visualizza a 360°" : "Disattiva 360°"}
          >
            <TbView360Number size={26} />
          </button>
        )}
      </div>
    </div>
  );
}