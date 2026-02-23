import React, { useState, Suspense, useTransition, useEffect, useRef, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { TbDoorEnter, TbDoorExit, TbArrowsMaximize, TbArrowsMinimize, TbPhoto, TbHome, TbBuilding, TbHomeEdit, TbCamera, TbView360Number, TbChevronLeft, TbChevronRight } from "react-icons/tb"; 

import Navbar from './components/ui/Navbar';
import Footer from './components/ui/Footer';
import ScrollToTop from './components/ui/ScrollToTop';
import Interface from './components/ui/Interface';

import { GruppoEsterno, GruppoInterno, GruppoComune } from './components/3d/DoorParts';
import { Model as VillaTestModel } from './components/Villa_Test_React'; 

import { TEXTURES_DATA } from './constants/data';
import './styles/App.css';

const STUDIO_BG_COLOR = "#eeeeee"; 
const SCENE_X_SHIFT = 0.5;  
const SCENE_Z_SHIFT = 0.1; 

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

function CameraController({ activeAngle, isBlackout, is3DMode, cameraTrigger }) {
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
      if (!is3DMode || isFirstRender.current) {
        camera.position.set(...activeAngle.position);
        controlsRef.current.target.set(...activeAngle.target);
        controlsRef.current.update();
        isFirstRender.current = false;
        isAnimating.current = false;
        controlsRef.current.enableRotate = is3DMode;
        controlsRef.current.enableZoom = is3DMode;
      } else {
        if (isBlackout) {
          camera.position.set(...activeAngle.position);
          controlsRef.current.target.set(...activeAngle.target);
          controlsRef.current.update();
          isAnimating.current = false;
          controlsRef.current.enableRotate = is3DMode;
          controlsRef.current.enableZoom = is3DMode;
        } else {
          startPos.current.copy(camera.position);
          startTarget.current.copy(controlsRef.current.target);
          endPos.current.set(...activeAngle.position);
          endTarget.current.set(...activeAngle.target);
          startTime.current = 0;
          isAnimating.current = true;
          controlsRef.current.enableRotate = false;
          controlsRef.current.enableZoom = false;
        }
      }
    }
  }, [activeAngle, cameraTrigger, is3DMode]); 

  useFrame(({ clock }) => {
    if (isAnimating.current && controlsRef.current) {
      if (startTime.current === 0) startTime.current = clock.getElapsedTime();
      const elapsed = clock.getElapsedTime() - startTime.current;
      let progress = elapsed / ANIMATION_DURATION;

      if (progress >= 1.0) {
        progress = 1.0;
        isAnimating.current = false;
        if (is3DMode) {
          controlsRef.current.enableRotate = true;
          controlsRef.current.enableZoom = true;
        }
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
      ref={controlsRef} makeDefault enablePan={false} 
      enableZoom={is3DMode} enableRotate={is3DMode}
      minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.05} 
      minDistance={2} maxDistance={7}
    />
  );
}

function generateFloorAlpha() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(256, 256, 100, 256, 256, 256);
  gradient.addColorStop(0, 'white'); gradient.addColorStop(0.4, 'white'); gradient.addColorStop(1, 'black'); 
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 512, 512);
  return new THREE.CanvasTexture(canvas);
}

function generateShadowAlpha() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient.addColorStop(0, 'white'); gradient.addColorStop(1, 'black');   
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 512, 512);
  return new THREE.CanvasTexture(canvas);
}

function FakeShadowLayer() {
  const alphaMap = useMemo(() => generateShadowAlpha(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0001, 0]} receiveShadow={false}>
      <circleGeometry args={[5, 100]} />
      <meshBasicMaterial color="#351616" alphaMap={alphaMap} transparent={true} opacity={0.2} depthWrite={false} />
    </mesh>
  );
}

function StudioFloor() {
  const props = useTexture({
    map: '/textures/ambiente/studio/color.jpg', normalMap: '/textures/ambiente/studio/normal.png', 
    roughnessMap: '/textures/ambiente/studio/roughness.jpg', aoMap: '/textures/ambiente/studio/ao.jpg',
  });
  useMemo(() => {
    Object.values(props).forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.SRGBColorSpace;
    });
    props.normalMap.colorSpace = THREE.NoColorSpace; props.roughnessMap.colorSpace = THREE.NoColorSpace; props.aoMap.colorSpace = THREE.NoColorSpace;
  }, [props]);
  const alphaMap = useMemo(() => generateFloorAlpha(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow renderOrder={-1} position={[0, -0.0001, 0]}>
      <circleGeometry args={[7.5, 64]} />
      <meshStandardMaterial {...props} alphaMap={alphaMap} transparent={true} opacity={1} roughness={0.9} metalness={0.1} side={THREE.DoubleSide} color="#ffffff" depthWrite={false} />
    </mesh>
  );
}

function StudioScene() {
  return (
    <group>
      <Environment preset="city" background={false} blur={0.8} environmentIntensity={0.5} />
      <ambientLight intensity={1.3} />
      <spotLight position={[-1.5, 2, 2]} intensity={2} penumbra={1} castShadow={false} />
      <spotLight position={[3.5, 1.5, -2]} intensity={1} penumbra={1} castShadow={false} />
      <spotLight position={[0, 2.5, -3]} intensity={1.5} angle={0.8} castShadow={false} />
      <directionalLight position={[-3, 12, 5]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0001} shadow-radius={3} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} />
      <group position={[SCENE_X_SHIFT, 0, SCENE_Z_SHIFT]}>
        <StudioFloor />
        <FakeShadowLayer />
      </group>
    </group>
  );
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
  const [openSections, setOpenSections] = useState({ esterni: true, interni: true });
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasContainerRef = useRef(null); 
  
  const [isBlackout, setIsBlackout] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const [scenarioFade, setScenarioFade] = useState({ active: false, image: null, faded: false });
  const [scenario, setScenario] = useState('studio');
  const [isScenarioMenuOpen, setIsScenarioMenuOpen] = useState(false);
  const [isScenarioSwitching, setIsScenarioSwitching] = useState(false);

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
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);
  const [isDraggingUI, setIsDraggingUI] = useState(false);
  
  const [dragUI, setDragUI] = useState({ 
    active: false, image: null, clipPath: 'inset(0 0 0 0)', offset: 0, 
    finalOffset: 0, finalClipPath: 'inset(0 0 0 0)', animating: false, duration: 0.55 
  });

  const [zoomConfig, setZoomConfig] = useState({ active: false, originX: 50, originY: 50, x: 0, y: 0, instant: false });
  
  const currentPresetIndexRef = useRef(0);
  const current3DAngleIdRef = useRef(CAMERA_PRESETS[0].id);

  const dragRef = useRef({ 
    isDragging: false, startX: 0, startY: 0, currentX: 0, startTime: 0,
    moved: false, containerWidth: 0, hasCaptured: false, direction: null, 
    targetIndex: 0, originalIndex: 0, history: [] 
  });

  const [activeAngle, setActiveAngle] = useState(CAMERA_PRESETS[0]);
  const [uiActiveAngleId, setUiActiveAngleId] = useState(CAMERA_PRESETS[0].id);
  const [cameraTrigger, setCameraTrigger] = useState(0); 

  const transitionTokenRef = useRef(0);
  const scenarioMenuRef = useRef(null);
  const [isPending, startTransition] = useTransition();
  const [loadingState, setLoadingState] = useState({ category: null, id: null });

  const webglContextRef = useRef(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  useEffect(() => {
    if (isMobile && interactionMode === '3d') setInteractionMode('static');
  }, [isMobile, interactionMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (scenarioMenuRef.current && !scenarioMenuRef.current.contains(event.target)) setIsScenarioMenuOpen(false);
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
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) {
        setIsPhotoZoomed(false);
        setIsDraggingUI(false); 
        setZoomConfig(prev => ({ ...prev, active: false, x: 0, y: 0, instant: true }));
        setTimeout(() => setZoomConfig(prev => ({ ...prev, instant: false })), 50);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const change3DScene = (angle) => {
      if (!angle) return;
      if (angle.type !== viewMode) setViewMode(angle.type);
      setActiveAngle(angle);
      current3DAngleIdRef.current = angle.id;
      setCameraTrigger(Date.now());
  };

  const resetToIdle = () => {
      const correctAngle = CAMERA_PRESETS[currentPresetIndexRef.current];
      const needsSync = current3DAngleIdRef.current !== correctAngle.id || viewMode !== correctAngle.type;
      
      if (needsSync) {
        change3DScene(correctAngle);
        setTimeout(() => {
            setDragUI({ active: false, image: null, clipPath: 'inset(0 0 0 0)', finalClipPath: 'inset(0 0 0 0)', offset: 0, finalOffset: 0, animating: false, duration: 0.55 });
        }, 150); 
      } else {
        setDragUI({ active: false, image: null, clipPath: 'inset(0 0 0 0)', finalClipPath: 'inset(0 0 0 0)', offset: 0, finalOffset: 0, animating: false, duration: 0.55 });
      }
  };

  const cancelDrag = () => {
    if (!dragRef.current.isDragging) return;

    if (!zoomConfig.active && interactionMode === 'static' && dragRef.current.hasCaptured) {
        const token = Date.now();
        transitionTokenRef.current = token;

        currentPresetIndexRef.current = dragRef.current.originalIndex;
        setUiActiveAngleId(CAMERA_PRESETS[dragRef.current.originalIndex].id);

        setDragUI(prev => ({
            ...prev, animating: true, duration: 0.25, finalOffset: 0, finalClipPath: 'inset(0 0 0 0)'
        }));

        setTimeout(() => {
            if (transitionTokenRef.current === token) {
               const origAngle = CAMERA_PRESETS[dragRef.current.originalIndex];
               if (origAngle.type !== viewMode) setViewMode(origAngle.type);
               setActiveAngle(origAngle);
               setCameraTrigger(Date.now());

               setTimeout(() => {
                   if (transitionTokenRef.current === token) {
                      setDragUI({ active: false, image: null, clipPath: 'inset(0 0 0 0)', finalClipPath: 'inset(0 0 0 0)', offset: 0, finalOffset: 0, animating: false, duration: 0.55 });
                   }
               }, 150); 
            }
        }, 250); 
    } else if (!zoomConfig.active) {
        setDragUI({ active: false, image: null, clipPath: 'inset(0 0 0 0)', finalClipPath: 'inset(0 0 0 0)', offset: 0, finalOffset: 0, animating: false, duration: 0.55 });
    }

    if (dragRef.current.element) {
        try { dragRef.current.element.releasePointerCapture(dragRef.current.pointerId); } catch(err){}
    }
    dragRef.current.isDragging = false;
    setIsDraggingUI(false);
  };

  const executeWipeTransition = async (direction, targetIndex) => {
    const isNext = direction === 'next';
    const targetAngle = CAMERA_PRESETS[targetIndex];

    currentPresetIndexRef.current = targetIndex;
    setUiActiveAngleId(targetAngle.id); 

    let image = dragUI.active ? dragUI.image : null;
    
    if (!image && webglContextRef.current) {
        const { gl, scene, camera } = webglContextRef.current;
        gl.render(scene, camera);
        image = gl.domElement.toDataURL('image/jpeg', 0.9);
    }

    const token = Date.now();
    transitionTokenRef.current = token;

    setDragUI({
        active: true, image, animating: false, offset: 0, finalOffset: 0, duration: 0.55,
        clipPath: 'inset(0 0 0 0)', finalClipPath: 'inset(0 0 0 0)'
    });

    await new Promise(r => setTimeout(r, 20)); 
    if (transitionTokenRef.current !== token) return;
    
    change3DScene(targetAngle);
    
    await new Promise(r => setTimeout(r, 40)); 
    if (transitionTokenRef.current !== token) return;

    const width = window.innerWidth;
    const finalX = isNext ? -width * 0.05 : width * 0.05;
    const finalClip = isNext ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';

    setDragUI(prev => ({
        ...prev, animating: true, duration: 0.55,
        finalOffset: finalX,
        finalClipPath: finalClip
    }));

    setTimeout(() => {
        if (transitionTokenRef.current === token) {
            resetToIdle();
        }
    }, 550); 
  };

  const handleGalleryNavigation = (direction, forcedTargetIndex = null) => {
    if (isSwitching || isScenarioSwitching || isTakingPhoto || isInteractionModeSwitching || dragUI.active) return;
    
    let currentIndex = currentPresetIndexRef.current;
    let newIndex = forcedTargetIndex !== null ? forcedTargetIndex : 
        (direction === 'next' ? (currentIndex + 1) % CAMERA_PRESETS.length : (currentIndex - 1 + CAMERA_PRESETS.length) % CAMERA_PRESETS.length);
    
    if (currentIndex === newIndex) return;

    currentPresetIndexRef.current = newIndex;

    if (zoomConfig.active) {
        setIsPhotoZoomed(false);
        setIsDraggingUI(false);
        setZoomConfig(prev => ({ ...prev, active: false, x: 0, y: 0, instant: true }));
    }

    executeWipeTransition(direction, newIndex);
  };

  const handlePointerDown = (e) => {
    if (interactionMode !== 'static') return;
    if (!zoomConfig.active && dragUI.active) return;
    
    try { e.target.setPointerCapture(e.pointerId); } catch(err){}
    e.preventDefault();
    
    const token = Date.now();
    transitionTokenRef.current = token;
    setUiActiveAngleId(CAMERA_PRESETS[currentPresetIndexRef.current].id); 

    const rect = canvasContainerRef.current.getBoundingClientRect();
    
    let image = null;
    if (webglContextRef.current && !zoomConfig.active) {
        const { gl, scene, camera } = webglContextRef.current;
        gl.render(scene, camera);
        image = gl.domElement.toDataURL('image/jpeg', 0.9);
        setDragUI({ 
            active: true, image, animating: false, offset: 0, finalOffset: 0, duration: 0.55,
            clipPath: 'inset(0 0 0 0)', finalClipPath: 'inset(0 0 0 0)' 
        });
    }

    dragRef.current = {
      isDragging: true, startX: e.clientX, startY: e.clientY, currentX: e.clientX, startTime: Date.now(),
      lastX: zoomConfig.x, lastY: zoomConfig.y, 
      moved: false, containerWidth: rect.width,
      hasCaptured: false, direction: null, targetIndex: 0, originalIndex: currentPresetIndexRef.current,
      history: [{ x: e.clientX, time: Date.now() }],
      pointerId: e.pointerId, element: e.target
    };

    if (zoomConfig.active) setIsDraggingUI(true); 
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.isDragging) return;
    dragRef.current.currentX = e.clientX;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    dragRef.current.history.push({ x: e.clientX, time: Date.now() });
    if (dragRef.current.history.length > 6) dragRef.current.history.shift();
    
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;

    if (zoomConfig.active) {
      setDragUI({active: false, image: null}); 
      setZoomConfig(prev => ({ ...prev, x: dragRef.current.lastX + (dx / 4.5), y: dragRef.current.lastY + (dy / 4.5) }));
    } else {
      const width = dragRef.current.containerWidth;
      
      const photoDx = dx * 0.05; 
      const cutPx = Math.abs(dx) * 0.85; 
      let percent = Math.min((cutPx / width) * 100, 100);

      if (!dragRef.current.hasCaptured && Math.abs(dx) > 15) {
          dragRef.current.hasCaptured = true;
          
          const dir = dx < 0 ? 'next' : 'prev';
          dragRef.current.direction = dir;
          const currentIndex = dragRef.current.originalIndex;
          const nextIndex = dir === 'next' ? (currentIndex + 1) % CAMERA_PRESETS.length : (currentIndex - 1 + CAMERA_PRESETS.length) % CAMERA_PRESETS.length;
          
          dragRef.current.targetIndex = nextIndex;
          const tAngle = CAMERA_PRESETS[nextIndex];
          
          setTimeout(() => {
              if (dragRef.current.isDragging || dragRef.current.moved) {
                  change3DScene(tAngle);
              }
          }, 40); 
      } 
      
      if (dragRef.current.hasCaptured) {
          if (dragRef.current.direction === 'next') {
              setDragUI(prev => ({ ...prev, animating: false, offset: photoDx, clipPath: `inset(0 ${percent}% 0 0)` }));
          } else {
              setDragUI(prev => ({ ...prev, animating: false, offset: photoDx, clipPath: `inset(0 0 0 ${percent}%)` }));
          }
      }
    }
  };

  const handlePointerUp = (e) => {
    try { e.target.releasePointerCapture(e.pointerId); } catch(err){}
    if (!dragRef.current.isDragging) return;
    
    if (!zoomConfig.active && interactionMode === 'static' && dragRef.current.hasCaptured) {
      const endX = e.clientX || dragRef.current.currentX;
      const dx = endX - dragRef.current.startX;
      const now = Date.now();
      const history = dragRef.current.history;
      
      let pastPoint = history[0];
      for(let i = history.length - 1; i >= 0; i--) {
          if (now - history[i].time >= 50) {
              pastPoint = history[i];
              break;
          }
      }
      
      const dt = Math.max(now - pastPoint.time, 1);
      const terminalVelocity = Math.abs(endX - pastPoint.x) / dt;
      const width = dragRef.current.containerWidth;
      const absDx = Math.abs(dx);

      if (absDx < width * 0.05) {
          cancelDrag();
          return;
      }

      const isSlowAndFar = absDx >= width * 0.50;
      const isFastFlick = terminalVelocity > 0.65;

      const currentDir = dx < 0 ? 'next' : 'prev';
      const isValidDir = currentDir === dragRef.current.direction;

      if (isValidDir && (isSlowAndFar || isFastFlick)) {
          const isNext = dragRef.current.direction === 'next';
          const finalPhotoDx = isNext ? -width * 0.05 : width * 0.05; 
          const finalClip = isNext ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';

          currentPresetIndexRef.current = dragRef.current.targetIndex;
          setUiActiveAngleId(CAMERA_PRESETS[dragRef.current.targetIndex].id); 

          setDragUI(prev => ({
              ...prev, animating: true, duration: 0.55,
              finalOffset: finalPhotoDx,
              finalClipPath: finalClip
          }));
          
          const token = Date.now();
          transitionTokenRef.current = token;
          setTimeout(() => {
              if (transitionTokenRef.current === token) {
                  resetToIdle();
              }
          }, 550); 

      } else {
          cancelDrag();
          return; 
      }
    } else {
        cancelDrag();
        return;
    }

    dragRef.current.isDragging = false;
    setIsDraggingUI(false); 
  };

  const handlePointerCancel = (e) => {
    try { e.target.releasePointerCapture(e.pointerId); } catch(err){}
    cancelDrag();
  };

  const handleStaticClick = (e) => {
    if (interactionMode !== 'static' || isSwitching || isScenarioSwitching || isInteractionModeSwitching || dragUI.active) return;
    if (dragRef.current.moved) { dragRef.current.moved = false; return; }

    if (!document.fullscreenElement) {
      toggleFullscreen();
    } else {
      if (zoomConfig.active) {
        setIsPhotoZoomed(false);
        setIsDraggingUI(false);
        setZoomConfig(prev => ({ ...prev, active: false, x: 0, y: 0, instant: false }));
      } else {
        setIsPhotoZoomed(true);
        if (canvasContainerRef.current) {
          const rect = canvasContainerRef.current.getBoundingClientRect();
          const ox = ((e.clientX - rect.left) / rect.width) * 100;
          const oy = ((e.clientY - rect.top) / rect.height) * 100;
          setZoomConfig({ active: true, originX: ox, originY: oy, x: 0, y: 0, instant: false });
        }
      }
    }
  };

  const handleAngleSelect = (angle) => {
    if (isSwitching || isScenarioSwitching || isTakingPhoto || isInteractionModeSwitching || dragUI.active) return;

    if (interactionMode === 'static') {
       const currentIndex = currentPresetIndexRef.current;
       const targetIndex = CAMERA_PRESETS.findIndex(p => p.id === angle.id);
       if (currentIndex === targetIndex) return;
       const direction = targetIndex > currentIndex ? 'next' : 'prev';
       handleGalleryNavigation(direction, targetIndex);
       return;
    }

    const isVilla = scenario !== 'studio';
    const needsViewSwitch = isVilla && angle.type !== viewMode;

    setUiActiveAngleId(angle.id);

    if (needsViewSwitch && interactionMode === '3d') {
      setIsSwitching(true);
      setIsBlackout(true);
      setTimeout(() => {
        setViewMode(angle.type);
        setActiveAngle(angle); 
        setCameraTrigger(Date.now()); 
        setTimeout(() => {
          setIsBlackout(false);
          setTimeout(() => {
            setIsSwitching(false);
          }, 500); 
        }, 100);
      }, 500); 
    } else {
      if (angle.type !== viewMode) setViewMode(angle.type);
      setActiveAngle(angle);
      setCameraTrigger(Date.now());
    }
  };

  const handleViewChange = (mode) => {
    if (mode === viewMode || isSwitching || isInteractionModeSwitching || dragUI.active) return;
    const defaultAngle = CAMERA_PRESETS.find(a => a.type === mode);
    
    if (interactionMode === 'static') {
      const targetIndex = CAMERA_PRESETS.findIndex(p => p.id === defaultAngle.id);
      handleGalleryNavigation('next', targetIndex);
      return;
    }
    
    const isVilla = scenario !== 'studio';

    if (defaultAngle) setUiActiveAngleId(defaultAngle.id);

    if (isVilla && interactionMode === '3d') {
      setIsSwitching(true);
      setIsBlackout(true); 
      setTimeout(() => {
        setViewMode(mode); 
        if(defaultAngle) {
          setActiveAngle(defaultAngle);
          setCameraTrigger(Date.now());
        }
        setTimeout(() => {
          setIsBlackout(false); 
          setTimeout(() => {
            setIsSwitching(false);
          }, 500); 
        }, 100); 
      }, 500); 
    } else {
      setViewMode(mode);
      if(defaultAngle) {
        setActiveAngle(defaultAngle);
        setCameraTrigger(Date.now());
      }
    }
  };

  const handleScenarioChange = async (newScenario) => {
    if (newScenario === scenario || isScenarioSwitching || isSwitching || isTakingPhoto || isInteractionModeSwitching) return;
    
    setIsScenarioSwitching(true);
    if (zoomConfig.active) {
        setIsPhotoZoomed(false);
        setIsDraggingUI(false);
        setZoomConfig(prev => ({ ...prev, active: false, x: 0, y: 0, instant: true }));
    }
    
    if (webglContextRef.current) {
      const { gl, scene, camera } = webglContextRef.current;
      gl.render(scene, camera); 
      setScenarioFade({ active: true, image: gl.domElement.toDataURL('image/jpeg', 1.0), faded: false });
    }
    
    await new Promise(resolve => setTimeout(resolve, 50));
    setScenario(newScenario);
    setIsScenarioMenuOpen(false); 
    
    setTimeout(() => {
      setScenarioFade(prev => ({ ...prev, faded: true })); 
      setTimeout(() => {
          setScenarioFade({ active: false, image: null, faded: false });
          setIsScenarioSwitching(false); 
      }, 500); 
    }, 100); 
  };

  const toggleInteractionMode = () => {
    if (isInteractionModeSwitching || isSwitching || isScenarioSwitching || isTakingPhoto || dragUI.active) return;
    setIsInteractionModeSwitching(true);
    
    if (zoomConfig.active) {
        setIsPhotoZoomed(false);
        setIsDraggingUI(false);
        setZoomConfig(prev => ({ ...prev, active: false, x: 0, y: 0, instant: true }));
    }
    
    setTimeout(() => {
      setInteractionMode(prev => prev === 'static' ? '3d' : 'static');
      setIsInteractionModeSwitching(false);
    }, 400); 
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (canvasContainerRef.current) await canvasContainerRef.current.requestFullscreen();
      } else {
        if (zoomConfig.active) {
            setIsPhotoZoomed(false);
            setIsDraggingUI(false);
            setZoomConfig(prev => ({ ...prev, active: false, x: 0, y: 0, instant: true }));
        }
        if (document.exitFullscreen) await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Errore Fullscreen:", err);
    }
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
  const toggleSection = (section) => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  const extState = { finish: extFinish, setFinish: (item) => handleTextureChange(setExtFinish, item, 'ext_main') };
  const intState = { finish: intFinish, setFinish: (item) => handleTextureChange(setIntFinish, item, 'int_main') };

  const backgroundColor = scenario === 'studio' ? STUDIO_BG_COLOR : '#dce8f2'; 

  return (
    <div className="main-layout" id="main-scroll-container">
      <Navbar />

      <div className="configurator-section">
        <div className="left-sticky-column">
          
          <div className="canvas-frame" ref={canvasContainerRef}>
            
            <div className="canvas-inner-wrapper" style={{ overflow: 'hidden' }}>
              
              <div className={`blackout-overlay ${isBlackout ? 'active' : ''}`}></div>

              {scenarioFade.active && scenarioFade.image && (
                <img 
                  src={scenarioFade.image} 
                  alt="scenario-fade" 
                  className={`scenario-fade-overlay ${scenarioFade.faded ? 'faded' : ''}`} 
                />
              )}

              {dragUI.active && dragUI.image && (
                <img 
                  src={dragUI.image} 
                  draggable={false}
                  alt="dragging"
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
                  gl={{ 
                    preserveDrawingBuffer: true,
                    toneMapping: THREE.ACESFilmicToneMapping, 
                    toneMappingExposure: 1.0
                  }}
                >
                  <WebGLContextHelper contextRef={webglContextRef} />
                  <color attach="background" args={[backgroundColor]} />
                  {scenario === 'studio' && <fog attach="fog" args={[backgroundColor, 8, 20]} />}
                  {scenario !== 'studio' && <fog attach="fog" args={[backgroundColor, 20, 60]} />} 
                  
                  <Suspense fallback={null}>
                      <SceneReadyTrigger setLoaded={setIsLoadingInitial} />
                      
                      {scenario === 'studio' && <StudioScene />}
                      
                      <group position={[0, 0, 0]}>
                          {scenario !== 'studio' && (
                              <>
                                {/* Luce di riempimento morbida */}
                                <ambientLight intensity={0.3} color="#ffffff" />
                                
                                {/* Sole con ombre morbide gestite da shadow-radius e mappa 2048px */}
                                <directionalLight 
                                  position={[15, 20, 10]} 
                                  intensity={2.5} 
                                  color="#fff4e5" 
                                  castShadow 
                                  shadow-mapSize={[2048, 2048]} 
                                  shadow-bias={-0.0001}
                                  shadow-normalBias={0.02}
                                  shadow-camera-far={50}
                                  shadow-camera-left={-15}
                                  shadow-camera-right={15}
                                  shadow-camera-top={15}
                                  shadow-camera-bottom={-15}
                                  shadow-radius={8} 
                                />
                                
                                {/* L'IMPORTAZIONE DEL TUO FILE HDRI */}
                                <Environment files="/textures/cielo.exr" background={true} blur={0.05} environmentIntensity={0.8} />
                                
                                <VillaTestModel />
                              </>
                          )}
                          <group>
                            <GruppoComune scenario={scenario} />
                            <GruppoInterno config={intFinish} viewMode={viewMode} scenario={scenario} />
                            <GruppoEsterno config={extFinish} viewMode={viewMode} scenario={scenario} />
                          </group>
                      </group>
                  </Suspense>
                  <CameraController 
                     activeAngle={activeAngle} 
                     isBlackout={isBlackout} 
                     is3DMode={interactionMode === '3d'} 
                     cameraTrigger={cameraTrigger}
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

            <div className="canvas-ui-overlay">
                
                <button 
                  className="ui-btn btn-fullscreen" 
                  onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                  onMouseLeave={(e) => e.currentTarget.blur()}
                  data-label={isFullscreen ? "Chiudi" : "Schermo Intero"}
                >
                  {isFullscreen ? <TbArrowsMinimize size={26} /> : <TbArrowsMaximize size={26} />}
                </button>

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
                  
                  <div className="scenario-control-container" ref={scenarioMenuRef}>
                    <div className={`scenario-popup-menu ${isScenarioMenuOpen ? 'open' : ''}`}>
                      <div className="scenario-options-wrapper">
                        <button 
                          className={`ui-btn scenario-option ${scenario === 'modern' ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); handleScenarioChange('modern'); }}
                          onMouseLeave={(e) => e.currentTarget.blur()}
                          data-label="Villa Moderna"
                          style={{ pointerEvents: isScenarioSwitching ? 'none' : 'auto' }}
                        >
                          <TbBuilding size={22} />
                        </button>
                        <button 
                          className={`ui-btn scenario-option ${scenario === 'classic' ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); handleScenarioChange('classic'); }}
                          onMouseLeave={(e) => e.currentTarget.blur()}
                          data-label="Villa Classica"
                          style={{ pointerEvents: isScenarioSwitching ? 'none' : 'auto' }}
                        >
                          <TbHome size={22} />
                        </button>
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