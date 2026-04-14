import React, { useState } from 'react';
import Navbar from './components/ui/Navbar';
import Footer from './components/ui/Footer';
import ScrollToTop from './components/ui/ScrollToTop';
import ConfiguratorView from './views/ConfiguratorView';
import ProfileDashboard from './components/ui/ProfileDashboard';
import { useAuthHandler } from './hooks/useAuthHandler';
import './styles/App.css';

export default function App() {
  // --- 1. STATO GLOBALE (ROUTING) ---
  const [currentView, setCurrentView] = useState('configurator'); 
  
  // --- 2. GESTIONE AUTENTICAZIONE (Isolata nell'hook) ---
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    authExternalMessage, 
    setAuthExternalMessage 
  } = useAuthHandler();

  // --- 3. RENDER DELL'INTERFACCIA ---
  return (
    <div className="main-layout" id="main-scroll-container">
      
      {/* HEADER */}
      <Navbar 
        currentView={currentView}
        setCurrentView={setCurrentView} 
        isAuthModalOpen={isAuthModalOpen}
        setIsAuthModalOpen={setIsAuthModalOpen}
        externalMessage={authExternalMessage}
        setExternalMessage={setAuthExternalMessage}
      />

      {/* VIEW PRINCIPALE CONDIZIONALE */}
      {currentView === 'configurator' ? (
        <ConfiguratorView />
      ) : (
        <ProfileDashboard onLogout={() => setCurrentView('configurator')} />
      )}

      {/* FOOTER E UTILITY */}
      <Footer />
      <ScrollToTop />
      
    </div>
  );
}