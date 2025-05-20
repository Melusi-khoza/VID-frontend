import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../Services/AuthService";
import styles from "../LoginPage/VerifyOtp.module.css"; // Import CSS Module

function VerifyOTPPage() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const verifyOTP = async () => {
    try {
      await authService.verifyOTP(email, otp);
      navigate("/reset-password", { state: { email, otp } });
    } catch (err) {
      setError(err.message || "Invalid OTP");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Verify OTP</h2>
        
        <p className={styles.instruction}>
          A verification code has been sent to <span className={styles.email}>{email}</span>. 
          Please enter the code below to proceed.
        </p>

        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <input 
          type="text" 
          className={styles.otpInput} 
          placeholder="Enter OTP" 
          value={otp} 
          onChange={(e) => setOtp(e.target.value)} 
        />

        <button className={styles.verifyButton} onClick={verifyOTP}>
          Verify
        </button>
      </div>
    </div>
  );
}

export default VerifyOTPPage;
