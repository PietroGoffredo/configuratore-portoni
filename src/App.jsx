import React, { useState, Suspense, useTransition, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
// Importiamo le icone per le Porte e per il Fullscreen (Tabler Icons)
import { TbDoorEnter, TbDoorExit, TbMaximize, TbMinimize } from "react-icons/tb";

import Navbar from './components/ui/Navbar';
import Footer from './components/ui/Footer';
import ScrollToTop from './components/ui/ScrollToTop';
import Interface from './components/ui/Interface';

import { GruppoEsterno, GruppoInterno, GruppoComune } from './components/3d/DoorParts';
import { TEXTURES_DATA } from './constants/data';
import './styles/App.css';

// --- CONTROLLO CAMERA ---
function CameraController({ viewMode }) {
  const controlsRef = useRef();
  useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      const targetPos = viewMode === 'external' 
        ? new THREE.Vector3(0, 1.2, 5.5) 
        : new THREE.Vector3(0, 1.2, -5.5);
      
      controls.object.position.copy(targetPos);
      controls.object.lookAt(0, 1, 0);
      controls.update();
    }
  }, [viewMode]);
  
  return (
    <OrbitControls 
      ref={controlsRef} 
      makeDefault 
      enablePan={false} 
      enableZoom={true} 
      minDistance={2} 
      maxDistance={12} 
      maxPolarAngle={Math.PI / 1.9} 
    />
  );
}

// --- LOADER 2D ---
function Loader() {
  return (
    <Html center>
      <div className="spinner-canvas"></div>
    </Html>
  );
}

// --- APP PRINCIPALE ---
export default function App() {
  const defaultExt = TEXTURES_DATA.finishes.find(f => f.id === 'hpl_113') || TEXTURES_DATA.finishes[0];
  const defaultInt = TEXTURES_DATA.finishes.find(f => f.id === 'laccato_3151') || TEXTURES_DATA.finishes[0];

  const [extFinish, setExtFinish] = useState(defaultExt); 
  const [intFinish, setIntFinish] = useState(defaultInt);
  
  const [viewMode, setViewMode] = useState('external');
  const [openSections, setOpenSections] = useState({ esterni: true, interni: true });
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasContainerRef = useRef(null); 
  
  const [isBlackout, setIsBlackout] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [loadingState, setLoadingState] = useState({ category: null, id: null });

  // 1. SYNC FULLSCREEN
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 2. CAMBIO VISTA (Con Blackout)
  const handleViewChange = (mode) => {
    if (mode === viewMode) return;
    setIsBlackout(true); 
    setTimeout(() => {
      setViewMode(mode); 
      setTimeout(() => setIsBlackout(false), 100); 
    }, 400); 
  };

  // 3. TOGGLE FULLSCREEN (Con mini Blackout per glitch)
  const toggleFullscreen = async () => {
    setIsBlackout(true);
    try {
      if (!document.fullscreenElement) {
        if (canvasContainerRef.current) await canvasContainerRef.current.requestFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Errore Fullscreen:", err);
    }
    setTimeout(() => setIsBlackout(false), 150); 
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
  
  const toggleSection = (section) => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  const extState = { finish: extFinish, setFinish: (item) => handleTextureChange(setExtFinish, item, 'ext_main') };
  const intState = { finish: intFinish, setFinish: (item) => handleTextureChange(setIntFinish, item, 'int_main') };

  return (
    <div className="main-layout" id="main-scroll-container">
      <Navbar />

      <div className="configurator-section">
        <div className="left-sticky-column">
          <div className="canvas-frame" ref={canvasContainerRef}>
            
            <div className={`blackout-overlay ${isBlackout ? 'active' : ''}`}></div>

            <div className="canvas-ui-overlay">
                {/* BOTTONE FULLSCREEN */}
                <button 
                  className="ui-btn btn-fullscreen" 
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Chiudi" : "Schermo Intero"}
                >
                  {/* Icona Dinamica: Maximize se chiuso, Minimize se aperto */}
                  {isFullscreen ? <TbMinimize size={28} /> : <TbMaximize size={28} />}
                </button>

                <div className="view-controls-vertical">
                  {/* BOTTONE ESTERNO */}
                  <button 
                    className={`ui-btn btn-view ${viewMode === 'external' ? 'active' : ''}`} 
                    onClick={() => handleViewChange('external')}
                    title="Vista Esterna"
                  >
                    <TbDoorEnter size={28} />
                  </button>
                  
                  {/* BOTTONE INTERNO */}
                  <button 
                    className={`ui-btn btn-view ${viewMode === 'internal' ? 'active' : ''}`} 
                    onClick={() => handleViewChange('internal')}
                    title="Vista Interna"
                  >
                    <TbDoorExit size={28} />
                  </button>
                </div>
            </div>

            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.5, 5], fov: 40 }}>
              <color attach="background" args={['#f4f4f4']} />
              <fog attach="fog" args={['#f4f4f4', 10, 40]} />
              <ambientLight intensity={0.6} />
              <directionalLight 
                position={[8, 12, 5]} 
                intensity={1.5} 
                castShadow 
                shadow-mapSize={[2048, 2048]} 
                shadow-bias={-0.0001}
              />
              <Environment preset="city" blur={0.8} />
              <Suspense fallback={<Loader />}>
                  <group position={[0, -1.05, 0]}>
                      <GruppoComune />
                      <GruppoInterno config={intFinish} viewMode={viewMode} />
                      <GruppoEsterno config={extFinish} viewMode={viewMode} />
                  </group>
              </Suspense>
              <CameraController viewMode={viewMode} />
            </Canvas>
          </div>
        </div>

        <div className="right-scroll-column">
          <div className="sidebar-header">
            <h1 className="brand-title">Nordic 01</h1>
            <p className="config-subtitle">Configura il tuo ingresso</p>
          </div>

          <Interface 
            openSections={openSections} toggleSection={toggleSection}
            finishes={TEXTURES_DATA.finishes}
            extState={extState} intState={intState}
            loadingState={loadingState} 
          />
        </div>
      </div>

      <div className="final-summary-section">
        <div className="summary-left">
          <div className="photo-grid">
            <div className="photo-item photo-main"><div style={{width:'100%', height:'100%', background: extFinish.hex}}>Rendering Esterno</div></div>
            <div className="photo-item photo-sub-top"><div style={{width:'100%', height:'100%', background: intFinish.hex}}>Interno</div></div>
            <div className="photo-item photo-sub-bot"><div style={{width:'100%', height:'100%', background: '#333', color:'#fff'}}>Dettaglio</div></div>
          </div>
        </div>
        <div className="summary-right">
          <h2 className="brand-title" style={{fontSize:'1.5rem'}}>Riepilogo Ordine</h2>
          <ul className="summary-list">
            <li><span className="summary-label">Modello</span><span className="summary-value">Nordic 01</span></li>
            <li><span className="summary-label">Esterno</span><span className="summary-value">{extFinish.label}</span></li>
            <li><span className="summary-label">Interno</span><span className="summary-value">{intFinish.label}</span></li>
          </ul>
          <div className="total-price-box">
            <span>Totale</span><span>€ 2.450,00</span>
          </div>
          <button className="action-btn">Conferma e Procedi</button>
        </div>
      </div>

      <Footer />
      <ScrollToTop />
    </div>
  );
}