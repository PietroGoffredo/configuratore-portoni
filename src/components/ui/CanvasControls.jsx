import React, { useState, useEffect, useRef } from 'react';
import '../../styles/CanvasControls.css';
import { 
  TbDoorEnter, TbDoorExit, TbArrowsMaximize, TbArrowsMinimize, 
  TbCamera, TbView360Number
} from "react-icons/tb";
import { VscSymbolColor } from "react-icons/vsc";

const WALL_COLORS = [
  { id: 'white', hex: '#ffffff', label: 'Bianco Base' },
  { id: 'gray', hex: '#a9b0b5', label: 'Grigio Cemento' },
  { id: 'brown', hex: '#8b7d6b', label: 'Tortora/Marrone' },
  { id: 'dark', hex: '#363636', label: 'Antracite' }
];

export default function CanvasControls({
  isFullscreen, toggleFullscreen,
  viewMode, handleViewChange,
  isTakingPhoto, handleTakePhoto,
  isMobile, interactionMode, toggleInteractionMode,
  wallColor, setWallColor,
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
          data-label="Vista Esterna"
        >
          <TbDoorEnter size={26} />
        </button>
        
        <button 
          className={`ui-btn btn-view ${viewMode === 'internal' ? 'active' : ''}`} 
          onClick={(e) => { e.stopPropagation(); handleViewChange('internal'); }}
          onMouseLeave={(e) => e.currentTarget.blur()}
          data-label="Vista Interna"
        >
          <TbDoorExit size={26} />
        </button>
      </div>

      <div className="bottom-left-controls" ref={colorMenuRef}>
        
        <div className={`color-popup-menu ${isColorMenuOpen ? 'open' : ''}`}>
          <span className="color-menu-title">Cambia il colore del muro:</span>
          <div className="color-options-wrapper">
            {WALL_COLORS.map((c) => (
              <div
                key={c.id}
                className={`color-option ${wallColor === c.hex ? 'active' : ''}`}
                style={{ backgroundColor: c.hex }}
                data-label={c.label}
                onClick={(e) => {
                  e.stopPropagation();
                  if (wallColor !== c.hex) {
                    setWallColor(c.hex);
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
          data-label="Colore Muro"
        >
          <VscSymbolColor size={26} />
        </button>

        <button 
          className="ui-btn"
          onClick={(e) => { e.stopPropagation(); handleTakePhoto(); }}
          onMouseLeave={(e) => e.currentTarget.blur()}
          data-label="Scatta Foto"
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
            data-label={interactionMode === 'static' ? "Attiva 3D (360°)" : "Modalità Foto"}
          >
            <TbView360Number size={26} />
          </button>
        )}
      </div>
    </div>
  );
}