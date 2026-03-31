import React, { useState, Suspense, useTransition, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TbChevronLeft, TbChevronRight } from "react-icons/tb"; 

import Navbar from './components/ui/Navbar';
import Footer from './components/ui/Footer';
import ScrollToTop from './components/ui/ScrollToTop';
import Interface from './components/ui/Interface';
import CanvasControls from './components/ui/CanvasControls';
import OrderSummary from './components/ui/OrderSummary';

import { GruppoEsterno, GruppoInterno, GruppoComune } from './components/3d/DoorParts';
import { CameraController, StudioScene } from './components/3d/EnvironmentSetup';
import { useWipeTransition } from './hooks/useWipeTransition';

import { TEXTURES_DATA } from './constants/data';
import './styles/App.css';

const STUDIO_BG_COLOR = "#eeeeee"; 

const CAMERA_PRESETS = [
  { id: 'ext_1', type: 'external', position: [0.5, 1.60, 6.5], target: [0.5, 1.25, 0], label: 'Fronte' },
  { id: 'ext_2', type: 'external', position: [4.8, 1.60, 4.8], target: [0.5, 1.25, 0], label: 'Lato Dx' },
  { id: 'ext_3', type: 'external', position: [-3.8, 1.60, 4.8], target: [0.5, 1.25, 0], label: 'Lato Sx' },
  { id: 'ext_4', type: 'external', position: [2.2, 1.30, 2.8], target: [0.5, 1.10, 0], label: 'Dett. Fr' },
  { id: 'int_1', type: 'internal', position: [0.5, 1.60, -6.5], target: [0.5, 1.25, 0], label: 'Retro' },
  { id: 'int_2', type: 'internal', position: [-3.8, 1.60, -4.8], target: [0.5, 1.25, 0], label: 'Retro Dx' },
  { id: 'int_3', type: 'internal', position: [4.8, 1.60, -4.8], target: [0.5, 1.25, 0], label: 'Retro Sx' },
  { id: 'int_4', type: 'internal', position: [2.0, 1.30, -2.8], target: [0.5, 1.10, 0], label: 'Dett. Re' }
];

function WebGLContextHelper({ contextRef }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    contextRef.current = { gl, scene, camera };
  }, [gl, scene, camera, contextRef]);
  return null;
}

function SceneReadyTrigger({ setLoaded }) {
  useEffect(() => { setLoaded(false); }, [setLoaded]);
  return null;
}

export default function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const defaultExt = TEXTURES_DATA.finishes.find(f => f.id === 'hpl_113') || TEXTURES_DATA.finishes[0];
  const defaultInt = TEXTURES_DATA.finishes.find(f => f.id === 'laccato_3151') || TEXTURES_DATA.finishes[0];

  const [extFinish, setExtFinish] = useState(defaultExt); 
  const [intFinish, setIntFinish] = useState(defaultInt);
  
  const [viewMode, setViewMode] = useState('external');
  
  const canvasContainerRef = useRef(null); 
  const [isBlackout, setIsBlackout] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const scenario = 'studio';

  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [mountLoader, setMountLoader] = useState(true);

  useEffect(() => {
    if (!isLoadingInitial) {
      const timer = setTimeout(() => setMountLoader(false), 250);
      return () => clearTimeout(timer);
    }
  }, [isLoadingInitial]);

  const [interactionMode, setInteractionMode] = useState('static'); 
  const [isInteractionModeSwitching, setIsInteractionModeSwitching] = useState(false);
  
  const [activeAngle, setActiveAngle] = useState(CAMERA_PRESETS[0]);
  const [uiActiveAngleId, setUiActiveAngleId] = useState(CAMERA_PRESETS[0].id);
  const [cameraTrigger, setCameraTrigger] = useState(0); 

  const [isPending, startTransition] = useTransition();
  const [loadingState, setLoadingState] = useState({ category: null, id: null });

  const webglContextRef = useRef(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

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
    if (isMobile && interactionMode === '3d') setInteractionMode('static');
  }, [isMobile, interactionMode]);

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

  const handleTakePhoto = async () => {
    if (isTakingPhoto || !webglContextRef.current || isInteractionModeSwitching) return;
    setIsTakingPhoto(true);

    await new Promise(resolve => setTimeout(resolve, 50));
    const { gl, scene, camera } = webglContextRef.current;
    const originalDpr = gl.getPixelRatio();
    gl.setPixelRatio(3); 
    gl.render(scene, camera); 
    const dataURL = gl.domElement.toDataURL('image/jpeg', 1.0);
    gl.setPixelRatio(originalDpr);
    gl.render(scene, camera);

    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'Nordic_01_Configurazione.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsTakingPhoto(false);
  };

  const preloadImage = (url) => {
    return new Promise((resolve) => {
      const loader = new THREE.TextureLoader();
      loader.load(url, (tex) => resolve(tex), undefined, () => resolve(null));
    });
  };

  const handleTextureChange = async (setter, newItem, category) => {
     if (newItem.id === loadingState.id && category === loadingState.category) return; 
     setLoadingState({ category: category, id: newItem.id });
     
     const mapsToLoad = [];
     if (newItem.isTextured || newItem.isHybrid || newItem.type === 'hpl_tex') {
       const folder = `/textures/${newItem.folder}/`;
       if(newItem.type === 'hpl_tex' || newItem.isTextured) mapsToLoad.push(folder + 'color.jpg');
       mapsToLoad.push(folder + 'normal.png');
       mapsToLoad.push(folder + 'roughness.jpg');
       if (newItem.id !== 'hpl_5004') mapsToLoad.push(folder + 'ao.jpg');
     }

     if (mapsToLoad.length > 0) await Promise.all(mapsToLoad.map(url => preloadImage(url)));
     else await new Promise(r => setTimeout(r, 200)); 
     
     startTransition(() => setter(newItem));
  };

  useEffect(() => { if (!isPending) setLoadingState({ category: null, id: null }); }, [isPending]);
  const extState = { finish: extFinish, setFinish: (item) => handleTextureChange(setExtFinish, item, 'ext_main') };
  const intState = { finish: intFinish, setFinish: (item) => handleTextureChange(setIntFinish, item, 'int_main') };

  const backgroundColor = STUDIO_BG_COLOR; 

  return (
    <div className="main-layout" id="main-scroll-container">
      <Navbar />

      <div className="configurator-section">
        <div className="left-sticky-column">
          <div className="canvas-frame" ref={canvasContainerRef}>
            <div className="canvas-inner-wrapper" style={{ overflow: 'hidden' }}>
              <div className={`blackout-overlay ${isBlackout ? 'active' : ''}`}></div>

              {dragUI.active && dragUI.image && (
                <img 
                  src={dragUI.image} draggable={false} alt="dragging"
                  className="scenario-transition-overlay"
                  style={{
                    clipPath: dragUI.animating ? dragUI.finalClipPath : dragUI.clipPath,
                    transform: `translateX(${dragUI.animating ? dragUI.finalOffset : dragUI.offset}px)`,
                    transition: dragUI.animating ? `clip-path ${dragUI.duration}s ease-out, transform ${dragUI.duration}s ease-out` : 'none',
                    opacity: 1
                  }}
                />
              )}

              <div className={`mode-switch-overlay ${isInteractionModeSwitching ? 'active' : ''}`}>
                <div className="spinner-canvas"></div>
              </div>

              {mountLoader && (
                <div className={`initial-loader-overlay ${!isLoadingInitial ? 'faded' : ''}`}>
                  <div className="spinner-canvas"></div>
                </div>
              )}

              {interactionMode === 'static' && (
                <div 
                  className={zoomConfig.active ? (isDraggingUI ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 11, touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitUserDrag: 'none' }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerCancel} 
                  onDragStart={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  onClick={handleStaticClick}
                />
              )}

              <div 
                className="canvas-zoom-container"
                style={{
                  transform: zoomConfig.active ? `scale(2) translate(${zoomConfig.x}px, ${zoomConfig.y}px)` : 'scale(1) translate(0px, 0px)',
                  transformOrigin: `${zoomConfig.originX}% ${zoomConfig.originY}%`,
                  transition: zoomConfig.instant ? 'none' : 'transform 0.3s ease-out'
                }}
              >
                <Canvas 
                  shadows 
                  dpr={[1, 2]} 
                  camera={{ position: CAMERA_PRESETS[0].position, fov: 40 }} 
                  gl={{ preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
                >
                  <WebGLContextHelper contextRef={webglContextRef} />
                  
                  <color attach="background" args={[backgroundColor]} />
                  <fog attach="fog" args={[backgroundColor, 8, 20]} />
                  
                  <Suspense fallback={null}>
                      <SceneReadyTrigger setLoaded={setIsLoadingInitial} />
                      
                      <StudioScene />
                      
                      <group position={[0, 0, 0]}>
                        <GruppoComune scenario={scenario} />
                        <GruppoInterno config={intFinish} viewMode={viewMode} scenario={scenario} />
                        <GruppoEsterno config={extFinish} viewMode={viewMode} scenario={scenario} />
                      </group>
                  </Suspense>
                  <CameraController 
                     activeAngle={activeAngle} isBlackout={isBlackout} 
                     is3DMode={interactionMode === '3d'} cameraTrigger={cameraTrigger}
                  />
                </Canvas>
              </div>

              {isFullscreen && (
                <>
                  <button 
                    className={`ui-btn fs-nav-left fs-ui-element ${interactionMode === '3d' ? 'hidden-fs-ui' : ''}`} 
                    onClick={(e) => { e.stopPropagation(); handleGalleryNavigation('prev'); }}
                    onMouseLeave={(e) => e.currentTarget.blur()}
                  >
                    <TbChevronLeft size={30} />
                  </button>
                  <button 
                    className={`ui-btn fs-nav-right fs-ui-element ${interactionMode === '3d' ? 'hidden-fs-ui' : ''}`} 
                    onClick={(e) => { e.stopPropagation(); handleGalleryNavigation('next'); }}
                    onMouseLeave={(e) => e.currentTarget.blur()}
                  >
                    <TbChevronRight size={30} />
                  </button>
                  <div className={`fs-counter fs-ui-element ${interactionMode === '3d' ? 'hidden-fs-ui' : ''}`}>
                    <span className="fs-counter-current">{CAMERA_PRESETS.findIndex(p => p.id === uiActiveAngleId) + 1}</span>
                    <span className="fs-counter-divider"> / </span>
                    <span className="fs-counter-total">{CAMERA_PRESETS.length}</span>
                  </div>
                </>
              )}
            </div>

            <div>
              <CanvasControls 
                isFullscreen={isFullscreen} toggleFullscreen={toggleFullscreen}
                viewMode={viewMode} handleViewChange={handleViewChange}
                isTakingPhoto={isTakingPhoto} handleTakePhoto={handleTakePhoto}
                isMobile={isMobile} interactionMode={interactionMode} toggleInteractionMode={toggleInteractionMode}
              />
            </div>
          </div>
          
          <div className="camera-presets-wrapper">
             {CAMERA_PRESETS.map(preset => (
                <div 
                   key={preset.id}
                   className={`preset-box ${uiActiveAngleId === preset.id ? 'selected' : ''}`}
                   onClick={() => handleAngleSelect(preset)}
                   style={{ pointerEvents: 'auto' }} 
                >
                   <span className="preset-label">{preset.label}</span>
                </div>
             ))}
          </div>
        </div>

        <div className="right-scroll-column">
          <div className="sidebar-header">
            {/* Ordine esatto: Sottotitolo -> Titolo -> Link cambia modello */}
            <p className="config-subtitle">Configura il tuo ingresso</p>
            <h1 className="brand-title">Nordic 01</h1>
            <a href="#" className="change-model-link" onClick={(e) => e.preventDefault()}>Cambia modello</a>
          </div>

          <Interface 
            finishes={TEXTURES_DATA.finishes}
            extState={extState} intState={intState}
            loadingState={loadingState} 
          />
        </div>
      </div>

      <OrderSummary extFinish={extFinish} intFinish={intFinish} />

      <Footer />
      <ScrollToTop />
    </div>
  );
}