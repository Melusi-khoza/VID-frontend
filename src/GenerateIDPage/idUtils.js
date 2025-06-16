import axios from 'axios';
import JsBarcode from 'jsbarcode';
import defaultProfileImg from '../GenerateIDPage/muntu.jpeg';
import saFlag from '../GenerateIDPage/sa_flag.jpg';
import saCoatOfArms from '../GenerateIDPage/coatOfArm.jpeg';

// Fetch the most recent application from the database
export const fetchLatestApplication = async () => {
  try {
    const response = await axios.get('http://localhost:5265/api/Application');
    if (response.data?.length > 0) {
      return response.data.sort((a, b) => b.applicationId - a.applicationId)[0];
    }
    throw new Error("No applications found");
  } catch (error) {
    console.error("Error fetching applications:", error);
    throw error;
  }
};

// Fetch application by email
export const fetchApplicationByEmail = async (email) => {
  try {
    const response = await axios.get(`http://localhost:5265/api/Application/email/${email}`);
    if (response.data) return response.data;
    throw new Error("No application found");
  } catch (error) {
    console.error("Error fetching application:", error);
    throw error;
  }
};

// Fetch profile picture with priority for verified images
export const fetchProfilePicture = async (applicationId) => {
  try {
    const userEmail = localStorage.getItem('currentUserEmail');
    const verifiedProfilePic = localStorage.getItem(`verifiedProfilePic_${userEmail}`);
    
    if (verifiedProfilePic?.startsWith('data:image')) return verifiedProfilePic;
    
    const localProfilePic = localStorage.getItem('profilePictureBase64');
    if (localProfilePic?.startsWith('data:image')) return localProfilePic;

    const personId = localStorage.getItem('userId');
    const response = await fetch(`http://localhost:5265/api/Person/${personId}/profilepicture`);
    
    if (!response.ok) return await convertImageToBase64(defaultProfileImg);

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => convertImageToBase64(defaultProfileImg).then(resolve);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error fetching profile picture:", error);
    return await convertImageToBase64(defaultProfileImg);
  }
};

// Convert image to base64
const convertImageToBase64 = async (imgPath) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      [canvas.width, canvas.height] = [img.width, img.height];
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = typeof imgPath === 'string' ? imgPath : URL.createObjectURL(imgPath);
  });
};

// Load images (flag/coat of arms)
const loadImage = async (src) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
};

// Helper function to draw rounded rectangles
const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

// Generate authentic SA ID card with rounded corners
export const generateID = async (setIdImage, setLoading, setPersonData) => {
  try {
    setLoading(true);
    const userEmail = localStorage.getItem('currentUserEmail');
    const storageKey = `generatedID_${userEmail}`;
    const verifiedProfilePic = localStorage.getItem(`verifiedProfilePic_${userEmail}`);
    const existingIdImage = localStorage.getItem(storageKey);

    if (existingIdImage && !verifiedProfilePic) {
      setIdImage(existingIdImage);
      setLoading(false);
      return existingIdImage;
    }

    // Fetch application data
    const applicationData = await fetchApplicationByEmail(userEmail);
    if (!applicationData) throw new Error("No application data");
    setPersonData(applicationData);

    // Create front side
    const frontCanvas = document.createElement('canvas');
    const frontCtx = frontCanvas.getContext('2d');
    [frontCanvas.width, frontCanvas.height] = [640, 400];
    
    // Create back side
    const backCanvas = document.createElement('canvas');
    const backCtx = backCanvas.getContext('2d');
    [backCanvas.width, backCanvas.height] = [640, 400];

    // SA Official Colors
    const colors = {
      blue: '#002395',
      green: '#007749',
      gold: '#FFB81C',
      white: '#FFFFFF',
      black: '#000000'
    };

    /* ===== FRONT SIDE ===== */
    drawRoundedRect(frontCtx, 0, 0, frontCanvas.width, frontCanvas.height, 20);
    frontCtx.fillStyle = colors.white;
    frontCtx.fill();

    // Header with gradient
    drawRoundedRect(frontCtx, 0, 0, frontCanvas.width, 60, 20);
    const headerGradient = frontCtx.createLinearGradient(0, 0, frontCanvas.width, 0);
    headerGradient.addColorStop(0, colors.blue);
    headerGradient.addColorStop(1, colors.green);
    frontCtx.fillStyle = headerGradient;
    frontCtx.fill();

    // Gold stripe
    frontCtx.fillStyle = colors.gold;
    frontCtx.fillRect(0, 60, frontCanvas.width, 4);

    // Coat of Arms
    const coatOfArms = await loadImage(saCoatOfArms);
    if (coatOfArms) {
      frontCtx.drawImage(coatOfArms, frontCanvas.width - 90, 8, 70, 50);
    }

    // Header text
    frontCtx.fillStyle = colors.white;
    frontCtx.font = 'bold 20px "Arial Narrow"';
    frontCtx.textAlign = 'left';
    frontCtx.fillText('REPUBLIC OF SOUTH AFRICA', 20, 35);
    frontCtx.font = 'bold 16px "Arial Narrow"';
    frontCtx.fillText('IDENTITY CARD', 20, 55);

    // Photo with rounded corners
    const [photoX, photoY, photoW, photoH] = [20, 90, 150, 180];
    drawRoundedRect(frontCtx, photoX, photoY, photoW, photoH, 10);
    frontCtx.strokeStyle = colors.green;
    frontCtx.lineWidth = 2;
    frontCtx.stroke();

    // Profile picture
    //const profilePicture = verifiedProfilePic || await fetchProfilePicture(applicationData.applicationId);
    const profilePicture = verifiedProfilePic || await fetchProfilePicture(applicationData.applicationId);
if (profilePicture) {
  const img = await loadImage(profilePicture);
  if (img) {
    frontCtx.save();
    drawRoundedRect(frontCtx, photoX, photoY, photoW, photoH, 10);
    frontCtx.clip();

    // Calculate scale to cover the area (object-fit: cover)
    const scale = Math.max(photoW / img.width, photoH / img.height);
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    const offsetX = photoX + (photoW - drawWidth) / 2;
    const offsetY = photoY + (photoH - drawHeight) / 2;

    frontCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    frontCtx.restore();
  } else {
    drawPhotoPlaceholder(frontCtx, photoX, photoY, photoW, photoH, 10);
  }
} else {
  drawPhotoPlaceholder(frontCtx, photoX, photoY, photoW, photoH, 10);
}

    // Personal information
    const fields = [
      { label: 'ID NUMBER:', value: applicationData.personId || 'N/A' },
      { label: 'SURNAME:', value: applicationData.lastName || applicationData.fullName?.split(' ')[0] || 'N/A' },
      { label: 'NAMES:', value: applicationData.firstName || applicationData.fullName?.split(' ').slice(1).join(' ') || 'N/A' },
      { label: 'DOB:', value: formatSADate(applicationData.dob) },
      { label: 'NATIONALITY:', value: applicationData.citizenship || 'SOUTH AFRICAN' }
    ];

    const [infoX, infoY, lineH] = [190, 90, 25];
    frontCtx.fillStyle = colors.green;
    frontCtx.font = 'bold 12px Arial';
    fields.forEach((field, i) => frontCtx.fillText(field.label, infoX, infoY + i * lineH));
    
    frontCtx.fillStyle = colors.black;
    frontCtx.font = '12px Arial';
    fields.forEach((field, i) => frontCtx.fillText(field.value, infoX + 100, infoY + i * lineH));

    // Signature
    const signatureX = frontCanvas.width - 30;
    const signatureY = frontCanvas.height - 100;
    frontCtx.fillStyle = colors.black;
    frontCtx.font = 'italic 16px "Brush Script MT", cursive';
    frontCtx.textAlign = 'right';
    frontCtx.fillText(generateSignature(applicationData.fullName), signatureX, signatureY);
    frontCtx.font = 'italic 10px Arial';
    frontCtx.fillText('Signature', signatureX, signatureY + 15);

    /* ===== BACK SIDE ===== */
    drawRoundedRect(backCtx, 0, 0, backCanvas.width, backCanvas.height, 20);
    backCtx.fillStyle = colors.white;
    backCtx.fill();

    // Security background pattern
    backCtx.strokeStyle = 'rgba(0, 119, 73, 0.05)';
    backCtx.lineWidth = 1;
    for (let i = 0; i < backCanvas.width; i += 25) {
      backCtx.beginPath();
      backCtx.moveTo(i, 0);
      backCtx.lineTo(i, backCanvas.height);
      backCtx.stroke();
    }

    // Header
    drawRoundedRect(backCtx, 0, 0, backCanvas.width, 60, 20);
    backCtx.fillStyle = colors.blue;
    backCtx.fill();
    backCtx.fillStyle = colors.gold;
    backCtx.fillRect(0, 60, backCanvas.width, 4);

    // Back side title
    backCtx.fillStyle = colors.white;
    backCtx.font = 'bold 20px "Arial Narrow"';
    backCtx.textAlign = 'center';
    backCtx.fillText('SOUTH AFRICAN IDENTITY CARD', backCanvas.width/2, 35);
    backCtx.font = 'bold 16px "Arial Narrow"';
    backCtx.fillText('BACK SIDE', backCanvas.width/2, 55);

    // Barcode
    const barcodeCanvas = document.createElement('canvas');
    [barcodeCanvas.width, barcodeCanvas.height] = [300, 80];
    
    JsBarcode(barcodeCanvas, applicationData.personId || '0000000000000', {
      format: "CODE128",
      lineColor: colors.black,
      width: 3,
      height: 60,
      displayValue: true,
      font: "12px Arial",
      textMargin: 3
    });

    backCtx.drawImage(barcodeCanvas, (backCanvas.width - 300)/2, 100);

    // Additional information
    const backInfo = [
      'Issued by: Department of Home Affairs',
      'Valid until: ' + new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toLocaleDateString('en-ZA'),
      'Emergency contact: 0800 123 456',
      'For official use only'
    ];

    backCtx.fillStyle = colors.black;
    backCtx.font = '12px Arial';
    backCtx.textAlign = 'center';
    backInfo.forEach((text, i) => {
      backCtx.fillText(text, backCanvas.width/2, 200 + i * 25);
    });

    // Watermark
    backCtx.save();
    backCtx.fillStyle = 'rgba(0, 119, 73, 0.08)';
    backCtx.font = 'bold 72px Arial';
    backCtx.rotate(-0.2);
    backCtx.fillText('SA', 100, 250);
    backCtx.restore();

    // Combine both sides into one image
    const combinedCanvas = document.createElement('canvas');
    const combinedCtx = combinedCanvas.getContext('2d');
    [combinedCanvas.width, combinedCanvas.height] = [640, 850]; // Stack vertically
    
    // Add white background
    combinedCtx.fillStyle = colors.white;
    combinedCtx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
    
    // Draw front side (top)
    combinedCtx.drawImage(frontCanvas, 0, 20);
    
    // Draw divider
    combinedCtx.strokeStyle = colors.gold;
    combinedCtx.lineWidth = 2;
    combinedCtx.beginPath();
    combinedCtx.moveTo(50, 430);
    combinedCtx.lineTo(590, 430);
    combinedCtx.stroke();
    
    // Draw back side (bottom)
    combinedCtx.drawImage(backCanvas, 0, 450);

    // Add "FRONT" and "BACK" labels
    combinedCtx.fillStyle = colors.blue;
    combinedCtx.font = 'bold 14px Arial';
    combinedCtx.textAlign = 'left';
    combinedCtx.fillText('FRONT', 30, 30);
    combinedCtx.fillText('BACK', 30, 460);

    const idImageUrl = combinedCanvas.toDataURL('image/png');
    localStorage.setItem(storageKey, idImageUrl);
    setIdImage(idImageUrl);
    setLoading(false);
    return idImageUrl;
  } catch (error) {
    console.error("Error generating ID:", error);
    setLoading(false);
    throw error;
  }
};

// SA date format (DD MMM YYYY)
function formatSADate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch {
    return 'N/A';
  }
}

function generateSignature(fullName) {
  if (!fullName) return 'J.S';
  
  // Extract first letters of first two names
  const nameParts = fullName.split(' ');
  let signature = '';
  
  if (nameParts.length >= 2) {
    signature = `${nameParts[0][0]}.${nameParts[1][0]}.`; // Format: F.L.
  } else if (nameParts.length === 1) {
    signature = `${nameParts[0][0]}.`; // Single initial if only one name
  }
  
  return signature.toUpperCase();
}

// Photo placeholder with rounded corners
function drawPhotoPlaceholder(ctx, x, y, w, h, r = 0) {
  if (r > 0) {
    drawRoundedRect(ctx, x, y, w, h, r);
    ctx.fillStyle = '#f0f0f0';
    ctx.fill();
  } else {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(x, y, w, h);
  }
  
  ctx.fillStyle = '#999';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PHOTO', x + w/2, y + h/2);
}

// Download ID image
export const downloadID = (idImage) => {
  if (!idImage) return;
  const link = document.createElement("a");
  link.href = idImage;
  link.download = "SA_ID_Card_Front_and_Back.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};