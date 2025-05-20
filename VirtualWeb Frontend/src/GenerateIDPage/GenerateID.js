import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { generateID, downloadID } from "./idUtils";
import IDCardPreview from './IDCardPreview';
import styles from './GenarateID.module.css';

const GenerateID = () => {
  const [idImage, setIdImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [personData, setPersonData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const navigate = useNavigate();

  // Check if processing is complete when component mounts
  useEffect(() => {
    checkProcessingStatus();
  }, []);

  // Function to check if processing is complete
  const checkProcessingStatus = () => {
    // Get processing status from localStorage
    const processingStatus = JSON.parse(localStorage.getItem("processingStatus")) || {};
    const applicantData = JSON.parse(localStorage.getItem("applicantData")) || {};
    
    // Check if processing is complete or if expected completion time has passed
    const isComplete = 
      processingStatus.completed || 
      !processingStatus.inProgress || 
      (processingStatus.expectedCompletionTime && 
        new Date(processingStatus.expectedCompletionTime) <= new Date());

    setIsProcessingComplete(isComplete);

    // If processing is not complete, redirect to processing page
    if (!isComplete) {
      setRedirecting(true);
      const timer = setTimeout(() => {
        navigate("/processing");
      }, 3000); // Short delay before redirect
      
      return () => clearTimeout(timer);
    }
  };

  const handleGenerateID = async () => {
    // Check if processing is complete before generating ID
    if (!isProcessingComplete) {
      setErrorMessage("Your application is still being processed. Please wait until processing is complete.");
      setRedirecting(true);
      setTimeout(() => {
        navigate("/processing");
      }, 3000);
      return;
    }

    setLoading(true);
    setErrorMessage("");
    
    try {
      await generateID(setIdImage, setLoading, setPersonData);
    } catch (error) {
      console.error("Error generating ID:", error);
      setErrorMessage("Failed to generate ID. Please ensure there are applications in the database.");
      setLoading(false);
    }
  };

  // Show redirect message if trying to access page early
  if (redirecting) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loader}>
            <div className={styles.spinner}></div>
            <h2>Access Restricted</h2>
            <p>Your ID is still being processed. Redirecting you to the processing page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Generate Virtual ID</h1>
        
        {errorMessage && (
          <div className={styles.errorMessage}>
            {errorMessage}
          </div>
        )}
        
        {loading ? (
          <div className={styles.loader}>
            <div className={styles.spinner}></div>
            Generating your Virtual ID...
          </div>
        ) : (
          <div className={styles.content}>
            {idImage && (
              <>
                <IDCardPreview idImage={idImage} />
                
                {personData && (
                  <div className={styles.personInfo}>
                    <h3>ID Generated For:</h3>
                    <p><strong>Name:</strong> {personData.fullName}</p>
                    <p><strong>ID Number:</strong> {personData.personId}</p>
                  </div>
                )}
              </>
            )}
            
            {!idImage && isProcessingComplete && (
              <div className={styles.readyMessage}>
                <div className={styles.checkmark}>✓</div>
                <p>Your application has been processed successfully!</p>
                <p>You can now generate your virtual ID.</p>
              </div>
            )}
          </div>
        )}
        
        <div className={styles.buttonGroup}>
          {idImage && (
            <button
              onClick={() => downloadID(idImage)}
              className={styles.downloadButton}
            >
              Download ID
            </button>
          )}
          
          <button
            onClick={handleGenerateID}
            className={styles.generateButton}
            disabled={loading}
          >
            {idImage ? "Regenerate ID" : "Generate ID"}
          </button>
          
          <Link to="/my_register" className={styles.link}>
            <button className={styles.backButton}>
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GenerateID;