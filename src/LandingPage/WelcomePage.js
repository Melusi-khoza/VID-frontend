import React, { useState } from "react";
import { Link } from "react-router-dom";
import LogoLanding from "./LogoLanding.png";
import styles from "./WelcomePage.module.css";
import AdminLoginModal from "../LandingPage/AdminLoginModal";

function WelcomePage() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleAdminLogin = (username, password) => {
    if (username === "Mazibuko" && password === "Moment2@") {
      window.location.href = "/admin-dashboard"; // Redirect to admin dashboard
    }
    else{
      alert("INVALID CREDENTIALS!!");
      window.location.href = "/";
    }
  };

  return (
    <div className={styles.container}>
      {/* Header with added Admin button */}
      <header className={styles.header}>
        <div className={styles.logoWrap}>
          <span className={styles.brand}><strong>Virtual</strong> ID</span>
        </div>
        <div className={styles.navButtons}>
          <button 
            className={styles.navBtn}
            onClick={() => setShowLoginModal(true)}
          >
            Analytics
          </button>
          <Link to="/login"><button className={styles.navBtn}>Sign in</button></Link>
          <Link to="/register"><button className={styles.navBtnPrimary}>Register</button></Link>
        </div>
      </header>

      {/* Admin Login Modal */}
      {showLoginModal && (
        <AdminLoginModal 
          onClose={() => setShowLoginModal(false)}
          onLogin={handleAdminLogin}
        />
      )}

      {/* Rest of your existing content remains unchanged */}
      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.title}>Modern Digital ID Management</h1>
        <p className={styles.subtitle}>Virtual ID simplifies how people manage secure, verifiable digital identification cards.</p>
        <div className={styles.cta}>
          <Link to="/register"><button className={styles.primaryBtn}>Get Started</button></Link>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <h2>Why Choose Virtual ID?</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <h3>🔐 Secure & Compliant</h3>
            <p>We follow strict data privacy and security standards to protect your identity.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>⚡ Fast & Convenient</h3>
            <p>Apply, update, and verify your digital ID in just a few clicks.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>📄 Centralized Records</h3>
            <p>Access all your ID records anytime, anywhere with authorized access.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <img src={LogoLanding} alt="Logo" className={styles.footerLogo} />
          <p>Empowering secure digital identity for all.</p>
        </div>
        <div className={styles.footerRight}>
          <div>
            <h4>Company</h4>
            <p>About</p>
            <p>Careers</p>
            <p>Contact</p>
          </div>
          <div>
            <h4>Resources</h4>
            <p>Help Center</p>
            <p>Privacy</p>
          </div>
          <div>
            <h4>Connect</h4>
            <p>Twitter</p>
            <p>LinkedIn</p>
            <p>Facebook</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default WelcomePage;