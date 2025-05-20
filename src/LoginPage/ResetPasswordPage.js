import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../Services/AuthService";
import styles from "../LoginPage/ResetPassword.module.css"; // Import CSS Module

function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { email, otp } = location.state || {};

  const resetPassword = async () => {
    try {
      await authService.resetPassword(email, otp, newPassword);
      alert("Password reset successfully!");
      navigate("/login");
    } catch (err) {
      setError(err.message || "Failed to reset password");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Reset Password</h2>
        
        <p className={styles.instruction}>
          Enter a new password for <span className={styles.email}>{email}</span>.
        </p>

        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <input 
          type="password" 
          className={styles.passwordInput} 
          placeholder="Enter new password" 
          value={newPassword} 
          onChange={(e) => setNewPassword(e.target.value)} 
        />

        <button className={styles.resetButton} onClick={resetPassword}>
          Reset Password
        </button>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
