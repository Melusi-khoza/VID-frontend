// GenerateID.jsx
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
  const navigate = useNavigate();

  const userEmail = localStorage.getItem('currentUserEmail'); // Make sure this is set on login
  const storageKey = `generatedID_${userEmail}`;

  // Check if ID already exists in localStorage
  useEffect(() => {
    const existingIdImage = localStorage.getItem(storageKey);
    if (existingIdImage) {
      setIdImage(existingIdImage);
    }
  }, [userEmail, storageKey]);

  const handleGenerateID = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const generatedImage = await generateID(setIdImage, setLoading, setPersonData);

      // Save to localStorage under the user's email key
      if (generatedImage) {
        localStorage.setItem(storageKey, generatedImage);
        downloadID(generatedImage); // Auto-download
      }
    } catch (error) {
      console.error("Error generating ID:", error);
      setErrorMessage("Failed to generate ID. Please ensure there are applications in the database.");
    } finally {
      setLoading(false);
    }
  };

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
          </div>
        )}
        <div className={styles.buttonGroup}>
          {!idImage ? (
            <button
              onClick={handleGenerateID}
              className={styles.generateButton}
              disabled={loading}
            >
              Generate ID
            </button>
          ) : (
            <p className={styles.successMessage}>
              Your ID has already been generated and downloaded.
            </p>
          )}
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