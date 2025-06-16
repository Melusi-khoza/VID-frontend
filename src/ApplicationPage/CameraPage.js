// CameraPage.jsx

import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './CameraPage.module.css';


// Import face-api.js models
import * as faceapi from 'face-api.js';

const CameraPage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [stream, setStream] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [personId, setPersonId] = useState('');
  const navigate = useNavigate();
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models/'; // Place models in public/models/

      try {
        console.log("Loading face-api.js models...");
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        
        if (!faceapi.nets.tinyFaceDetector.params) {
          console.warn("Model params not loaded yet");
        }

        console.log("✅ All face-api.js models loaded successfully.");
        setModelsLoaded(true); // Only allow face detection after this
      } catch (error) {
        console.error("❌ Failed to load face-api.js models:", error);
        alert("Face recognition models failed to load. Please refresh and try again.");
      }
      // await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      // await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      // await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      // console.log('✅ Face API models loaded');
    };

    loadModels();
  }, []);

  // Get person ID from localStorage
  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('applicationFormData')) || {};
    const registrationData = localStorage.getItem(`applicationData_${localStorage.getItem("currentUserEmail")}`);
    if (registrationData) {
      const userData = JSON.parse(registrationData);
      setPersonId(userData.PersonId || '');
    } else if (savedData.PersonId) {
      setPersonId(savedData.PersonId);
    }
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      setCameraStarted(true);
    } catch (err) {
      alert('Could not access webcam. Please allow permissions.');
    }
  };

  // Capture image
  const captureImage = () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    const dataURL = canvasRef.current.toDataURL('image/jpeg');
    setCapturedImage(dataURL);
    stopCamera();
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraStarted(false);
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  // Convert base64 to blob
  function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }

  // Save image to server if verified
  const saveImageToServer = async () => {
  if (!verificationResult?.isMatch) {
    alert('You must verify your identity before saving.');
    return;
  }

  try {
    const formData = new FormData();
    const blob = dataURLtoBlob(capturedImage);
    formData.append('photo', blob, 'profile.jpg');

    const response = await axios.post('http://localhost:5265/api/Person/upload-photo', formData);
    const { filePath } = response.data;

    // Save to localStorage for form data
    const savedData = JSON.parse(localStorage.getItem('applicationFormData')) || {};
    savedData.ProfilePicture = filePath;
    localStorage.setItem('applicationFormData', JSON.stringify(savedData));
    
    // 🔥 NEW: Save the verified captured image for ID card generation
    const userEmail = localStorage.getItem('currentUserEmail');
    localStorage.setItem('profilePictureBase64', capturedImage);
    localStorage.setItem(`verifiedProfilePic_${userEmail}`, capturedImage);
    
    // Clear any existing generated ID to force regeneration with new photo
    localStorage.removeItem(`generatedID_${userEmail}`);

    console.log('✅ Verified photo saved successfully for ID generation');
    navigate('/apply');
  } catch (error) {
    console.error('Error uploading photo:', error);
    alert('Failed to upload photo.');
  }
};

  // Download file as image
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // Optional: For debugging
  function logDescriptorStats(descriptor) {
    const mean = descriptor.reduce((a, b) => a + b, 0) / descriptor.length;
    const max = Math.max(...descriptor);
    const min = Math.min(...descriptor);
    console.log(`Descriptor stats: Mean=${mean.toFixed(4)}, Min=${min.toFixed(4)}, Max=${max.toFixed(4)}`);
  }

  // Manual Cosine Distance Calculator ✅ ADDED HERE
  function computeCosineDistance(descriptor1, descriptor2) {
    let dotProduct = 0;
    let d1SquareSum = 0;
    let d2SquareSum = 0;

    for (let i = 0; i < descriptor1.length; i++) {
      dotProduct += descriptor1[i] * descriptor2[i];
      d1SquareSum += descriptor1[i] * descriptor1[i];
      d2SquareSum += descriptor2[i] * descriptor2[i];
    }

    const magnitude = Math.sqrt(d1SquareSum) * Math.sqrt(d2SquareSum);
    return magnitude === 0 ? 0 : 1 - dotProduct / magnitude;
  }

  // Verify face match
  const verifyFaceMatch = async () => {
  if (!modelsLoaded) {
    alert("Face recognition models are still loading. Please wait a moment.");
    return;
  }

  if (!capturedImage || !personId) {
    alert('Please capture an image and ensure Person ID is available');
    return;
  }

  setIsVerifying(true);
  setVerificationResult(null);

  try {
    console.log("🔍 Starting face verification process...");
    
    // Fetch existing photo
    const existingPhotoResponse = await fetchExistingPhoto(personId);
    if (!existingPhotoResponse) {
      throw new Error("No existing photo found for this person ID.");
    }

    console.log("📸 Loading images...");
    const referenceImg = await loadImage(existingPhotoResponse);
    const currentImg = await loadImage(capturedImage);
    
    console.log(`Reference image: ${referenceImg.width}x${referenceImg.height}`);
    console.log(`Current image: ${currentImg.width}x${currentImg.height}`);

    // Extract face descriptors with enhanced detection
    console.log("🔍 Extracting face descriptor from reference image...");
    const referenceDescriptor = await getFaceDescriptor(referenceImg);
    
    console.log("🔍 Extracting face descriptor from current image...");
    const currentDescriptor = await getFaceDescriptor(currentImg);

    if (!referenceDescriptor) {
      throw new Error("Could not detect face in reference image. Please ensure the reference photo contains a clear, front-facing face.");
    }
    
    if (!currentDescriptor) {
      throw new Error("Could not detect face in captured image. Please retake the photo with better lighting and face the camera directly.");
    }

    console.log("🧮 Computing face similarity...");
    const distance = computeCosineDistance(referenceDescriptor, currentDescriptor);
    const isMatch = distance < 0.6;
    const confidence = Math.max(0, 1 - distance);

    console.log(`Distance: ${distance.toFixed(4)}, Confidence: ${(confidence * 100).toFixed(1)}%`);

    setVerificationResult({
      isMatch,
      confidence,
      distance
    });

    if (isMatch) {
      alert(`✅ Identity verified! Confidence: ${(confidence * 100).toFixed(1)}%`);
    } else {
      alert(`❌ Identity verification failed. Confidence: ${(confidence * 100).toFixed(1)}%. Please try again with better lighting.`);
    }

  } catch (error) {
    console.error("❌ Face verification failed:", error.message);
    setVerificationResult({
      isMatch: false,
      confidence: 0,
      error: error.message
    });
    alert(`Face verification failed: ${error.message}`);
  } finally {
    setIsVerifying(false);
  }
};

// Add this debugging function to visualize face detection
const debugFaceDetection = async (img, label = "Image") => {
  try {
    console.log(`🔍 Debugging face detection for ${label}`);
    
    // Create canvas for visualization
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = Math.min(img.width, 640);
    canvas.height = Math.min(img.height, 480);
    
    // Draw the image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Try to detect all faces
    const detections = await faceapi
      .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions({ 
        inputSize: 512, 
        scoreThreshold: 0.2 
      }))
      .withFaceLandmarks();
    
    console.log(`Found ${detections.length} faces in ${label}`);
    
    if (detections.length > 0) {
      // Draw bounding boxes
      detections.forEach((detection, index) => {
        const box = detection.detection.box;
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        // Draw landmarks if available
        if (detection.landmarks) {
          detection.landmarks.positions.forEach(point => {
            ctx.fillStyle = 'blue';
            ctx.fillRect(point.x - 1, point.y - 1, 2, 2);
          });
        }
        
        console.log(`Face ${index + 1}: Score: ${detection.detection.score.toFixed(3)}, 
                     Box: ${box.x.toFixed(0)},${box.y.toFixed(0)} 
                     ${box.width.toFixed(0)}x${box.height.toFixed(0)}`);
      });
      
      // Create a temporary image element to display the debug canvas
      const debugImg = document.createElement('img');
      debugImg.src = canvas.toDataURL();
      debugImg.style.border = '2px solid red';
      debugImg.style.maxWidth = '300px';
      debugImg.title = `Debug: ${label}`;
      
      // Temporarily add to page for debugging (remove in production)
      document.body.appendChild(debugImg);
      setTimeout(() => document.body.removeChild(debugImg), 5000);
    }
    
    return detections;
  } catch (error) {
    console.error(`Error debugging ${label}:`, error);
    return [];
  }
};

// Enhanced verifyFaceMatch with debugging
const verifyFaceMatchWithDebug = async () => {
  if (!modelsLoaded) {
    alert("Face recognition models are still loading. Please wait a moment.");
    return;
  }

  if (!capturedImage || !personId) {
    alert('Please capture an image and ensure Person ID is available');
    return;
  }

  setIsVerifying(true);
  setVerificationResult(null);

  try {
    const existingPhotoResponse = await fetchExistingPhoto(personId);
    if (!existingPhotoResponse) {
      throw new Error("No existing photo found for this person ID.");
    }

    const referenceImg = await loadImage(existingPhotoResponse);
    const currentImg = await loadImage(capturedImage);
    
    // Debug both images
    console.log("🐛 Running debug detection...");
    await debugFaceDetection(referenceImg, "Reference Image");
    await debugFaceDetection(currentImg, "Current Image");
    
    // Continue with normal verification...
    const referenceDescriptor = await getFaceDescriptor(referenceImg);
    const currentDescriptor = await getFaceDescriptor(currentImg);

    if (!referenceDescriptor || !currentDescriptor) {
      throw new Error("Could not detect face in one of the images.");
    }

    const distance = computeCosineDistance(referenceDescriptor, currentDescriptor);
    const isMatch = distance < 0.6;
    const confidence = Math.max(0, 1 - distance);

    setVerificationResult({
      isMatch,
      confidence,
      distance
    });

    if (isMatch) {
      alert(`✅ Match successful! Confidence: ${(confidence * 100).toFixed(1)}%`);
    } else {
      alert(`❌ Faces don't match. Distance: ${distance.toFixed(3)}`);
    }

  } catch (error) {
    console.error("Face verification failed:", error.message);
    setVerificationResult({
      isMatch: false,
      confidence: 0,
      error: error.message
    });
    alert("Face verification failed. Check console for details.");
  } finally {
    setIsVerifying(false);
  }
};

  // Fetch existing photo from backend
  // Fetch existing child photo from backend using childIdentityNumber
const fetchExistingPhoto = async (personId) => {
  if (!personId) {
    console.warn("No person ID provided for fetching photo.");
    return null;
  }

  try {
    const response = await axios.get(`http://localhost:5265/api/Application/child/${personId}/photo`, {
      responseType: 'arraybuffer' // Important to receive binary data
    });

    // Convert response to Base64
    const base64Photo = btoa(
      new Uint8Array(response.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    return `data:image/jpeg;base64,${base64Photo}`;
  } catch (err) {
    console.error("Error fetching existing photo:", err.message);
    return null;
  }
};

  // Helper: extract face descriptor
  const getFaceDescriptor = async (img) => {
  try {
    // Create a canvas to potentially resize/preprocess the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set reasonable dimensions for face detection (max 640px width)
    const maxWidth = 640;
    const scale = Math.min(maxWidth / img.width, maxWidth / img.height);
    
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    
    // Draw the scaled image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    console.log(`Processing image: ${canvas.width}x${canvas.height}`);
    
    // Try multiple detection options with different thresholds
    const detectionOptions = [
      new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 }),
      new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 }),
      new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }),
      new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.6 })
    ];
    
    let detections = null;
    
    // Try each detection option until one works
    for (const option of detectionOptions) {
      console.log(`Trying detection with inputSize: ${option.inputSize}, threshold: ${option.scoreThreshold}`);
      
      detections = await faceapi
        .detectSingleFace(canvas, option)
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (detections) {
        console.log(`✅ Face detected with inputSize: ${option.inputSize}`);
        break;
      }
    }
    
    if (!detections) {
      // Try detecting all faces and pick the largest one
      console.log("Trying to detect all faces...");
      const allDetections = await faceapi
        .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.2 }))
        .withFaceLandmarks()
        .withFaceDescriptors();
      
      if (allDetections && allDetections.length > 0) {
        // Pick the detection with the largest face box
        detections = allDetections.reduce((largest, current) => 
          current.detection.box.area > largest.detection.box.area ? current : largest
        );
        console.log(`✅ Selected largest face from ${allDetections.length} detected faces`);
      }
    }

    if (!detections) {
      console.warn("⚠️ No face detected in image after trying multiple options");
      return null;
    }

    console.log("✅ Face descriptor extracted successfully");
    console.log(`Face box: ${JSON.stringify(detections.detection.box)}`);
    
    return detections.descriptor;
    
  } catch (error) {
    console.error("Error in getFaceDescriptor:", error);
    return null;
  }
};


  return (
    <div className={styles.cameraContainer}>
      <h2>Capture & Verify Your Profile Picture</h2>

      {!capturedImage && (
        <div className={styles.cameraPreview}>
          <video ref={videoRef} autoPlay playsInline width="640" height="480" />
          <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />
        </div>
      )}

      {!modelsLoaded && (
  <div className={styles.loader}>
    ⏳ Loading facial recognition models... (this may take a few seconds)
  </div>
)}

{modelsLoaded && capturedImage && (
  <div className={styles.capturedImage}>
    <img src={capturedImage} alt="Captured" />
    {verificationResult && (
      <div className={`${styles.verificationResult} ${verificationResult.isMatch ? styles.success : styles.failure}`}>
        <p>{verificationResult.isMatch ? '✅ Verified' : '❌ Not Verified'}</p>
        <p>Confidence: {(verificationResult.confidence * 100).toFixed(1)}%</p>
      </div>
    )}
  </div>
)}

      <div className={styles.cameraControls}>
        {!capturedImage ? (
          <>
            {!cameraStarted && (
              <button onClick={startCamera} disabled={isVerifying}>
                🎥 Start Camera
              </button>
            )}
            {cameraStarted && (
              <>
                <button onClick={captureImage} disabled={isVerifying}>
                  📸 Capture Photo
                </button>
                <button onClick={stopCamera} disabled={isVerifying}>
                  ❌ Stop Camera
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <button onClick={retakePhoto} disabled={isVerifying}>
              🔄 Retake
            </button>
            <button onClick={verifyFaceMatch} disabled={isVerifying}>
              {isVerifying ? '🔍 Verifying...' : '🔍 Verify Identity'}
            </button>
            {verificationResult?.isMatch && (
              <button onClick={saveImageToServer} className={styles.saveButton}>
                💾 Save Verified Photo
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CameraPage;