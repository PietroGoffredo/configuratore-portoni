import React, { useState, useRef, useEffect } from 'react';
import Navbar from './components/ui/Navbar';
import Footer from './components/ui/Footer';
import ScrollToTop from './components/ui/ScrollToTop';
import Interface from './components/ui/Interface';
import CanvasControls from './components/ui/CanvasControls';
import OrderSummary from './components/ui/OrderSummary';
import ProfileDashboard from './components/ui/ProfileDashboard';
import Experience from './components/3d/Experience';

import { useTextureManager } from './hooks/useTextureManager';
import { usePhotoCapture } from './hooks/usePhotoCapture';
import { useWipeTransition } from './hooks/useWipeTransition';
import { TEXTURES_DATA } from './constants/data';
import { CAMERA_PRESETS } from './config/cameraPresets'; 
import './styles/App.css';

export default function App() {
  const [currentView, setCurrentView] = useState('configurator'); 
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [wallColor, setWallColor] = useState('#ffffff');
  const [viewMode, setViewMode] = useState('external');
  const [interactionMode, setInteractionMode] = useState('static'); 
  const [isInteractionModeSwitching, setIsInteractionModeSwitching] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [mountLoader, setMountLoader] = useState(true);
  
  const [activeAngle, setActiveAngle] = useState(CAMERA_PRESETS[0]);
  const [uiActiveAngleId, setUiActiveAngleId] = useState(CAMERA_PRESETS[0].id);
  const [cameraTrigger, setCameraTrigger] = useState(0); 

  const canvasContainerRef = useRef(null); 
  const webglContextRef = useRef(null);
  const scenario = 'showroom';

  // HOOKS MODULARIZZATI
  const { extFinish, intFinish, extState, intState, loadingState } = useTextureManager(
    TEXTURES_DATA.finishes.find(f => f.id === 'hpl_113'),
    TEXTURES_DATA.finishes.find(f => f.id === 'laccato_3151')
  );
  
  const { isTakingPhoto, handleTakePhoto } = usePhotoCapture(webglContextRef);

  const {
    dragUI, zoomConfig, setZoomConfig, isDraggingUI, setIsDraggingUI,
    isFullscreen, toggleFullscreen,
    handleGalleryNavigation, handlePointerDown, handlePointerMove,
    handlePointerUp, handlePointerCancel, handleStaticClick,
    handleAngleSelect, handleViewChange
  } = useWipeTransition({
    CAMERA_PRESETS, interactionMode, viewMode, setViewMode,
    setActiveAngle, setUiActiveAngleId, setCameraTrigger,
    webglContextRef, canvasContainerRef,
    isSwitching, setIsSwitching, isScenarioSwitching: false,
    isTakingPhoto, isInteractionModeSwitching, setIsBlackout, scenario
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isLoadingInitial) {
      const timer = setTimeout(() => setMountLoader(false), 250);
      return () => clearTimeout(timer);
    }
  }, [isLoadingInitial]);

  const toggleInteractionMode = () => {
    if (isInteractionModeSwitching || isSwitching || isTakingPhoto || dragUI.active) return;
    setIsInteractionModeSwitching(true);
    if (zoomConfig.active) {
        setIsDraggingUI(false);
        setZoomConfig(prev => ({ ...prev, active: false, x: 0, y: 0, instant: true }));
    }
    setTimeout(() => {
      setInteractionMode(prev => prev === 'static' ? '3d' : 'static');
      setIsInteractionModeSwitching(false);
    }, 400); 
  };

  return (
    <div className="main-layout" id="main-scroll-container">
      <Navbar setCurrentView={setCurrentView} currentView={currentView} />

      {currentView === 'configurator' ? (
        <>
          <div className="configurator-section">
            <div className="left-sticky-column">
              <div className="canvas-frame" ref={canvasContainerRef}>
                <div className="canvas-inner-wrapper" style={{ overflow: 'hidden' }}>
                  <div className={`blackout-overlay ${isBlackout ? 'active' : ''}`}></div>
                  
                  {/* Overlay Transizione Scenari */}
                  {dragUI.active && dragUI.image && (
                    <img src={dragUI.image} alt="dragging" className="scenario-transition-overlay"
                      style={{
                        clipPath: dragUI.animating ? dragUI.finalClipPath : dragUI.clipPath,
                        transform: `translateX(${dragUI.animating ? dragUI.finalOffset : dragUI.offset}px)`,
                        transition: dragUI.animating ? `clip-path ${dragUI.duration}s ease-out, transform ${dragUI.duration}s ease-out` : 'none',
                      }}
                    />
                  )}

                  <div className={`mode-switch-overlay ${isInteractionModeSwitching ? 'active' : ''}`}><div className="spinner-canvas"></div></div>
                  {mountLoader && <div className={`initial-loader-overlay ${!isLoadingInitial ? 'faded' : ''}`}><div className="spinner-canvas"></div></div>}

                  {/* Input Invisible per Zoom Statico */}
                  {interactionMode === 'static' && (
                    <div className={zoomConfig.active ? (isDraggingUI ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 11, touchAction: 'none' }}
                      onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel} onClick={handleStaticClick}
                    />
                  )}

                  {/* IL MOTORE 3D ESTRATTO */}
                  <Experience 
                    webglContextRef={webglContextRef}
                    setIsLoadingInitial={setIsLoadingInitial}
                    viewMode={viewMode}
                    wallColor={wallColor}
                    extFinish={extFinish}
                    intFinish={intFinish}
                    scenario={scenario}
                    activeAngle={activeAngle}
                    cameraTrigger={cameraTrigger}
                    interactionMode={interactionMode}
                    isBlackout={isBlackout}
                    zoomConfig={zoomConfig}
                    isDraggingUI={isDraggingUI}
                  />

                  {/* UI Navigazione Fullscreen */}
                  {isFullscreen && (
                    <>
                      <button className={`ui-btn fs-nav-left ${interactionMode === '3d' ? 'hidden-fs-ui' : ''}`} onClick={(e) => { e.stopPropagation(); handleGalleryNavigation('prev'); }}><TbChevronLeft size={30} /></button>
                      <button className={`ui-btn fs-nav-right ${interactionMode === '3d' ? 'hidden-fs-ui' : ''}`} onClick={(e) => { e.stopPropagation(); handleGalleryNavigation('next'); }}><TbChevronRight size={30} /></button>
                    </>
                  )}
                </div>

                <CanvasControls 
                  isFullscreen={isFullscreen} toggleFullscreen={toggleFullscreen} viewMode={viewMode} handleViewChange={handleViewChange}
                  isTakingPhoto={isTakingPhoto} handleTakePhoto={() => handleTakePhoto(isInteractionModeSwitching)}
                  isMobile={isMobile} interactionMode={interactionMode} toggleInteractionMode={toggleInteractionMode}
                  wallColor={wallColor} setWallColor={setWallColor} uiActiveAngleId={uiActiveAngleId}
                />
              </div>
              
              <div className="camera-presets-wrapper">
                 {CAMERA_PRESETS.map(preset => (
                    <div key={preset.id} className={`preset-box ${uiActiveAngleId === preset.id ? 'selected' : ''}`} onClick={() => handleAngleSelect(preset)}><span className="preset-label">{preset.label}</span></div>
                 ))}
              </div>
            </div>

            <div className="right-scroll-column">
              <Interface finishes={TEXTURES_DATA.finishes} extState={extState} intState={intState} loadingState={loadingState} />
            </div>
          </div>

          <OrderSummary extFinish={extFinish} intFinish={intFinish} webglContextRef={webglContextRef} cameraPresets={CAMERA_PRESETS} />
        </>
      ) : (
        <ProfileDashboard onLogout={() => setCurrentView('configurator')} />
      )}

      <Footer />
      <ScrollToTop />
    </div>
  );
}