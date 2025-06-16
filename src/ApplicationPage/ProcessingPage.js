import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import styles from "./ProcessingPage.module.css";

const ProcessingPage = () => {
  const [timeLeft, setTimeLeft] = useState(100); // 10 seconds for testing (change to 180 for 3 minutes in production)
  const [emailSent, setEmailSent] = useState(false);
  const [exitMessageShown, setExitMessageShown] = useState(false);
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  
  // Get applicant data from localStorage or state management
  const applicantData = JSON.parse(localStorage.getItem("applicantData")) || {};

  useEffect(() => {
    const applicantData = JSON.parse(localStorage.getItem("applicantData"));
    if (!applicantData || !applicantData.Email) {
      console.error("Missing applicant data or email");
      // Optionally redirect back or show error

      navigate('/register'); // Redirect to registration page if no data
    }
    // Check if there's an existing processing status in localStorage
    const existingStatus = JSON.parse(localStorage.getItem("processingStatus")) || {};
    
    // If there is existing status and processing was in progress
    if (existingStatus.inProgress) {
      // Calculate remaining time based on expected completion time
      const expectedCompletionTime = new Date(existingStatus.expectedCompletionTime);
      const currentTime = new Date();
      const remainingMilliseconds = Math.max(0, expectedCompletionTime - currentTime);
      const remainingSeconds = Math.floor(remainingMilliseconds / 1000);
      
      // If processing should be complete already
      if (remainingSeconds <= 0) {
        setTimeLeft(0);
        sendEmailNotification();
        // Mark processing as complete
        localStorage.setItem("processingStatus", JSON.stringify({ 
          inProgress: false,
          completed: true,
          completedAt: new Date().toISOString()
        }));
      } else {
        // Set the remaining time
        setTimeLeft(remainingSeconds);
      }
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          sendEmailNotification().finally(() => {
            // Mark processing as complete
            localStorage.setItem("processingStatus", JSON.stringify({
              inProgress: false,
              completed: true,
              completedAt: new Date().toISOString()
            }));

            setTimeout(() => {
              navigate("/generate_id");
            }, 2000); // delay after email
          });
        }
        return prevTime - 1;
      });
    }, 1000);

    // Cleanup timer on component unmount
    return () => clearInterval(timer);
  }, [navigate]);

  // Function to send email notification
  const sendEmailNotification = async () => {
    try {
      // Check if we have email data
      if (!applicantData || !applicantData.Email) {
        console.warn("No valid applicant data or email found.");
        setEmailSent(false);
        return;
      }

      const response = await await axios.post(
      'http://localhost:5265/api/Notification/SendEmail',
      {
        toEmail: applicantData.Email,
        subject: "Your ID is Ready",
        body: `Dear ${applicantData.FullName || "Applicant"},\n\n your id is ready for generation. You can now proceed to generate your ID \n\nThank you for using our service!`,
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

      console.log("Email response:", response.data);

      if (response.status === 200) {
        setEmailSent(true);
        console.log("✅ Email notification sent successfully.");
      } else {
        setEmailSent(false);
        console.error("❌ Failed to send email: Unexpected status code", response.status);
      }

    } catch (error) {
      setEmailSent(false);
      console.error("🚫 Error sending email:", error.message || error);
      
      // Optional: show alert to user or store error state
      setMessage("Failed to send email notification. Please check your connection.");
    }
  };

  // Handle exit button click
  const handleExit = () => {
    setExitMessageShown(true);
    // Save processing status in localStorage
    localStorage.setItem("processingStatus", JSON.stringify({
      inProgress: true,
      startTime: new Date().toISOString(),
      expectedCompletionTime: new Date(Date.now() + timeLeft * 1000).toISOString()
    }));
  };

  // Format time for display (mm:ss)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress percentage for progress bar
  const progressPercentage = ((100 - timeLeft) / 10) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Processing Your Application</h2>
        
        {exitMessageShown ? (
          <div className={styles.exitMessage}>
            <h3>You can safely leave now</h3>
            <p>Your application is still being processed in our system.</p>
            <p>We'll send an email to <strong>{applicantData.Email}</strong> when your ID is ready.</p>
            <p>You can also return to this page later to check the status or generate your ID.</p>
            <div className={styles.buttonContainer}>
              <Link to="/my_register" className={styles.homeButton}>Return to Home</Link>
              <button 
                className={styles.continueButton}
                onClick={() => setExitMessageShown(false)}
              >
                Continue Waiting
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.processingInfo}>
              <p>Your application has been submitted successfully and is now being processed.</p>
              <p>Please wait while we prepare your virtual ID.</p>
            </div>
            
            <div className={styles.timerContainer}>
              <div className={styles.timerLabel}>Time remaining:</div>
              <div className={styles.timer}>{formatTime(timeLeft)}</div>
              
              <div className={styles.progressBarContainer}>
                <div 
                  className={styles.progressBar} 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className={styles.statusContainer}>
              <div className={styles.statusItem}>
                <span className={styles.statusIcon}>✓</span>
                <span className={styles.statusText}>Application submitted</span>
              </div>
              
              <div className={styles.statusItem}>
                <span className={styles.statusIcon}>{progressPercentage > 50 ? "✓" : "⋯"}</span>
                <span className={styles.statusText}>Processing application</span>
              </div>
              
              <div className={styles.statusItem}>
                <span className={styles.statusIcon}>{emailSent ? "✓" : "⋯"}</span>
                <span className={styles.statusText}>
                  {emailSent ? "Email notification sent" : "Preparing email notification"}
                </span>
              </div>
              
              <div className={styles.statusItem}>
                <span className={styles.statusIcon}>{timeLeft === 0 ? "✓" : "⋯"}</span>
                <span className={styles.statusText}>ID ready for generation</span>
              </div>
            </div>
            
            {timeLeft === 0 ? (
              <div className={styles.completeMessage}>
                <p>Processing complete! Redirecting to ID generation page...</p>
              </div>
            ) : (
              <div className={styles.exitButtonContainer}>
                <button 
                  className={styles.exitButton}
                  onClick={handleExit}
                >
                  Exit and Return Later
                </button>
                <p className={styles.exitNote}>You'll receive an email when your ID is ready.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProcessingPage;
