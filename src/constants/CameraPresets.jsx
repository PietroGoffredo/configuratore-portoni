export const CAMERA_PRESETS = [
  { id: 'ext_1', type: 'external', position: [0.5, 1.50, 4.5], target: [0.5, 1.25, 0], label: 'Fronte' },
  // Lati X avvicinati al centro (2.2 e -1.2) per stare nel nuovo limite di 30 gradi
  { id: 'ext_2', type: 'external', position: [2.2, 1.50, 4.0], target: [0.5, 1.25, 0], label: 'Lato Dx' },
  { id: 'ext_3', type: 'external', position: [-1.2, 1.50, 4.0], target: [0.5, 1.25, 0], label: 'Lato Sx' },
  { id: 'ext_4', type: 'external', position: [1.8, 1.30, 2.5], target: [0.5, 1.10, 0], label: 'Dett. Fr' },
  
  { id: 'int_1', type: 'internal', position: [0.5, 1.50, -4.5], target: [0.5, 1.25, 0], label: 'Retro' },
  // Stesso adattamento logico e matematico per l'interno
  { id: 'int_2', type: 'internal', position: [-1.2, 1.50, -4.0], target: [0.5, 1.25, 0], label: 'Retro Dx' },
  { id: 'int_3', type: 'internal', position: [2.2, 1.50, -4.0], target: [0.5, 1.25, 0], label: 'Retro Sx' },
  { id: 'int_4', type: 'internal', position: [1.8, 1.30, -2.5], target: [0.5, 1.10, 0], label: 'Dett. Re' }
];