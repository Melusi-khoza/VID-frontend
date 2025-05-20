import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../Services/AuthService";
import styles from '../LoginPage/ForgotPasswd.module.css'; // Import CSS Module

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const sendOTP = async (e) => {
    e.preventDefault();
    
    // Reset previous messages
    setError("");
    setSuccessMessage("");

    // Validate email
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      
      // Show success message
      setSuccessMessage("Verification code sent successfully!");
      
      // Store email in localStorage for verification page
      localStorage.setItem("resetEmail", email);
      
      // Wait a moment to show success message before redirecting
      setTimeout(() => {
        navigate("/verify-otp", { state: { email } });
      }, 1500);
      
    } catch (err) {
      console.error("Error sending OTP:", err);
      
      // Handle different error scenarios
      if (err.response?.status === 404) {
        setError("No account found with this email address");
      } else if (err.response?.status === 429) {
        setError("Too many attempts. Please try again later");
      } else {
        setError(err.response?.data?.message || err.message || "Failed to send verification code. Please try again later");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendOTP(e);
    }
  };

  return (
    <div className={styles.forgotPasswordContainer}>
      <div className={styles.forgotPasswordCard}>
        <h2>Forgot Password</h2>
        
        <p className={styles.instructionText}>
          Enter your email address below and we'll send you a verification code to reset your password.
        </p>
        
        {error && (
          <div className={styles.errorMessage}>{error}</div>
        )}
        
        {successMessage && (
          <div className={styles.successMessage}>{successMessage}</div>
        )}
        
        <form onSubmit={sendOTP}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              autoFocus
              className={styles.input}
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </form>
        
        <div className={styles.additionalLinks}>
          <p>
            Remember your password? <a href="/login">Log in</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
