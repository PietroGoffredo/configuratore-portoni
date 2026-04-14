// src/components/ui/ProfileDashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { 
  TbUser, TbBuildingStore, TbMail, TbDoor, 
  TbCalendar, TbLogout, TbFileDownload, 
  TbShieldLock, TbDownload, TbTrash
} from "react-icons/tb";
import '../../styles/ProfileDashboard.css';

export default function ProfileDashboard({ onLogout }) {
  const [user, setUser] = useState(null);
  const [configurations, setConfigurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserDataAndConfigs();
  }, []);

  const fetchUserDataAndConfigs = async () => {
    try {
      setLoading(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      setUser(user);

      // Assicurati che la RLS sia attiva in Supabase per questa tabella!
      const { data: configs, error: dbError } = await supabase
        .from('configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      
      setConfigurations(configs || []);

    } catch (err) {
      console.error("Errore nel caricamento della dashboard:", err);
      setError("Impossibile caricare i dati del profilo. Riprova più tardi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    if (onLogout) onLogout();
  };

  // --- FUNZIONI GDPR ---
  const handleExportData = () => {
    // Crea un file JSON con tutti i dati dell'utente per la portabilità GDPR
    const userData = {
      profilo: user.user_metadata,
      email: user.email,
      data_registrazione: user.created_at,
      configurazioni_salvate: configurations
    };
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Dati_Personali_FioreEbanisteria_${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteAccountRequest = () => {
    const confirmDelete = window.confirm(
      "ATTENZIONE: Questa azione è irreversibile. Verranno eliminate in modo permanente tutte le tue configurazioni e i tuoi dati personali. Vuoi procedere inviando la richiesta all'amministrazione?"
    );
    if (confirmDelete) {
      // Per il budget 0, apriamo il client di posta per inviare la richiesta scritta.
      // Se vuoi automatizzare in futuro, qui chiamerai una Edge Function di Supabase.
      window.location.href = `mailto:info@fiorebanisteria.com?subject=Richiesta Cancellazione Account (GDPR)&body=Richiedo la cancellazione definitiva del mio account e di tutti i dati associati all'email: ${user.email}`;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container loading-state">
        <div className="spinner"></div>
        <p>Caricamento Area Riservata in corso...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-container unauth-state">
        <TbShieldLock size={64} className="unauth-icon" />
        <h2 className="brand-title">Accesso Sicuro Richiesto</h2>
        <p>Questa è un'area riservata esclusivamente ai rivenditori accreditati Fiore Ebanisteria.</p>
        <p>Effettua il login tramite la barra di navigazione per visualizzare i tuoi dati.</p>
      </div>
    );
  }

  const meta = user.user_metadata;

  return (
    <div className="dashboard-container">
      
      {/* HEADER */}
      <div className="dashboard-header">
        <div className="header-text-block">
          <h1 className="brand-title dashboard-main-title">
            Benvenuto, {meta.first_name || 'Rivenditore'}
          </h1>
          <p className="dashboard-subtitle">Gestisci il tuo profilo e scopri tutti i nostri servizi.</p>
        </div>
        <button className="btn-logout-header" onClick={handleSignOut}>
          <TbLogout size={20} />
          Esci dal portale
        </button>
      </div>

      <div className="dashboard-grid">
        
        {/* COLONNA SINISTRA: DATI & PRIVACY */}
        <div className="dashboard-sidebar">
          
          <div className="dashboard-card profile-card">
            <h3 className="card-title">Dati Aziendali</h3>
            
            <div className="info-list">
              <div className="info-row">
                <div className="info-icon-box"><TbBuildingStore size={22} /></div>
                <div className="info-content">
                  <span className="info-label">Nome azienda</span>
                  <span className="info-value">{meta.company_name || 'Non specificata'}</span>
                </div>
              </div>

              <div className="info-row">
                <div className="info-icon-box"><TbUser size={22} /></div>
                <div className="info-content">
                  <span className="info-label">Referente</span>
                  <span className="info-value">{meta.first_name} {meta.last_name}</span>
                </div>
              </div>

              <div className="info-row">
                <div className="info-icon-box"><TbMail size={22} /></div>
                <div className="info-content">
                  <span className="info-label">Email</span>
                  <span className="info-value">{user.email}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-card privacy-card">
              <div className="privacy-actions">
              <button className="btn-privacy-action" onClick={handleExportData}>
                <TbDownload size={18} /> Scarica i tuoi dati
              </button>
              <button className="btn-privacy-action btn-danger" onClick={handleDeleteAccountRequest}>
                <TbTrash size={18} /> Elimina account
              </button>
            </div>
          </div>

        </div>

        {/* COLONNA DESTRA: CONFIGURAZIONI */}
        <div className="dashboard-main">
          <div className="dashboard-card configs-card">
            <div className="configs-header">
              <h3 className="card-title">Storico Configurazioni</h3>
              <span className="configs-badge">{configurations.length} Totali</span>
            </div>
            
            {error && <div className="error-banner">{error}</div>}

            {configurations.length === 0 ? (
              <div className="empty-state-box">
                <div className="empty-icon-wrapper">
                  <TbDoor size={48} />
                </div>
                <h4>Nessuna configurazione salvata</h4>
                <p>Le configurazioni verranno salvate automaticamente in modo sicuro.</p>
              </div>
            ) : (
              <div className="configs-grid">
                {configurations.map((config) => (
                  <div key={config.id} className="config-item-card">
                    <div className="config-card-header">
                      <div className="config-title-group">
                        <span className="config-model">{config.model_name || 'Nordic 01'}</span>
                        <span className="config-id">ID: {config.id.substring(0, 8).toUpperCase()}</span>
                      </div>
                      <span className="config-date">
                        <TbCalendar size={16} />
                        {new Date(config.created_at).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    
                    <div className="config-tags-area">
                      <div className="config-tag">
                        <strong>Ext:</strong> {config.configuration_data?.esterno || '-'}
                      </div>
                      <div className="config-tag">
                        <strong>Int:</strong> {config.configuration_data?.interno || '-'}
                      </div>
                      <div className="config-tag">
                        <strong>Apertura:</strong> {config.configuration_data?.apertura || 'Destra'}
                      </div>
                    </div>
                    
                    <div className="config-card-footer">
                      <button className="btn-download-pdf">
                        <TbFileDownload size={18} /> Visualizza PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}