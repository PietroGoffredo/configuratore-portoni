import React, { useState, Suspense, useTransition, useEffect, useRef, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { TbDoorEnter, TbDoorExit, TbArrowsMaximize, TbArrowsMinimize, TbPhoto, TbHome, TbBuilding, TbHomeEdit, TbCamera } from "react-icons/tb"; 

import Navbar from './components/ui/Navbar';
import Footer from './components/ui/Footer';
import ScrollToTop from './components/ui/ScrollToTop';
import Interface from './components/ui/Interface';

import { GruppoEsterno, GruppoInterno, GruppoComune } from './components/3d/DoorParts';
import { TEXTURES_DATA } from './constants/data';
import './styles/App.css';

// --- CONFIGURAZIONE VISIVA STUDIO ---
const STUDIO_BG_COLOR = "#eeeeee"; 

// --- OFFSET DI POSIZIONAMENTO SCENOGRAFIA ---
const SCENE_X_SHIFT = 0.5;  
const SCENE_Z_SHIFT = 0.1; 

// --- PRESET ANGOLAZIONI ---
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

// --- HELPER PER SCREENSHOT WEBGL ALTA QUALITÀ ---
function WebGLContextHelper({ contextRef }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    contextRef.current = { gl, scene, camera };
  }, [gl, scene, camera, contextRef]);
  return null;
}

// --- CONTROLLO CAMERA ANIMATO ---
function CameraController({ activeAngle, isBlackout }) {
  const controlsRef = useRef();
  const { camera } = useThree();
  
  const startPos = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const endPos = useRef(new THREE.Vector3());
  const endTarget = useRef(new THREE.Vector3());
  
  const isAnimating = useRef(false);
  const startTime = useRef(0);
  const isFirstRender = useRef(true); 
  const ANIMATION_DURATION = 1.5; 
  
  const easeInOutCubic = (t) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  useEffect(() => {
    if (activeAngle && controlsRef.current) {
      if (isFirstRender.current) {
        camera.position.set(...activeAngle.position);
        controlsRef.current.target.set(...activeAngle.target);
        controlsRef.current.update();
        isFirstRender.current = false;
      } 
      else if (isBlackout) {
        camera.position.set(...activeAngle.position);
        controlsRef.current.target.set(...activeAngle.target);
        controlsRef.current.update();
        isAnimating.current = false;
      } 
      else {
        startPos.current.copy(camera.position);
        startTarget.current.copy(controlsRef.current.target);
        endPos.current.set(...activeAngle.position);
        endTarget.current.set(...activeAngle.target);
        
        startTime.current = 0;
        isAnimating.current = true;
      }
    }
  }, [activeAngle, camera]); 

  useEffect(() => {
    const controls = controlsRef.current;
    const onStartDrag = () => { isAnimating.current = false; };
    if (controls) controls.addEventListener('start', onStartDrag);
    return () => { if (controls) controls.removeEventListener('start', onStartDrag); };
  }, []);

  useFrame(({ clock }) => {
    if (isAnimating.current && controlsRef.current) {
      if (startTime.current === 0) startTime.current = clock.getElapsedTime();
      
      const elapsed = clock.getElapsedTime() - startTime.current;
      let progress = elapsed / ANIMATION_DURATION;

      if (progress >= 1.0) {
        progress = 1.0;
        isAnimating.current = false;
      }

      const easeProgress = easeInOutCubic(progress);

      const currentTarget = new THREE.Vector3().lerpVectors(startTarget.current, endTarget.current, easeProgress);
      controlsRef.current.target.copy(currentTarget);

      const startOffset = startPos.current.clone().sub(startTarget.current);
      const endOffset = endPos.current.clone().sub(endTarget.current);

      const startSpherical = new THREE.Spherical().setFromVector3(startOffset);
      const endSpherical = new THREE.Spherical().setFromVector3(endOffset);

      let thetaDiff = endSpherical.theta - startSpherical.theta;
      while (thetaDiff > Math.PI) thetaDiff -= 2 * Math.PI;
      while (thetaDiff < -Math.PI) thetaDiff += 2 * Math.PI;
      
      const currentTheta = startSpherical.theta + thetaDiff * easeProgress;
      const currentPhi = startSpherical.phi + (endSpherical.phi - startSpherical.phi) * easeProgress;
      const currentRadius = startSpherical.radius + (endSpherical.radius - startSpherical.radius) * easeProgress;

      const currentSpherical = new THREE.Spherical(currentRadius, currentPhi, currentTheta);
      const currentOffset = new THREE.Vector3().setFromSpherical(currentSpherical);
      
      camera.position.copy(currentTarget).add(currentOffset);
      
      controlsRef.current.update();
    }
  });
  
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
        color="#351616" 
        alphaMap={alphaMap}
        transparent={true} 
        opacity={0.2} 
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

// --- SCENARIO 3: LUCI E OMBRE DEFINITIVE ---
function StudioScene() {
  return (
    <group>
      <Environment preset="city" background={false} blur={0.8} environmentIntensity={0.5} />
      
      <ambientLight intensity={1.3} />
      
      <spotLight position={[-1.5, 2, 2]} intensity={2} penumbra={1} castShadow={false} />
      <spotLight position={[3.5, 1.5, -2]} intensity={1} penumbra={1} castShadow={false} />
      <spotLight position={[0, 2.5, -3]} intensity={1.5} angle={0.8} castShadow={false} />

      <directionalLight 
        position={[-3, 12, 5]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[2048, 2048]} 
        shadow-bias={-0.0001} 
        shadow-radius={3} 
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

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

  // NUOVI STATI PER LA DISSOLVENZA SCENARI (CROSSFADE FOTOGRAFICO)
  const [transitionImage, setTransitionImage] = useState(null);
  const [isTransitionFading, setIsTransitionFading] = useState(false);

  const [scenario, setScenario] = useState('studio');
  const [isScenarioMenuOpen, setIsScenarioMenuOpen] = useState(false);
  const [isScenarioSwitching, setIsScenarioSwitching] = useState(false);

  const [activeAngle, setActiveAngle] = useState(CAMERA_PRESETS[0]);

  const scenarioMenuRef = useRef(null);
  const [isPending, startTransition] = useTransition();
  const [loadingState, setLoadingState] = useState({ category: null, id: null });

  const webglContextRef = useRef(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (scenarioMenuRef.current && !scenarioMenuRef.current.contains(event.target)) {
        setIsScenarioMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleAngleSelect = (angle) => {
    if (isSwitching || isScenarioSwitching || isTakingPhoto) return;
    if (activeAngle.id === angle.id) return;

    const isVilla = scenario !== 'studio';
    const needsViewSwitch = isVilla && angle.type !== viewMode;

    if (needsViewSwitch) {
      setIsSwitching(true);
      setIsBlackout(true);
      
      setTimeout(() => {
        setViewMode(angle.type);
        setActiveAngle(angle); 
        
        setTimeout(() => {
          setIsBlackout(false);
          setTimeout(() => {
              setIsSwitching(false);
          }, 500); 
        }, 100);
      }, 500); 
    } else {
      if (angle.type !== viewMode) {
         setViewMode(angle.type);
      }
      setActiveAngle(angle);
    }
  };

  const handleViewChange = (mode) => {
    if (mode === viewMode || isSwitching) return;
    
    const isVilla = scenario !== 'studio';
    const defaultAngle = CAMERA_PRESETS.find(a => a.type === mode);

    if (isVilla) {
      setIsSwitching(true);
      setIsBlackout(true); 
      setTimeout(() => {
        setViewMode(mode); 
        if(defaultAngle) setActiveAngle(defaultAngle);

        setTimeout(() => {
          setIsBlackout(false); 
          setTimeout(() => {
              setIsSwitching(false);
          }, 500); 
        }, 100); 
      }, 500); 
    } else {
      setViewMode(mode);
      if(defaultAngle) setActiveAngle(defaultAngle);
    }
  };

  // LOGICA CROSSFADE SCENARIO: Dissolvenza diretta tra i due ambienti
  const handleScenarioChange = async (newScenario) => {
    if (newScenario === scenario || isScenarioSwitching || isSwitching || isTakingPhoto) return;
    
    setIsScenarioSwitching(true);
    
    // 1. Scatta un'immagine ad alta fedeltà della vista attuale prima di smontarla
    if (webglContextRef.current) {
      const { gl, scene, camera } = webglContextRef.current;
      gl.render(scene, camera); 
      const dataURL = gl.domElement.toDataURL('image/jpeg', 1.0);
      setTransitionImage(dataURL);
    }
    
    // 2. Attende che React dipinga l'immagine sullo schermo
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 3. Cambia scenario 3D sotto all'immagine (invisibile all'utente)
    setScenario(newScenario);
    setIsScenarioMenuOpen(false); 
    
    // 4. Inizia a sfumare l'immagine scattata lasciando emergere il nuovo scenario
    setTimeout(() => {
      setIsTransitionFading(true); 
      
      setTimeout(() => {
          setTransitionImage(null);
          setIsTransitionFading(false);
          setIsScenarioSwitching(false); 
      }, 500); 
    }, 150); 
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

  const handleTakePhoto = async () => {
    if (isTakingPhoto || !webglContextRef.current) return;
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
    link.download = 'Nordic 01.jpg';
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
            
            <div className="canvas-inner-wrapper">
              <div className={`blackout-overlay ${isBlackout ? 'active' : ''}`}></div>

              {/* OVERLAY IMMAGINE PER CROSSFADE TRANSIZIONE SCENARIO */}
              {transitionImage && (
                <img 
                  src={transitionImage} 
                  alt="transition" 
                  className={`scenario-transition-overlay ${isTransitionFading ? 'faded' : ''}`} 
                />
              )}

              <Canvas shadows dpr={[1, 2]} camera={{ position: CAMERA_PRESETS[0].position, fov: 40 }} gl={{ preserveDrawingBuffer: true }}>
                <WebGLContextHelper contextRef={webglContextRef} />
                
                <color attach="background" args={[backgroundColor]} />
                
                {scenario === 'studio' && (
                   <fog attach="fog" args={[backgroundColor, 8, 20]} />
                )}
                
                <Suspense fallback={<Loader />}>
                    {scenario === 'studio' && <StudioScene />}

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
                <CameraController activeAngle={activeAngle} isBlackout={isBlackout} />
              </Canvas>
            </div>

            <div className="canvas-ui-overlay">
                
                <button 
                  className="ui-btn btn-fullscreen" 
                  onClick={toggleFullscreen}
                  onMouseLeave={(e) => e.currentTarget.blur()}
                  data-label={isFullscreen ? "Chiudi" : "Schermo Intero"}
                >
                  {isFullscreen ? <TbArrowsMinimize size={26} /> : <TbArrowsMaximize size={26} />}
                </button>

                <div className={`view-controls-vertical ${scenario === 'studio' ? 'hidden-controls' : ''}`}>
                  <button 
                    className={`ui-btn btn-view ${viewMode === 'external' ? 'active' : ''}`} 
                    onClick={() => handleViewChange('external')}
                    onMouseLeave={(e) => e.currentTarget.blur()}
                    data-label="Vista Esterna"
                  >
                    <TbDoorEnter size={26} />
                  </button>
                  
                  <button 
                    className={`ui-btn btn-view ${viewMode === 'internal' ? 'active' : ''}`} 
                    onClick={() => handleViewChange('internal')}
                    onMouseLeave={(e) => e.currentTarget.blur()}
                    data-label="Vista Interna"
                  >
                    <TbDoorExit size={26} />
                  </button>
                </div>

                <div className="bottom-left-controls">
                  
                  <div className="scenario-control-container" ref={scenarioMenuRef}>
                    <div className={`scenario-popup-menu ${isScenarioMenuOpen ? 'open' : ''}`}>
                      <div className="scenario-options-wrapper">
                        <button 
                          className={`ui-btn scenario-option ${scenario === 'modern' ? 'active' : ''}`}
                          onClick={() => handleScenarioChange('modern')}
                          onMouseLeave={(e) => e.currentTarget.blur()}
                          data-label="Villa Moderna"
                          style={{ pointerEvents: isScenarioSwitching ? 'none' : 'auto' }}
                        >
                          <TbBuilding size={22} />
                        </button>
                        <button 
                          className={`ui-btn scenario-option ${scenario === 'classic' ? 'active' : ''}`}
                          onClick={() => handleScenarioChange('classic')}
                          onMouseLeave={(e) => e.currentTarget.blur()}
                          data-label="Villa Classica"
                          style={{ pointerEvents: isScenarioSwitching ? 'none' : 'auto' }}
                        >
                          <TbHome size={22} />
                        </button>
                        <button 
                          className={`ui-btn scenario-option ${scenario === 'studio' ? 'active' : ''}`}
                          onClick={() => handleScenarioChange('studio')}
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
                      onClick={() => !isSwitching && setIsScenarioMenuOpen(!isScenarioMenuOpen)}
                      onMouseLeave={(e) => e.currentTarget.blur()}
                      data-label="Cambia Ambiente"
                    >
                      <TbHomeEdit size={26} />
                    </button>
                  </div>

                  <button 
                    className="ui-btn"
                    onClick={handleTakePhoto}
                    onMouseLeave={(e) => e.currentTarget.blur()}
                    data-label="Scatta Foto"
                    disabled={isTakingPhoto}
                  >
                    {isTakingPhoto ? <div className="spinner spinner-sm"></div> : <TbCamera size={26} />}
                  </button>

                </div>
            </div>
          </div>
          
          <div className="camera-presets-wrapper">
             {CAMERA_PRESETS.map(preset => (
                <div 
                   key={preset.id}
                   className={`preset-box ${activeAngle.id === preset.id ? 'selected' : ''}`}
                   onClick={() => handleAngleSelect(preset)}
                   style={{ pointerEvents: (isSwitching || isScenarioSwitching || isTakingPhoto) ? 'none' : 'auto' }}
                >
                   <span className="preset-label">{preset.label}</span>
                </div>
             ))}
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