import React, { useState, Suspense, useTransition, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { TbDoorEnter, TbDoorExit, TbMaximize, TbMinimize, TbPhoto, TbHome, TbBuilding, TbHomeEdit } from "react-icons/tb"; 

import Navbar from './components/ui/Navbar';
import Footer from './components/ui/Footer';
import ScrollToTop from './components/ui/ScrollToTop';
import Interface from './components/ui/Interface';

import { GruppoEsterno, GruppoInterno, GruppoComune } from './components/3d/DoorParts';
import { TEXTURES_DATA } from './constants/data';
import './styles/App.css';

// --- CONTROLLO CAMERA ---
function CameraController({ viewMode, scenario }) {
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
  }, [viewMode, scenario]);
  
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

// --- SCENARIO 3: STUDIO PORSCHE STYLE ---
function StudioScene() {
  return (
    <>
      <Environment preset="city" background={false} blur={1} />
      <ambientLight intensity={0.7} />
      <spotLight 
        position={[10, 10, 10]} 
        angle={0.15} 
        penumbra={1} 
        intensity={1} 
        castShadow 
        shadow-bias={-0.0001}
      />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      <ContactShadows 
        position={[0, -1.055, 0]} 
        opacity={0.6} 
        scale={20} 
        blur={2} 
        far={4} 
        resolution={1024} 
        color="#000000" 
      />
    </>
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
  const [isSwitching, setIsSwitching] = useState(false);

  const [scenario, setScenario] = useState('studio');
  const [isScenarioMenuOpen, setIsScenarioMenuOpen] = useState(false);
  // NUOVO: Stato separato per cambio scenario (senza blackout)
  const [isScenarioSwitching, setIsScenarioSwitching] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [loadingState, setLoadingState] = useState({ category: null, id: null });

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleViewChange = (mode) => {
    if (mode === viewMode || isSwitching) return;
    setIsSwitching(true);
    setIsBlackout(true); 
    setTimeout(() => {
      setViewMode(mode); 
      setTimeout(() => {
        setIsBlackout(false); 
        setTimeout(() => {
            setIsSwitching(false);
        }, 400); 
      }, 100); 
    }, 400); 
  };

  // MODIFICA 5: Cambio scenario senza transizione nera, ma bloccando i bottoni
  const handleScenarioChange = (newScenario) => {
    if (newScenario === scenario || isScenarioSwitching) return;
    
    setIsScenarioSwitching(true);
    setScenario(newScenario);
    setIsScenarioMenuOpen(false);

    // Sblocca i bottoni dello scenario dopo poco (simula un mini-caricamento per feedback logico)
    setTimeout(() => {
        setIsScenarioSwitching(false);
    }, 500); 
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (canvasContainerRef.current) await canvasContainerRef.current.requestFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Errore Fullscreen:", err);
    }
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

  const backgroundColor = scenario === 'studio' ? '#ffffff' : '#f4f4f4';

  return (
    <div className="main-layout" id="main-scroll-container">
      <Navbar />

      <div className="configurator-section">
        <div className="left-sticky-column">
          <div className="canvas-frame" ref={canvasContainerRef}>
            
            <div className={`blackout-overlay ${isBlackout ? 'active' : ''}`}></div>

            <div className="canvas-ui-overlay">
                <button 
                  className="ui-btn btn-fullscreen" 
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Chiudi" : "Schermo Intero"}
                >
                  {isFullscreen ? <TbMinimize size={26} /> : <TbMaximize size={26} />}
                </button>

                {/* MODIFICA 1: Div sempre renderizzato ma classe CSS "hidden-controls" lo nasconde con animazione */}
                <div className={`view-controls-vertical ${scenario === 'studio' ? 'hidden-controls' : ''}`}>
                    <button 
                        className={`ui-btn btn-view ${viewMode === 'external' ? 'active' : ''}`} 
                        onClick={() => handleViewChange('external')}
                        title="Vista Esterna"
                        style={{ cursor: 'pointer' }}
                    >
                        <TbDoorEnter size={26} />
                    </button>
                    
                    <button 
                        className={`ui-btn btn-view ${viewMode === 'internal' ? 'active' : ''}`} 
                        onClick={() => handleViewChange('internal')}
                        title="Vista Interna"
                        style={{ cursor: 'pointer' }}
                    >
                        <TbDoorExit size={26} />
                    </button>
                </div>

                <div className="scenario-control-container">
                  <div className={`scenario-popup-menu ${isScenarioMenuOpen ? 'open' : ''}`}>
                    <button 
                      className={`ui-btn scenario-option ${scenario === 'studio' ? 'active' : ''}`}
                      onClick={() => handleScenarioChange('studio')}
                      title="Studio Neutro"
                      /* MODIFICA 3: pointerEvents impedisce il click finché è in transizione, nessuna opacità */
                      style={{ pointerEvents: isScenarioSwitching ? 'none' : 'auto' }}
                    >
                      <TbPhoto size={22} />
                    </button>
                    <button 
                      className={`ui-btn scenario-option ${scenario === 'modern' ? 'active' : ''}`}
                      onClick={() => handleScenarioChange('modern')}
                      title="Villa Moderna"
                      style={{ pointerEvents: isScenarioSwitching ? 'none' : 'auto' }}
                    >
                      <TbBuilding size={22} />
                    </button>
                    <button 
                      className={`ui-btn scenario-option ${scenario === 'classic' ? 'active' : ''}`}
                      onClick={() => handleScenarioChange('classic')}
                      title="Villa Classica"
                      style={{ pointerEvents: isScenarioSwitching ? 'none' : 'auto' }}
                    >
                      <TbHome size={22} />
                    </button>
                  </div>

                  {/* MODIFICA 2: Bottone sempre cliccabile per aprire/chiudere il menu */}
                  <button 
                    className={`ui-btn ${isScenarioMenuOpen ? 'active' : ''}`}
                    onClick={() => setIsScenarioMenuOpen(!isScenarioMenuOpen)}
                    title="Cambia Ambiente"
                  >
                    <TbHomeEdit size={26} />
                  </button>
                </div>

            </div>

            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.5, 5], fov: 40 }}>
              <color attach="background" args={[backgroundColor]} />
              <fog attach="fog" args={[backgroundColor, 10, 40]} />
              
              <Suspense fallback={<Loader />}>
                  <group position={[0, -1.05, 0]}>
                      
                      {scenario === 'studio' ? (
                          <StudioScene />
                      ) : (
                          <>
                            <ambientLight intensity={0.6} />
                            {/* MODIFICA 4: Aggiunto bias normalizzato per togliere l'acne (triangoli neri) */}
                            <directionalLight 
                              position={[8, 12, 5]} 
                              intensity={1.5} 
                              castShadow 
                              shadow-mapSize={[2048, 2048]} 
                              shadow-bias={-0.0005}
                              shadow-normalBias={0.04}
                            />
                            <Environment preset="city" blur={0.8} />
                          </>
                      )}

                      <group>
                        <GruppoComune scenario={scenario} />
                        <GruppoInterno config={intFinish} viewMode={viewMode} scenario={scenario} />
                        <GruppoEsterno config={extFinish} viewMode={viewMode} scenario={scenario} />
                      </group>
                  </group>
              </Suspense>
              <CameraController viewMode={viewMode} scenario={scenario} />
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