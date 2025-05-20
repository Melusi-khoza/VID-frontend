// idUtils.js - Enhanced version with South African ID styling and coat of arms

import axios from 'axios';
import JsBarcode from 'jsbarcode';

import defaultProfileImg from '../GenerateIDPage/muntu.jpeg';
// Import the South African coat of arms
import saCoatOfArms from '../GenerateIDPage/coatOfArm.jpeg'; // You'll need to add this image to your assets

// Fetch the most recent application from the database
export const fetchLatestApplication = async () => {
  try {
    console.log("Fetching latest application...");
    const response = await axios.get('http://localhost:5265/api/Application');
    if (response.data && response.data.length > 0) {
      const sortedApplications = response.data.sort((a, b) => b.applicationId - a.applicationId);
      console.log("Latest application fetched:", sortedApplications[0]);
      return sortedApplications[0];
    }
    throw new Error("No applications found in the database");
  } catch (error) {
    console.error("Error fetching applications:", error);
    throw error;
  }
};

// Fetch profile picture for a specific application
export const fetchProfilePicture = async (applicationId) => {
  try {
    console.log(`Fetching profile picture for application ID: ${applicationId}`);
    
    const response = await fetch(`http://localhost:5265/api/Application/${applicationId}/profilepicture`);
    
    if (!response.ok) {
      console.log(`Profile picture not found: HTTP ${response.status}`);
      
      // Return the default profile picture as base64
      return await convertImageToBase64(defaultProfileImg);
    }
    
    const blob = await response.blob();
    console.log("Profile picture blob retrieved:", blob);
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        console.log("Profile picture converted to base64");
        resolve(reader.result);
      };
      reader.onerror = () => {
        console.error("Error reading blob as data URL");
        // Use default profile if we can't read the blob
        convertImageToBase64(defaultProfileImg).then(resolve);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error fetching profile picture:", error);
    // Use default profile on any error
    return await convertImageToBase64(defaultProfileImg);
  }
};

// Helper function to convert image to base64
const convertImageToBase64 = async (imgPath) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      console.error("Failed to load default profile image");
      resolve(null);
    };
    img.src = imgPath;
  });
};

// Function to load the SA coat of arms
const loadCoatOfArms = async () => {
  try {
    return await convertImageToBase64(saCoatOfArms);
  } catch (error) {
    console.error("Failed to load coat of arms:", error);
    return null;
  }
};

// Generate the ID card using canvas and embed a barcode with South African styling
export const generateID = async (setIdImage, setLoading, setPersonData) => {
  try {
    setLoading(true);
    
    // Fetch application data
    let applicationData;
    try {
      applicationData = await fetchLatestApplication();
      if (!applicationData) {
        throw new Error("No application data available");
      }
      setPersonData(applicationData);
      console.log("Application data loaded successfully:", applicationData);
    } catch (error) {
      console.error("Failed to load application data:", error);
      setLoading(false);
      alert("Failed to load application data. Please try again.");
      return null;
    }

    // Set up canvas - using ID card dimensions (credit card size ratio)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 850;
    canvas.height = 540; // Adjusted for better proportion

    // South African ID card color scheme
    const saGreen = '#27ae60';  // Green for primary elements
    const saGold = '#f39c12';   // Gold accent color
    const saBlue = '#004A77';   // Blue from the flag

    // Draw ID card background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f5f5f5');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle pattern background
    drawPatternBackground(ctx, canvas.width, canvas.height);

    // Draw card border
    ctx.strokeStyle = saGreen;
    ctx.lineWidth = 8;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    
    // Inner border
    ctx.strokeStyle = saGold;
    ctx.lineWidth = 2;
    ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);

    // Draw header background
    ctx.fillStyle = saBlue;
    ctx.fillRect(5, 5, canvas.width - 10, 90);

    // Load and draw coat of arms
    const coatOfArmsImage = await loadCoatOfArms();
    if (coatOfArmsImage) {
      const coatImg = new Image();
      await new Promise(resolve => {
        coatImg.onload = resolve;
        coatImg.src = coatOfArmsImage;
        // Set a timeout in case image never loads
        setTimeout(resolve, 2000);
      });
      
      // Draw coat of arms in header
      const coatSize = 80;
      ctx.drawImage(coatImg, 30, 10, coatSize, coatSize);
    } else {
      // Fallback if coat of arms can't be loaded - draw a placeholder
      drawCoatOfArmsPlaceholder(ctx, 30, 10, 80, 80);
    }

    // Draw header text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('REPUBLIC OF SOUTH AFRICA', canvas.width / 2, 40);
    ctx.font = 'bold 24px Arial';
    ctx.fillText('SMART ID CARD', canvas.width / 2, 70);

    // Draw South African flag colors as accent line
    drawSAFlagAccent(ctx, 5, 95, canvas.width - 10, 8);

    // Prepare photo area
    const photoX = 50;
    const photoY = 120;
    const photoWidth = 200;
    const photoHeight = 250;

    // Try to load profile picture with proper error handling
    let profilePicture = null;
    if (applicationData && applicationData.applicationId) {
      try {
        console.log(`Attempting to fetch profile picture for application ID: ${applicationData.applicationId}`);
        profilePicture = await fetchProfilePicture(applicationData.applicationId);
        console.log("Profile picture fetch result:", profilePicture ? "Success" : "Not found");
      } catch (err) {
        console.warn("Could not load profile picture, using placeholder", err);
      }
    }

    // Draw photo frame before photo
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(photoX - 5, photoY - 5, photoWidth + 10, photoHeight + 10);
    
    // Draw either the profile picture or a placeholder
    if (profilePicture) {
      try {
        console.log("Loading profile picture into image object");
        const img = new Image();
        
        // Create a proper promise to handle image loading
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = profilePicture; // Set source after attaching event handlers
          
          // Set a timeout in case the image never loads
          setTimeout(() => reject(new Error("Image load timeout")), 5000);
        }).catch(err => {
          console.warn("Image failed to load:", err);
          throw new Error("Failed to load profile picture");
        });

        ctx.drawImage(img, photoX, photoY, photoWidth, photoHeight);
        console.log("Profile picture drawn on canvas");
      } catch (err) {
        console.warn("Error drawing profile picture, using placeholder:", err);
        drawPhotoPlaceholder(ctx, photoX, photoY, photoWidth, photoHeight);
      }
    } else {
      console.log("No profile picture available, using placeholder");
      drawPhotoPlaceholder(ctx, photoX, photoY, photoWidth, photoHeight);
    }
    
    // Draw photo border
    ctx.strokeStyle = saGreen;
    ctx.lineWidth = 3;
    ctx.strokeRect(photoX, photoY, photoWidth, photoHeight);

    // Draw personal information section with styled header
    const infoStartX = 280;
    const infoStartY = 140;
    const lineHeight = 40;

    // Section header with green background
    ctx.fillStyle = saGreen;
    ctx.fillRect(infoStartX, infoStartY - 40, canvas.width - infoStartX - 50, 30);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('PERSONAL INFORMATION', infoStartX + 10, infoStartY - 20);

    // Draw personal information
    ctx.fillStyle = '#000000';
    ctx.font = '18px Arial';
    
    // Draw styled labels and values
    const labels = [
      'Surname & Name:',
      'ID Number:',
      'Date of Birth:',
      'Gender:',
      'Nationality:',
      'Citizenship:'
    ];
    
    const values = [
      applicationData.fullName || 'N/A',
      applicationData.personId || 'N/A',
      formatDate(applicationData.dob),
      applicationData.gender || 'N/A',
      applicationData.nationality || 'N/A',
      applicationData.citizenship || 'N/A'
    ];
    
    // Draw labels and values
    for (let i = 0; i < labels.length; i++) {
      // Label in bold
      ctx.font = 'bold 18px Arial';
      ctx.fillText(labels[i], infoStartX, infoStartY + lineHeight * i);
      
      // Value in regular font
      ctx.font = '18px Arial';
      ctx.fillText(values[i], infoStartX + 150, infoStartY + lineHeight * i);
    }

    // Create and draw barcode
    try {
      const barcodeCanvas = document.createElement('canvas');
      barcodeCanvas.width = 500;
      barcodeCanvas.height = 80;

      JsBarcode(barcodeCanvas, applicationData.personId || '0000000000000', {
        format: "CODE128",
        lineColor: "#000000",
        width: 2,
        height: 70,
        displayValue: false
      });

      // Draw barcode with a label
      ctx.drawImage(barcodeCanvas, 280, 390);
      ctx.font = '14px Arial';
      ctx.fillStyle = '#444';
      //ctx.fillText("ID NUMBER: " + (applicationData.personId || '0000000000000'), 280, 480);
    } catch (barcodeError) {
      console.error("Failed to generate barcode:", barcodeError);
      // Draw text as fallback
      ctx.fillText("ID: " + (applicationData.personId || '0000000000000'), 280, 420);
    }

    // Generate and add signature from initials
    const initials = generateInitialsFromName(applicationData.fullName || 'JS');
    const signatureX = 125;
    const signatureY = 485;
    
    // Draw signature using initials
    drawSignature(ctx, initials, signatureX, signatureY);
    
    // Add signature line below the signature
    ctx.beginPath();
    ctx.moveTo(50, 500);
    ctx.lineTo(200, 500);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText("SIGNATURE", 125, 515);

    // Convert canvas to image
    const idImageUrl = canvas.toDataURL('image/png');
    setIdImage(idImageUrl);
    setLoading(false);
    console.log("South African ID card generated successfully");
    return idImageUrl;
  } catch (error) {
    console.error("Error generating ID:", error);
    setLoading(false);
    alert("Failed to generate ID. Please try again.");
    return null;
  }
};

// Draw the South African flag-inspired accent
function drawSAFlagAccent(ctx, x, y, width, height) {
  // South African flag colors
  const colors = ['#002395', '#de3831', '#ffffff', '#007a4d', '#ffd700', '#000000'];
  const segmentWidth = width / colors.length;
  
  for (let i = 0; i < colors.length; i++) {
    ctx.fillStyle = colors[i];
    ctx.fillRect(x + (i * segmentWidth), y, segmentWidth, height);
  }
}

// Draw a placeholder for the coat of arms
function drawCoatOfArmsPlaceholder(ctx, x, y, width, height) {
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = '#666666';
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = '#666666';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('COAT OF ARMS', x + width/2, y + height/2);
}

// Draw a placeholder box when there's no profile picture
function drawPhotoPlaceholder(ctx, x, y, width, height) {
  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = '#666666';
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = '#666666';
  ctx.font = '18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PHOTO', x + width/2, y + height/2);
}

// Draw a subtle pattern background for the ID card
function drawPatternBackground(ctx, width, height) {
  ctx.save();
  ctx.globalAlpha = 0.05;
  
  // Create repeating pattern
  for (let i = 0; i < width; i += 20) {
    for (let j = 0; j < height; j += 20) {
      // Draw small decorative elements
      ctx.beginPath();
      ctx.arc(i, j, 1, 0, Math.PI * 2);
      ctx.fillStyle = '#004A77';
      ctx.fill();
    }
  }
  
  ctx.restore();
}

// Format date from ISO to readable
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return 'N/A';
  }
}

// Generate initials from name
function generateInitialsFromName(fullName) {
  if (!fullName) return 'JS'; // Default to JS if no name
  
  // Split the name and get initials
  const nameParts = fullName.split(' ');
  let initials = '';
  
  // Get up to 2 initials
  for (let i = 0; i < Math.min(2, nameParts.length); i++) {
    if (nameParts[i].length > 0) {
      initials += nameParts[i][0].toUpperCase();
    }
  }
  
  return initials.length > 0 ? initials : 'JS';
}

// Draw a handwritten-style signature using the person's initials
function drawSignature(ctx, initials, x, y) {
  // Save context state
  ctx.save();
  
  // Set up signature style
  ctx.font = 'italic bold 32px "Brush Script MT", cursive';
  ctx.fillStyle = '#000066';
  
  // Add a slight rotation to make it look more like handwriting
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 36); // Rotate slightly counter-clockwise
  
  // Draw the signature
  ctx.textAlign = 'center';
  ctx.fillText(initials, 0, 0);
  
  // Add a slight underline swish
  ctx.beginPath();
  ctx.moveTo(-20, 5);
  ctx.quadraticCurveTo(0, 15, initials.length * 15, 5);
  ctx.strokeStyle = '#000066';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Restore context
  ctx.restore();
}

// Allow downloading the image
export const downloadID = (idImage) => {
  if (idImage) {
    const link = document.createElement("a");
    link.href = idImage;
    link.download = "SA_ID_Card.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};