export const TEXTURES_DATA = {
  // FINITURE DISPONIBILI
  finishes: [
    // --- LACCATI (Colore Solido, Lisci) ---
    { id: 'laccato_0013', label: '0013 - Polo', category: 'laccato', hex: '#f9f8f4', isSolid: true, roughness: 0.2 },
    { id: 'laccato_0014', label: '0014 - Gobi', category: 'laccato', hex: '#d6d2c7', isSolid: true, roughness: 0.2 },
    { id: 'laccato_3096', label: '3096 - Bianco', category: 'laccato', hex: '#f9f7eb', isSolid: true, roughness: 0.2 },
    { id: 'laccato_3151', label: '3151 - Tortora', category: 'laccato', hex: '#a39a89', isSolid: true, roughness: 0.2 },
    { id: 'laccato_0043', label: '0043 - Luce', category: 'laccato', hex: '#ddd9ce', isSolid: true, roughness: 0.2 },
    { id: 'laccato_0045', label: '0045 - Grano', category: 'laccato', hex: '#a59d90', isSolid: true, roughness: 0.2 },

    // --- HPL SOLIDI (Colore Solido, Lisci, Core Nero) ---
    { id: 'hpl_113', label: 'HPL 113', category: 'hpl', hex: '#f8f5e6', isSolid: true, roughness: 0.4 },
    { id: 'hpl_266', label: 'HPL 266', category: 'hpl', hex: '#7d8285', isSolid: true, roughness: 0.4 },
    { id: 'hpl_274', label: 'HPL 274', category: 'hpl', hex: '#7b7756', isSolid: true, roughness: 0.4 },
    { id: 'hpl_279', label: 'HPL 279', category: 'hpl', hex: '#525252', isSolid: true, roughness: 0.4 },
    { id: 'hpl_472', label: 'HPL 472', category: 'hpl', hex: '#707781', isSolid: true, roughness: 0.4 },

    // --- HPL TEXTURIZZATI (Mappe complete, Core Nero) ---
    { 
      id: 'hpl_5004', 
      label: 'HPL 5004', 
      category: 'hpl', 
      type: 'hpl_tex', 
      folder: 'HPL/5004', 
      icon: 'color.jpg',
      isTextured: true,
      roughness: 0.8 
    },
    { 
      id: 'hpl_5764', 
      label: 'HPL 5764', 
      category: 'hpl', 
      type: 'hpl_tex', 
      folder: 'HPL/5764', 
      icon: 'color.jpg',
      isTextured: true,
      roughness: 0.8 
    },

    // --- NOBILITATO (Ibrido: Colore + Mappe) ---
    { 
      id: 'nobilitato_bianco', 
      label: 'Nobilitato Bianco', 
      category: 'nobilitato', 
      folder: 'nobilitato/nobilitato_bianco',
      hex: '#f9f8f4', 
      icon: 'icona.jpg',
      isHybrid: true, 
      roughness: 0.5 
    }
  ]
};