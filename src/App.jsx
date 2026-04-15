// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/ui/Navbar';
import Footer from './components/ui/Footer';
import ScrollToTop from './components/ui/ScrollToTop';
import PortalHomeView from './views/PortalHomeView'; // IL NUOVO HUB
import ConfiguratorView from './views/ConfiguratorView';
import ProfileDashboard from './components/ui/ProfileDashboard';
import { useAuthHandler } from './hooks/useAuthHandler';
import './styles/App.css';

export default function App() {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    authExternalMessage, 
    setAuthExternalMessage 
  } = useAuthHandler();

  return (
    <Router>
      <div className="main-layout" id="main-scroll-container">
        
        <Navbar 
          isAuthModalOpen={isAuthModalOpen}
          setIsAuthModalOpen={setIsAuthModalOpen}
          externalMessage={authExternalMessage}
          setExternalMessage={setAuthExternalMessage}
        />

        <Routes>
          {/* La radice dell'app ora è direttamente l'hub di selezione dei modelli */}
          <Route path="/" element={<PortalHomeView />} />
          
          <Route path="/configuratore" element={<ConfiguratorView />} />
          <Route path="/dashboard" element={<ProfileDashboard />} />
        </Routes>

        <Footer />
        <ScrollToTop />
        
      </div>
    </Router>
  );
}