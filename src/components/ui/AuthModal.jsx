import React, { useState } from 'react';
import { TbX } from "react-icons/tb";
import { supabase } from '../../config/supabaseClient'; 
import '../../styles/AuthModal.css';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  
  // Campi Form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Consensi GDPR
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Stati UI
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (isLogin) {
        // --- LOGICA DI LOGIN ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        if (onLoginSuccess) onLoginSuccess(data.user);
        onClose();
        
      } else {
        // --- LOGICA DI REGISTRAZIONE ---
        if (!privacyConsent) {
          throw new Error("Devi accettare l'Informativa sulla Privacy per continuare.");
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              company_name: companyName,
              privacy_consent: privacyConsent,
              marketing_consent: marketingConsent,
              consent_date: new Date().toISOString()
            }
          }
        });
        
        if (error) throw error;
        
        setMessage({ 
          type: 'success', 
          text: 'Registrazione completata! Controlla la tua email per confermare l\'account.' 
        });
      }
    } catch (error) {
      let errorMsg = error.message;
      if (errorMsg === "Invalid login credentials") errorMsg = "Email o password non valide.";
      if (errorMsg === "User already registered") errorMsg = "Questa email è già registrata.";
      
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const resetFormAndToggle = (loginState) => {
    setIsLogin(loginState);
    setMessage({ type: '', text: '' });
    setFirstName('');
    setLastName('');
    setCompanyName('');
    setEmail('');
    setPassword('');
    setPrivacyConsent(false);
    setMarketingConsent(false);
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        
        <button className="auth-close-btn" onClick={onClose}>
          <TbX size={24} />
        </button>

        <div className="auth-header">
          <h2 className="brand-title" style={{ fontSize: '1.8rem', marginBottom: '10px' }}>
            {isLogin ? 'Area Riservata' : 'Nuovo Account'}
          </h2>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Accedi per salvare e gestire le tue configurazioni.' 
              : 'Registrati come rivenditore per sbloccare funzionalità esclusive.'}
          </p>
        </div>

        <div className="auth-tabs">
          <button 
            className={`auth-tab ${isLogin ? 'active' : ''}`} 
            onClick={() => resetFormAndToggle(true)}
          >
            Accedi
          </button>
          <button 
            className={`auth-tab ${!isLogin ? 'active' : ''}`} 
            onClick={() => resetFormAndToggle(false)}
          >
            Registrati
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          
          {!isLogin && (
            <>
              <div className="form-row">
                <div className="input-group">
                  <label>Nome</label>
                  <input 
                    type="text" 
                    required 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    placeholder="Mario"
                  />
                </div>
                <div className="input-group">
                  <label>Cognome</label>
                  <input 
                    type="text" 
                    required 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    placeholder="Rossi"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Nome Azienda / Ragione Sociale</label>
                <input 
                  type="text" 
                  required 
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)} 
                  placeholder="Es. Edilizia Rossi srl"
                />
              </div>
            </>
          )}

          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="tu@email.com"
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              minLength="6"
            />
          </div>

          {!isLogin && (
            <div className="gdpr-section">
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  checked={privacyConsent} 
                  onChange={(e) => setPrivacyConsent(e.target.checked)} 
                  required
                />
                <span className="checkbox-text">
                  Dichiaro di aver letto l'<a href="#">Informativa sulla Privacy</a> e acconsento al trattamento dei miei dati personali.*
                </span>
              </label>

              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  checked={marketingConsent} 
                  onChange={(e) => setMarketingConsent(e.target.checked)} 
                />
                <span className="checkbox-text">
                  Acconsento a ricevere comunicazioni commerciali e aggiornamenti (Opzionale).
                </span>
              </label>
            </div>
          )}

          {message.text && (
            <div className={`auth-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button 
            type="submit" 
            className="action-btn btn-primary" 
            disabled={loading} 
            style={{ width: '100%', marginTop: '20px' }}
          >
            {loading ? <div className="spinner spinner-sm" style={{borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff"}}></div> : (isLogin ? 'Accedi' : 'Crea Account')}
          </button>
        </form>

      </div>
    </div>
  );
}