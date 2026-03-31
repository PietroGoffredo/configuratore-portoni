import React from 'react';
import '../../styles/CanvasControls.css';
import { 
  TbDoorEnter, TbDoorExit, TbArrowsMaximize, TbArrowsMinimize, 
  TbCamera, TbView360Number
} from "react-icons/tb";

export default function CanvasControls({
  isFullscreen, toggleFullscreen,
  viewMode, handleViewChange,
  isTakingPhoto, handleTakePhoto,
  isMobile, interactionMode, toggleInteractionMode
}) {
  return (
    <div className="canvas-ui-overlay">
      
      {/* Bottone Schermo Intero */}
      <button 
        className="ui-btn btn-fullscreen" 
        onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
        onMouseLeave={(e) => e.currentTarget.blur()}
        data-label={isFullscreen ? "Chiudi" : "Schermo Intero"}
      >
        {isFullscreen ? <TbArrowsMinimize size={26} /> : <TbArrowsMaximize size={26} />}
      </button>

      {/* Viste (Esterno/Interno) - Sempre disponibili */}
      <div className="view-controls-vertical">
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

      <div className="bottom-left-controls">
        {/* Eventuali controlli futuri qui a sinistra */}
      </div>

      {/* Raggruppamento Bottoni in basso a Destra */}
      <div className="bottom-right-controls">
        
        {/* Scatta Foto (Spostato a sinistra del 360 e visibile su tutti i dispositivi) */}
        <button 
          className="ui-btn"
          onClick={(e) => { e.stopPropagation(); handleTakePhoto(); }}
          onMouseLeave={(e) => e.currentTarget.blur()}
          data-label="Scatta Foto"
          disabled={isTakingPhoto}
        >
          {isTakingPhoto ? <div className="spinner spinner-sm"></div> : <TbCamera size={26} />}
        </button>

        {/* Modalità 360/Foto (solo Desktop) */}
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