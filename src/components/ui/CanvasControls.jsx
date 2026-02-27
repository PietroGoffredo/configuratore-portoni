import React from 'react';
import '../../styles/CanvasControls.css';
import { 
  TbDoorEnter, TbDoorExit, TbArrowsMaximize, TbArrowsMinimize, 
  TbBuilding, TbHomeEdit, TbCamera, TbView360Number,
  TbMoon, TbPhoto // <-- REINSERITO TbPhoto QUI
} from "react-icons/tb";

export default function CanvasControls({
  isFullscreen, toggleFullscreen,
  viewMode, handleViewChange,
  scenario, isScenarioMenuOpen, setIsScenarioMenuOpen, handleScenarioChange, isScenarioSwitching,
  isSwitching,
  isTakingPhoto, handleTakePhoto,
  isMobile, interactionMode, toggleInteractionMode,
  isNightMode, setIsNightMode
}) {
  // Logica per mostrare il tasto notte solo nello Scenario 1 (modern)
  const showNightButton = scenario === 'modern';

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

      {/* Viste (Esterno/Interno) */}
      <div className={`view-controls-vertical ${scenario === 'studio' || interactionMode === 'static' ? 'hidden-controls' : ''}`}>
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
        
        {/* Scenari */}
        <div className="scenario-control-container">
          <div className={`scenario-popup-menu ${isScenarioMenuOpen ? 'open' : ''}`}>
            <div className="scenario-options-wrapper">
              
              {/* TASTO SCENARIO 1 (Villa) */}
              <button 
                className={`ui-btn scenario-option ${scenario === 'modern' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleScenarioChange('modern'); }}
                onMouseLeave={(e) => e.currentTarget.blur()}
                data-label="Villa Moderna"
                style={{ pointerEvents: isScenarioSwitching ? 'none' : 'auto' }}
              >
                <TbBuilding size={22} />
              </button>
              
              {/* TASTO SCENARIO 2 (Studio) - REINSERITO */}
              <button 
                className={`ui-btn scenario-option ${scenario === 'studio' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleScenarioChange('studio'); }}
                onMouseLeave={(e) => e.currentTarget.blur()}
                data-label="Studio Neutro"
                style={{ pointerEvents: isScenarioSwitching ? 'none' : 'auto' }}
              >
                <TbPhoto size={22} />
              </button>

            </div>
          </div>

          <button 
            className={`ui-btn ${isScenarioMenuOpen ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); !isSwitching && setIsScenarioMenuOpen(!isScenarioMenuOpen); }}
            onMouseLeave={(e) => e.currentTarget.blur()}
            data-label="Cambia Ambiente"
          >
            <TbHomeEdit size={26} />
          </button>
        </div>

        {/* TASTO NOTTE (Visibile solo in Scenario Modern) */}
        {showNightButton && (
          <button 
            className={`ui-btn ${isNightMode ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setIsNightMode(!isNightMode); }}
            onMouseLeave={(e) => e.currentTarget.blur()}
            data-label={isNightMode ? "Modalità Giorno" : "Modalità Notte"}
          >
            <TbMoon size={26} />
          </button>
        )}

        {/* Scatta Foto */}
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

      {/* Modalità 360/Foto (solo Desktop) */}
      {!isMobile && (
        <div className="bottom-right-controls">
          <button
            className={`ui-btn ${interactionMode === '3d' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleInteractionMode(); }}
            onMouseLeave={(e) => e.currentTarget.blur()}
            data-label={interactionMode === 'static' ? "Attiva 3D (360°)" : "Modalità Foto"}
          >
            <TbView360Number size={26} />
          </button>
        </div>
      )}
    </div>
  );
}