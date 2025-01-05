import React, { useState } from "react";
import { auth } from "../services/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../styles/components/forgotPassword.css";
import { useLanguage } from "../context/LanguageContext";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { language } = useLanguage(); // Use the language context

  const translations = {
    en: {
      forgotPasswordTitle: "Forgot Password?",
      instructionText: "No worries, we’ll send you reset instructions.",
      emailPlaceholder: "Enter your email",
      emailLabel: "Email",
      resetPasswordButton: "Reset Password",
      backToLogin: "Back to login",
      successMessage: "Password reset link has been sent to your email. Please check.",
      validEmailError: "Please enter a valid email.",
      errorPrefix: "Error: ",
    },
    fr: {
      forgotPasswordTitle: "Mot de passe oublié ?",
      instructionText: "Pas de soucis, nous vous enverrons des instructions de réinitialisation.",
      emailPlaceholder: "Entrez votre e-mail",
      emailLabel: "E-mail",
      resetPasswordButton: "Réinitialiser le mot de passe",
      backToLogin: "Retour à la connexion",
      successMessage: "Le lien de réinitialisation du mot de passe a été envoyé à votre e-mail. Veuillez vérifier.",
      validEmailError: "Veuillez entrer une adresse e-mail valide.",
      errorPrefix: "Erreur : ",
    },
  };

  const t = translations[language]; // Get the appropriate translations

  const handleRequestOTP = async () => {
    setError("");
    setMessage("");

    if (!email) {
      setError(t.validEmailError);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(t.successMessage);
    } catch (err) {
      setError(`${t.errorPrefix} ${err.message}`);
    }
  };

  return (
    <div className="forgot-password-wrapper">
      <div className="forgot-password-card">
        <h2>{t.forgotPasswordTitle}</h2>
        <p>{t.instructionText}</p>

        {/* Conditionally render input and button */}
        {!message ? (
          <>
            <label>{t.emailLabel}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              required
            />
            <button onClick={handleRequestOTP} className="reset-password-button">
              {t.resetPasswordButton}
            </button>
          </>
        ) : (
          <p className="success-message">{message}</p>
        )}

        {error && <p className="error-message">{error}</p>}

        <div className="back-to-login" onClick={() => navigate("/login")}>
          <span>&larr;</span> {t.backToLogin}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
