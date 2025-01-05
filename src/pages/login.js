import React, { useState } from "react";
import { auth } from "../services/firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getDoc, doc, setDoc, collection } from "firebase/firestore";
import { db } from "../services/firebase";
import "../styles/components/login.css";
import { useLanguage } from "../context/LanguageContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const navigate = useNavigate();
  const { language } = useLanguage();

  const translations = {
    en: {
      loginTitle: "Login",
      roleLabel: "Role:",
      emailLabel: "Email:",
      passwordLabel: "Password:",
      loginButton: "Login",
      loggingIn: "Logging in...",
      signupLink: "Don't have an account? Sign up",
      forgotPasswordLink: "Forgot your password?",
      selectRolePlaceholder: "Select your role",
      admin: "Admin",
      dealer: "Dealer",
      installer: "Installer",
      validEmailError: "Please enter a valid email.",
      roleMismatchError: "The role you selected does not match your credentials.",
      noUserDataError: "No user data found. Please contact support.",
      loginFailedError: "Failed to log in. Error: ",
      passwordResetMessage: "Password reset email sent. Please check your inbox.",
      resetError: "Please enter a valid email to reset your password.",
    },
    fr: {
      loginTitle: "Connexion",
      roleLabel: "Rôle :",
      emailLabel: "E-mail :",
      passwordLabel: "Mot de passe :",
      loginButton: "Se connecter",
      loggingIn: "Connexion...",
      signupLink: "Vous n'avez pas de compte ? Inscrivez-vous",
      forgotPasswordLink: "Mot de passe oublié ?",
      selectRolePlaceholder: "Sélectionnez votre rôle",
      admin: "Admin",
      dealer: "Revendeur",
      installer: "Installateur",
      validEmailError: "Veuillez entrer une adresse e-mail valide.",
      roleMismatchError: "Le rôle que vous avez sélectionné ne correspond pas à vos informations d'identification.",
      noUserDataError: "Aucune donnée utilisateur trouvée. Veuillez contacter le support.",
      loginFailedError: "Échec de la connexion. Erreur : ",
      passwordResetMessage: "E-mail de réinitialisation du mot de passe envoyé. Veuillez vérifier votre boîte de réception.",
      resetError: "Veuillez entrer une adresse e-mail valide pour réinitialiser votre mot de passe.",
    },
  };

  const t = translations[language]; // Current language translations

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  const ForgotPassword = () => {
    navigate('/forgot-password')
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!validateEmail(email)) {
      setError(t.validEmailError);
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userRole = userDoc.data().role;
        if (userRole !== selectedRole) {
          await auth.signOut();
          setError(t.roleMismatchError);
          setLoading(false);
          return;
        }

        const loginTimestamp = new Date();
        await setDoc(doc(collection(db, "activity_logs"), user.uid + "_" + loginTimestamp.getTime()), {
          userId: user.uid,
          email: user.email,
          role: userRole,
          action: "Login",
          timestamp: loginTimestamp,
          ip: window.location.hostname,
        });

        if (userRole === "Admin") navigate("/admin-dashboard");
        else if (userRole === "Dealer") navigate("/dealer-dashboard");
        else navigate("/installer-dashboard");
      } else {
        setError(t.noUserDataError);
      }
    } catch (err) {
      setError(`${t.loginFailedError}${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setMessage("");

    if (!validateEmail(email)) {
      setError(t.resetError);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(t.passwordResetMessage);
    } catch (err) {
      setError(`${t.loginFailedError}${err.message}`);
    }
  };

  return (
    <div className="login-container">
      
      <form onSubmit={handleLogin} className="login-form">
        <h2>{t.loginTitle}</h2>
        <label>{t.roleLabel}</label>
        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} required>
          <option value="">{t.selectRolePlaceholder}</option>
          <option value="Admin">{t.admin}</option>
          <option value="Dealer">{t.dealer}</option>
          <option value="Installer">{t.installer}</option>
        </select>

        <label>{t.emailLabel}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.emailLabel}
          required
        />
        <label>{t.passwordLabel}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t.passwordLabel}
          required
        />

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? t.loggingIn : t.loginButton}
        </button>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        <div style={{display:"flex", flexDirection:'row', alignItems:"center", justifyContent:"space-between"}}>
        <p className="link" onClick={() => navigate("/signup")}>
          {t.signupLink}
        </p>
        <p className="link" onClick={ForgotPassword}>
          {t.forgotPasswordLink}
        </p>
        </div>
      </form>
    </div>
  );
};

export default Login;
