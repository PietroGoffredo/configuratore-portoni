import React from 'react';
import { ComponenteConTexture, ComponenteMetallo } from './Generic';

export function PannelloEsterno4Incisioni({ configCentrale, configCornice }) {
  return (
    <group position={[0, 0, 0]}>
      <ComponenteMetallo 
        modelPath="/models/pannello_esterno_4_incisioni/pannello_esterno_4_incisioni_anello.glb"
        finitura="silver"
      />
      <ComponenteConTexture 
        modelPath="/models/pannello_esterno_4_incisioni/pannello_esterno_4_incisioni.glb"
        textureConfig={configCentrale}
      />
      <ComponenteConTexture 
        modelPath="/models/pannello_esterno_4_incisioni/pannello_esterno_4_incisioni_asse_dx.glb"
        textureConfig={configCornice}
      />
      <ComponenteConTexture 
        modelPath="/models/pannello_esterno_4_incisioni/pannello_esterno_4_incisioni_asse_superiore.glb"
        textureConfig={configCornice}
      />
      <ComponenteConTexture 
        modelPath="/models/pannello_esterno_4_incisioni/pannello_esterno_4_incisioni_asse_sx.glb"
        textureConfig={configCornice}
      />
    </group>
  );
}

export function PannelloInterno({ configCentrale, configCornice }) {
  return (
    <group position={[0,0,0]}>
      <ComponenteConTexture 
        modelPath="/models/pannello_interno/pannello_interno.glb"
        textureConfig={configCentrale}
      />
      <ComponenteConTexture 
        modelPath="/models/pannello_interno/pannello_interno_asse_superiore.glb"
        textureConfig={configCornice}
      />
      <ComponenteConTexture 
        modelPath="/models/pannello_interno/pannello_interno_asse_sx.glb"
        textureConfig={configCornice}
      />
      <ComponenteConTexture 
        modelPath="/models/pannello_interno/pannello_interno_asse_dx.glb"
        textureConfig={configCornice}
      />
    </group>
  );
}

export function StrutturaCompleta() {
  // Configurazione fissa per la struttura
  const querciaConfig = { folder: 'legno_quercia', file: 'color.jpg' };
  const frassinoConfig = { folder: 'legno_frassino', file: 'color.jpg' };

  return (
    <group>
      <ComponenteConTexture modelPath="/models/struttura/struttura.glb" textureConfig={querciaConfig} />
      <ComponenteConTexture modelPath="/models/struttura/struttura_asse_superiore.glb" textureConfig={frassinoConfig} />
      <ComponenteConTexture modelPath="/models/struttura/struttura_asse_sx.glb" textureConfig={frassinoConfig} />
      <ComponenteConTexture modelPath="/models/struttura/struttura_asse_dx.glb" textureConfig={frassinoConfig} />
    </group>
  );
}