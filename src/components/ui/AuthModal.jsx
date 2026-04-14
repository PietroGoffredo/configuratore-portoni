import React, { useState, useRef, useEffect } from 'react';
import { TbX, TbEye, TbEyeOff, TbArrowLeft } from "react-icons/tb";
import ReCAPTCHA from "react-google-recaptcha";
import { supabase } from '../../config/supabaseClient'; 
import '../../styles/AuthModal.css';

// --- VALIDAZIONE CAMPI ---
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^(\+39|0039)?\s?3\d{2}\s?\d{6,7}$|^0\d{1,3}\s?\d{5,7}$/.test(phone.replace(/\s/g, ''));
const validateCAP = (cap) => /^\d{5}$/.test(cap);

export default function AuthModal({ isOpen, onClose, onLoginSuccess, externalMessage }) {
  const [authMode, setAuthMode] = useState('login'); 
  const [regStep, setRegStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const recaptchaRef = useRef(null);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // --- FUNZIONI PER CAMBIO FORM ---
  const changeAuthMode = (mode) => {
    setAuthMode(mode);
    setMessage({ type: '', text: '' }); 
    setPassword(''); 
  };

  const changeRegStep = (step) => {
    setRegStep(step);
    setMessage({ type: '', text: '' });
  };

  // --- GESTIONE STATO MODALE & MESSAGGI ESTERNI ---
  useEffect(() => {
    if (isOpen) {
      if (sessionStorage.getItem('force_password_update') === 'true') {
        changeAuthMode('update_password');
        sessionStorage.removeItem('force_password_update');
      }
      if (externalMessage && externalMessage.text) {
        setMessage(externalMessage);
      }
    } else {
      changeAuthMode('login');
      changeRegStep(1);
    }
  }, [isOpen, externalMessage]);

  if (!isOpen) return null;

  // =========================================================================
  // SISTEMA DI SICUREZZA: GESTIONE CHIUSURA MODALE (ANTI-BYPASS LOGIN)
  // =========================================================================
  const handleSecureClose = async (e) => {
    if (e) e.stopPropagation();
    // Se l'utente chiude il modale o clicca fuori mentre è in "update_password",
    // significa che ha la sessione temporanea di Supabase ma ha abortito il reset.
    // DISTRUGGIAMO LA SESSIONE per non fargli bypassare il login.
    if (authMode === 'update_password') {
      await supabase.auth.signOut();
    }
    onClose();
  };

  const handleSecureBackBtn = async (e) => {
    e.preventDefault();
    if (authMode === 'update_password') {
      // Stessa logica di sicurezza se preme "Torna Indietro"
      await supabase.auth.signOut();
      changeAuthMode('login');
    } else if (authMode === 'register' && regStep === 2) {
      changeRegStep(1);
    } else {
      changeAuthMode('login');
    }
  };
  // =========================================================================

  const handleNextStep = (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!firstName || !lastName || !companyName || !postalCode || !phone) {
      setMessage({ type: 'error', text: "Tutti i campi sono obbligatori." });
      return;
    }
    if (!validateCAP(postalCode)) {
      setMessage({ type: 'error', text: "Inserisci un CAP valido di 5 cifre." });
      return;
    }
    if (!validatePhone(phone)) {
      setMessage({ type: 'error', text: "Il numero di telefono non è valido." });
      return;
    }
    changeRegStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (onLoginSuccess) onLoginSuccess(data.user);
        onClose();
        
      } else if (authMode === 'register') {
        if (!validateEmail(email)) throw new Error("L'email inserita non è valida.");
        if (password.length < 8 || !/[A-Z]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
          throw new Error("La password deve avere almeno 8 caratteri, una maiuscola e un carattere speciale.");
        }
        if (!recaptchaToken) throw new Error("Conferma di non essere un robot.");

        const cooldownKey = `resend_timer_${email}`;
        const cooldownEnd = localStorage.getItem(cooldownKey);
        
        if (cooldownEnd && Date.now() < parseInt(cooldownEnd)) {
          const secondsLeft = Math.ceil((parseInt(cooldownEnd) - Date.now()) / 1000);
          throw new Error(`Hai già richiesto l'attivazione. Attendi ${secondsLeft} secondi prima di richiedere un nuovo link.`);
        }

        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            captchaToken: recaptchaToken,
            data: { first_name: firstName.trim(), last_name: lastName.trim(), company_name: companyName.trim(), postal_code: postalCode, phone: phone.trim(), privacy_consent: privacyConsent, marketing_consent: marketingConsent, role: 'reseller' }
          }
        });

        if (error) {
          if (error.message.includes('already registered')) {
            const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: email });
            if (resendError) throw new Error("Errore nell'invio del nuovo link. Riprova più tardi.");
            localStorage.setItem(cooldownKey, Date.now() + 60000);
            setMessage({ type: 'success', text: 'Abbiamo inviato un nuovo link di conferma alla tua email.' });
            if (recaptchaRef.current) recaptchaRef.current.reset();
            return;
          }
          throw error; 
        }

        localStorage.setItem(cooldownKey, Date.now() + 60000);
        setMessage({ type: 'success', text: 'Registrazione inviata. Verifica la tua email.' });
        if (recaptchaRef.current) recaptchaRef.current.reset();
        
      } else if (authMode === 'forgot_password') {
        const cooldownKey = `reset_timer_${email}`;
        const cooldownEnd = localStorage.getItem(cooldownKey);
        
        if (cooldownEnd && Date.now() < parseInt(cooldownEnd)) {
          const secondsLeft = Math.ceil((parseInt(cooldownEnd) - Date.now()) / 1000);
          throw new Error(`Attendi ${secondsLeft} secondi prima di richiedere un nuovo link di reset.`);
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        });
        if (error) throw error;

        localStorage.setItem(cooldownKey, Date.now() + 60000);
        setMessage({ type: 'success', text: 'Istruzioni inviate! Controlla la tua posta elettronica.' });

      } else if (authMode === 'update_password') {
        if (password.length < 8 || !/[A-Z]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
          throw new Error("La password deve avere almeno 8 caratteri, una maiuscola e un carattere speciale.");
        }

        const { error } = await supabase.auth.updateUser({ password: password });
        if (error) throw error;

        // === SICUREZZA POST-AGGIORNAMENTO ===
        // Disconnettiamo immediatamente l'utente in modo che sia costretto
        // a fare un vero login con la nuova password appena impostata.
        await supabase.auth.signOut();

        setMessage({ type: 'success', text: 'Password aggiornata con successo! Ora puoi accedere.' });
        setTimeout(() => {
          changeAuthMode('login');
        }, 2500);
      }

    } catch (error) {
      let errorText = error.message;
      
      if (errorText.includes('Invalid login credentials')) {
        errorText = "Credenziali non valide. Verifica che l'email e la password inserite siano corrette.";
      } else if (errorText.includes('Email not confirmed')) {
        errorText = "L'account non è ancora attivo. Conferma il tuo indirizzo email tramite il link che ti abbiamo inviato.";
      } else if (errorText.includes('already registered')) {
        errorText = "Questo indirizzo email è già associato a un account esistente.";
      } else if (errorText.toLowerCase().includes('rate limit') || errorText.toLowerCase().includes('too many requests')) {
        errorText = "Troppi tentativi effettuati. Per ragioni di sicurezza, attendi qualche minuto e riprova.";
      }

      setMessage({ type: 'error', text: errorText });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={handleSecureClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        
        <button className="auth-close-btn" onClick={handleSecureClose}><TbX size={24} /></button>

        <div className="auth-header">
          {(authMode === 'forgot_password' || authMode === 'update_password' || (authMode === 'register' && regStep === 2)) && (
            <button className="back-arrow-btn" onClick={handleSecureBackBtn}>
              <TbArrowLeft size={22} /> Torna indietro
            </button>
          )}

          <h2 className="brand-title">
            {authMode === 'update_password' ? 'Nuova Password' : authMode === 'login' ? 'Accesso rivenditori' : authMode === 'register' ? 'Richiesta account' : 'Recupero password'}
          </h2>
          
          <p className="auth-subtitle">
            {authMode === 'update_password' && 'Inserisci una nuova password sicura per il tuo account.'}
            {authMode === 'login' && 'Accedi al portale Fiore Ebanisteria per gestire le tue configurazioni.'}
            {authMode === 'register' && (regStep === 1 ? 'Procedi alla registrazione inserendo i dati della tua azienda per accedere ai servizi esclusivi.' : 'Imposta le tue credenziali di accesso per completare la richiesta di accreditamento.')}
            {authMode === 'forgot_password' && 'Inserisci la tua email per ricevere un link sicuro e impostare una nuova password.'}
          </p>
        </div>

        <form onSubmit={authMode === 'register' && regStep === 1 ? handleNextStep : handleSubmit} className="auth-form">
          
          {authMode === 'update_password' ? (
             <div className="step-container">
               <div className="input-group">
                 <label>Nuova Password <span className="req-ast">*</span></label>
                 <div className="pwd-input-wrapper">
                   <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                   <button type="button" className="pwd-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                     {showPassword ? <TbEyeOff size={20} /> : <TbEye size={20} />}
                   </button>
                 </div>
                 <span className="pwd-hint">Minimo 8 caratteri, inclusa una maiuscola e un carattere speciale.</span>
               </div>
             </div>
          ) : (
            <>
              {authMode === 'register' && regStep === 1 && (
                <div className="step-container">
                  <div className="form-row">
                    <div className="input-group"><label>Nome <span className="req-ast">*</span></label><input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nome" /></div>
                    <div className="input-group"><label>Cognome <span className="req-ast">*</span></label><input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Cognome" /></div>
                  </div>
                  <div className="input-group"><label>Azienda <span className="req-ast">*</span></label><input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ragione sociale" /></div>
                  <div className="form-row">
                    <div className="input-group" style={{ flex: '0 0 30%' }}><label>CAP <span className="req-ast">*</span></label><input type="text" required maxLength="5" value={postalCode} onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))} placeholder="CAP" /></div>
                    <div className="input-group" style={{ flex: '1' }}><label>Telefono <span className="req-ast">*</span></label><input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefono" /></div>
                  </div>
                </div>
              )}

              {((authMode === 'register' && regStep === 2) || authMode === 'login' || authMode === 'forgot_password') && (
                <div className="step-container">
                  <div className="input-group"><label>Email {authMode === 'register' && <span className="req-ast">*</span>}</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value.toLowerCase())} placeholder="Email" /></div>

                  {authMode !== 'forgot_password' && (
                    <div className="input-group">
                      <label>Password {authMode === 'register' && <span className="req-ast">*</span>}</label>
                      <div className="pwd-input-wrapper">
                        <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                        <button type="button" className="pwd-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <TbEyeOff size={20} /> : <TbEye size={20} />}
                        </button>
                      </div>
                      {authMode === 'register' && <span className="pwd-hint">Minimo 8 caratteri, inclusa una maiuscola e un carattere speciale.</span>}
                    </div>
                  )}

                  {authMode === 'login' && <div className="forgot-pwd-row"><span className="text-link underline" onClick={() => changeAuthMode('forgot_password')}>Password dimenticata?</span></div>}

                  {authMode === 'register' && regStep === 2 && (
                    <>
                      <div className="recaptcha-wrapper-left"><ReCAPTCHA ref={recaptchaRef} sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} onChange={setRecaptchaToken} hl="it" /></div>
                      <div className="gdpr-section">
                        <label className="checkbox-container"><input type="checkbox" checked={privacyConsent} onChange={(e) => setPrivacyConsent(e.target.checked)} required /><span className="checkbox-text">Accetto l' <a href="https://www.fiorebanisteria.com/privacy-policy/" target="_blank" rel="noreferrer">Informativa Privacy</a> (obbligatorio per procedere) <span className="req-ast">*</span></span></label>
                        <label className="checkbox-container"><input type="checkbox" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} /><span className="checkbox-text">Acconsento all'invio di listini, cataloghi e aggiornamenti commerciali.</span></label>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {message.text && <div className={`auth-message ${message.type}`}>{message.text}</div>}

          <div className="auth-footer-actions">
            <button type="submit" className="action-btn btn-primary full-width" disabled={loading}>
              {loading ? <div className="spinner spinner-sm"></div> : 
                authMode === 'update_password' ? 'AGGIORNA PASSWORD' :
                authMode === 'login' ? 'ACCEDI' : 
                authMode === 'forgot_password' ? 'INVIA LINK' : 
                (regStep === 1 ? 'AVANTI' : 'RICHIEDI ACCOUNT')
              }
            </button>

            <div className="auth-switch-links">
              {authMode === 'login' ? (
                <span>Non hai un account? <strong className="text-link underline" onClick={() => changeAuthMode('register')}>Registrati</strong></span>
              ) : (
                authMode !== 'forgot_password' && authMode !== 'update_password' && <span>Hai già un account? <strong className="text-link underline" onClick={() => changeAuthMode('login')}>Accedi</strong></span>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}