import React, { useState, Suspense, useTransition, useEffect, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { TbDoorEnter, TbDoorExit, TbMaximize, TbMinimize, TbPhoto, TbHome, TbBuilding, TbHomeEdit } from "react-icons/tb"; 

import Navbar from './components/ui/Navbar';
import Footer from './components/ui/Footer';
import ScrollToTop from './components/ui/ScrollToTop';
import Interface from './components/ui/Interface';

import { GruppoEsterno, GruppoInterno, GruppoComune } from './components/3d/DoorParts';
import { TEXTURES_DATA } from './constants/data';
import './styles/App.css';

// --- CONFIGURAZIONE VISIVA STUDIO ---
const STUDIO_BG_COLOR = "#ebebeb"; 

// --- OFFSET DI POSIZIONAMENTO SCENOGRAFIA ---
const SCENE_X_SHIFT = 0.5;  
const SCENE_Z_SHIFT = 0.1; 

// --- CONTROLLO CAMERA ---
function CameraController({ viewMode, scenario }) {
  const controlsRef = useRef();
  
  useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      
      const xCam = 4.5; 
      const yCam = 1.2;
      const zCam = 6.0;

      const targetX = 0.5;
      const targetY = 1.3;

      let posVector;

      if (viewMode === 'internal' && scenario !== 'studio') {
           posVector = new THREE.Vector3(xCam, yCam, -zCam);
      } else {
           posVector = new THREE.Vector3(xCam, yCam, zCam);
      }
      
      controls.object.position.copy(posVector);
      controls.target.set(targetX, targetY, 0); 
      controls.update();
    }
  }, [viewMode, scenario]);
  
  return (
    <OrbitControls 
      ref={controlsRef} 
      makeDefault 
      enablePan={false} 
      enableZoom={true} 
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2 - 0.05} 
      minDistance={2} 
      maxDistance={7}
    />
  );
}

// --- LOADER ---
function Loader() {
  return (
    <Html center>
      <div className="spinner-canvas"></div>
    </Html>
  );
}

// --- GENERATORE MAPPE ---

// 1. Alpha Map Pavimento
function generateFloorAlpha() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  const gradient = ctx.createRadialGradient(256, 256, 100, 256, 256, 256);
  gradient.addColorStop(0, 'white');
  gradient.addColorStop(0.4, 'white');
  gradient.addColorStop(1, 'black'); 

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  return new THREE.CanvasTexture(canvas);
}

// 2. Alpha Map OMBRA FAKE
function generateShadowAlpha() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient.addColorStop(0, 'white');   
  gradient.addColorStop(1, 'black');   

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  return new THREE.CanvasTexture(canvas);
}

// --- LAYER OMBRA FAKE ---
function FakeShadowLayer() {
  const alphaMap = useMemo(() => generateShadowAlpha(), []);

  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, 0.0001, 0]} 
      receiveShadow={false}
    >
      <circleGeometry args={[5, 100]} />
      <meshBasicMaterial 
        color="#524c4c" 
        alphaMap={alphaMap}
        transparent={true} 
        opacity={0.15} 
        depthWrite={false} 
      />
    </mesh>
  );
}

// --- SCENARIO 3: PAVIMENTO ---
function StudioFloor() {
  const props = useTexture({
    map: '/textures/ambiente/studio/color.jpg',
    normalMap: '/textures/ambiente/studio/normal.png', 
    roughnessMap: '/textures/ambiente/studio/roughness.jpg',
    aoMap: '/textures/ambiente/studio/ao.jpg',
  });

  useMemo(() => {
    Object.values(props).forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(3, 3); 
      t.colorSpace = THREE.SRGBColorSpace;
    });
    props.normalMap.colorSpace = THREE.NoColorSpace;
    props.roughnessMap.colorSpace = THREE.NoColorSpace;
    props.aoMap.colorSpace = THREE.NoColorSpace;
  }, [props]);

  const alphaMap = useMemo(() => generateFloorAlpha(), []);

  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      receiveShadow 
      renderOrder={-1} 
      // MODIFICA: Posizionato a -0.001 (appena sotto zero)
      position={[0, -0.0001, 0]}
    >
      <circleGeometry args={[7.5, 64]} />
      <meshStandardMaterial 
        {...props}
        alphaMap={alphaMap}
        transparent={true}
        opacity={1}
        roughness={0.9}
        metalness={0.1}
        side={THREE.DoubleSide} 
        color="#ffffff"
        depthWrite={false}
      />
    </mesh>
  );
}

// --- SCENARIO 3: LUCI E OMBRE ---
function StudioScene() {
  return (
    <group>
      <Environment preset="city" background={false} blur={1} />
      
      <ambientLight intensity={0.5} />
      
      <spotLight position={[5, 4, 5]} intensity={0.5} castShadow={false} />
      <spotLight position={[-5, 4, 5]} intensity={0.5} castShadow={false} />
      <spotLight position={[0, 5, -6]} intensity={1.2} angle={0.8} castShadow={false} />

      {/* FIX OMBRA REALE: Parametri ottimizzati per nitidezza e uniformità */}
      <directionalLight 
        position={[-6, 8, 4]} 
        intensity={2.0} 
        castShadow 
        // Risoluzione altissima per evitare bordi seghettati
        shadow-mapSize={[4096, 4096]} 
        // Bias finissimo per attaccare l'ombra all'oggetto
        shadow-bias={-0.0001} 
        // Normal bias ridotto per evitare distorsioni sulla mesh
        shadow-normalBias={0.02}
        // Radius basso per un'ombra più definita e realistica (tipo sole)
        shadow-radius={2} 
        // Estensione della camera dell'ombra per non tagliare nulla
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Gruppo Scenografia (Pavimento + Fake Shadow) */}
      {/* Posizionato a 0 in Y, con offset X e Z */}
      <group position={[SCENE_X_SHIFT, 0, SCENE_Z_SHIFT]}>
        <StudioFloor />
        <FakeShadowLayer />
      </group>
      
    </group>
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

  const handleScenarioChange = (newScenario) => {
    if (newScenario === scenario || isScenarioSwitching) return;
    setIsScenarioSwitching(true);
    setScenario(newScenario);
    setIsScenarioMenuOpen(false);
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

  const backgroundColor = scenario === 'studio' ? STUDIO_BG_COLOR : '#f4f4f4';

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

                  <button 
                    className={`ui-btn ${isScenarioMenuOpen ? 'active' : ''}`}
                    onClick={() => !isSwitching && setIsScenarioMenuOpen(!isScenarioMenuOpen)}
                    title="Cambia Ambiente"
                  >
                    <TbHomeEdit size={26} />
                  </button>
                </div>

            </div>

            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.5, 5], fov: 40 }}>
              <color attach="background" args={[backgroundColor]} />
              
              {scenario === 'studio' && (
                 <fog attach="fog" args={[backgroundColor, 6, 14]} />
              )}
              
              <Suspense fallback={<Loader />}>
                  {scenario === 'studio' && <StudioScene />}

                  {/* MODIFICA: Gruppo posizionato a 0 (zero) */}
                  <group position={[0, 0, 0]}>
                      {scenario !== 'studio' && (
                          <>
                            <ambientLight intensity={0.6} />
                            <directionalLight 
                              position={[8, 12, 5]} 
                              intensity={1.5} 
                              castShadow 
                              shadow-mapSize={[2048, 2048]} 
                              shadow-bias={-0.0001}
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