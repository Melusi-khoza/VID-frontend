import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styles from "./ApplicationPg.module.css";

const ApplicationPg = () => {

  const [idExists, setIdExists] = useState(false);
  const navigate = useNavigate();
  // Add these new state variables
  const [profilePicture, setProfilePicture] = useState(null);
  const [birthCertificate, setBirthCertificate] = useState(null);
  const [idCopy, setIdCopy] = useState(null);
  const fileInputRef = useRef(null);
  const [isLoadingParentInfo, setIsLoadingParentInfo] = useState(false);
  const [parentInfoMessage, setParentInfoMessage] = useState('');
  const [parentInfoFetchAttempted, setParentInfoFetchAttempted] = useState(false);

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleBirthCertificateChange = (e) => {
    setBirthCertificate(e.target.files[0]);
  };

  const handleIdCopyChange = (e) => {
    setIdCopy(e.target.files[0]);
  };
  
  // Initial form state with all fields properly defined
  const initialFormState = {
    PersonId: "",  // Changed from ApplicantId to PersonId
    Nationality: "African",
    Citizenship: "AFRICAN",
    Status: "CITIZEN",
    CountryOfBirth: "",
    DOB: "",
    Email: "",
    FatherId: "",
    FatherName: "",
    FullName: "",
    Gender: "",
    MotherId: "",
    MotherName: "",
    PhoneNumber: "",
    Province: "",
    address: "",
    applicationType: "",
    maritalStatus: "",
    emergencyContact: "",
    emergencyPhone: "",
    disabilities: "",
    
  };

  const ApplicantFormState = {
    PersonId: "",  // Changed from ApplicantId to PersonId
    Email: "",
    PhoneNumber: "",
  };

  const NextOfKinFormState = {
    PersonId: "", // Changed from ApplicantId to PersonId
    FatherName: "",
    MotherName: "",
    FatherId: "",
    MotherId : "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formData1, setFormData1] = useState(ApplicantFormState);
  const [formDataNOK, setFormDataNOK] = useState(NextOfKinFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

  // Function to fetch parent information with improved error handling
  const fetchParentInfo = async (childIdNumber) => {
    if (!childIdNumber || childIdNumber.length !== 13) return;
    
    setIsLoadingParentInfo(true);
    setParentInfoMessage('');
    
    try {
      // Add timeout to the Axios request to prevent long waiting times
      const response = await axios.get(
        `http://localhost:5265/api/Application/GetParentInfoByChildId/${childIdNumber}`,
        { timeout: 8000 } // 8 second timeout
      );
      
      console.log('Parent info fetched:', response.data);
      
      // Determine if the parent is mother or father based on gender
      const parentInfo = response.data;
      if (!parentInfo) {
        setParentInfoMessage('No parent information found for this ID.');
        return;
      }
      
      setFormData(prevFormData => {
        const updatedFormData = { ...prevFormData };
        
        if (parentInfo.ParentGender?.toUpperCase() === 'F') {
          updatedFormData.MotherName = parentInfo.parentName || '';
          updatedFormData.MotherId = parentInfo.parentId || '';
          setParentInfoMessage('Mother information found and populated automatically.');
        } else {
          updatedFormData.FatherName = parentInfo.parentName || '';
          updatedFormData.FatherId = parentInfo.parentId || '';
          setParentInfoMessage('Father information found and populated automatically.');
        }
        
        return updatedFormData;
      });
      
      // Update NextOfKin data separately
      setFormDataNOK(prevFormDataNOK => {
        const updatedFormDataNOK = { ...prevFormDataNOK };
        
        if (parentInfo.ParentGender?.toUpperCase() === 'F') {
          updatedFormDataNOK.MotherName = parentInfo.parentName || '';
          updatedFormDataNOK.MotherId = parentInfo.parentId || '';
        } else {
          updatedFormDataNOK.FatherName = parentInfo.parentName || '';
          updatedFormDataNOK.FatherId = parentInfo.parentId || '';
        }
        
        return updatedFormDataNOK;
      });
      
    } catch (error) {
      console.error('Error fetching parent info:', error);
      // (Keep your existing error handling)
    } finally {
      setIsLoadingParentInfo(false);
      setParentInfoFetchAttempted(true);
    }
  };

const updateChildPhoto = async () => {
  try {
    // Get the photo path from localStorage
    const savedData = JSON.parse(localStorage.getItem('applicationFormData')) || {};
    const photoPath = savedData.ProfilePicture;
    
    console.log('Saved data:', savedData);
    console.log('Photo path:', photoPath);
    console.log('Form data:', formData);
    
    if (!photoPath) {
      alert('No photo found. Please take a photo first.');
      return;
    }

    // Check if we have the child ID
    if (!formData.PersonId) {
      alert('Child Identity Number is required. Please fill in the form first.');
      return;
    }

    // Convert the URL path to server file path
    // The frontend receives "/Data/Photos/filename.jpg"
    // We need to convert this to the actual server path
    const serverFilePath = photoPath.replace('/Data/Photos/', '');
    const fullServerPath = `wwwroot/Data/Photos/${serverFilePath}`;

    const updateData = {
      ChildIdNumber: formData.PersonId, // Note: changed to camelCase
      PhotoFilePath: fullServerPath // Note: changed to camelCase
    };

    console.log('Sending data to backend:', updateData);

    const response = await axios.post('http://localhost:5265/api/application/update-photo', updateData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Backend response:', response.data);
    //alert('Photo uploaded to database successfully!');
  } catch (error) {
    console.error('Full error object:', error);
    console.error('Error response data:', error.response?.data);
    console.error('Error status:', error.response?.status);
    
    if (error.response?.data?.errors) {
      console.error('Validation errors:', error.response.data.errors);
      const errorMessages = Object.entries(error.response.data.errors)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('\n');
      alert(`Validation errors:\n${errorMessages}`);
    } else {
      alert('Failed to upload photo to database. Check console for details.');
    }
  }
};

// Alternative version - if your form field name is different, try this:
const updateChildPhotoAlt = async () => {
  try {
    const savedData = JSON.parse(localStorage.getItem('applicationFormData')) || {};
    const photoPath = savedData.ProfilePicture;
    
    if (!photoPath) {
      alert('No photo found. Please take a photo first.');
      return;
    }

    // Try different possible field names for the ID
    const childId = formData.childIdentityNumber || 
                   formData.childIdNumber || 
                   formData.ChildIdentityNumber || 
                   formData.ChildIdNumber ||
                   formData.idNumber;

    console.log('Trying child ID:', childId);
    console.log('Available form fields:', Object.keys(formData));

    if (!childId) {
      alert('Child Identity Number not found. Available fields: ' + Object.keys(formData).join(', '));
      return;
    }

    const serverFilePath = photoPath.replace('/Data/Photos/', '');
    const fullServerPath = `wwwroot/Data/Photos/${serverFilePath}`;

    const updateData = {
      childIdNumber: childId,
      photoFilePath: fullServerPath
    };

    console.log('Sending data:', updateData);

    const response = await axios.post('http://localhost:5265/api/application/update-photo', updateData);
    alert('Photo uploaded successfully!');
  } catch (error) {
    console.error('Error details:', error.response?.data || error.message);
    alert('Upload failed. Check console for details.');
  }
};


  // Load saved data from localStorage on component mount
  useEffect(() => {
    
    

    localStorage.removeItem("formData");
    localStorage.removeItem("formData1");
    localStorage.removeItem("formDataNOK");
    // Check if there's a currently logged-in user
    const currentUserEmail = localStorage.getItem("currentUserEmail");
    
    if (currentUserEmail) {
      // Try to get the user's registration data
      const registrationData = localStorage.getItem(`applicationData_${currentUserEmail}`);
      
      if (registrationData) {
        try {
          const userData = JSON.parse(registrationData);
          
          // Update formData with the registration data
          setFormData(prevFormData => ({
            ...prevFormData,
            PersonId: userData.PersonId || prevFormData.PersonId,
            FullName: userData.FullName || prevFormData.FullName,
            Gender: userData.Gender || prevFormData.Gender,
            DOB: userData.DOB || prevFormData.DOB,
            Email: userData.Email || prevFormData.Email
          }));
          
          // Also update formData1 for the Applicant table
          setFormData1(prevFormData => ({
            ...prevFormData,
            PersonId: userData.PersonId || prevFormData.PersonId,
            Email: userData.Email || prevFormData.Email
          }));
          
          // Update NextOfKin data
          setFormDataNOK(prevFormData => ({
            ...prevFormData,
            PersonId: userData.PersonId || prevFormData.PersonId
          }));
          
          // Check if this ID already exists in the application system
          if (userData.PersonId) {
            checkExistingApplication(userData.PersonId).then(exists => {
              setIdExists(exists);
              if (exists) {
                setErrors(prev => ({
                  ...prev,
                  PersonId: "An application with this ID already exists"
                }));
              }
            });
            
            // Fetch parent information if ID exists
            if (userData.PersonId.length === 13) {
              fetchParentInfo(userData.PersonId);
            }
          }
        } catch (error) {
          console.error("Error parsing registration data:", error);
        }
      }
    }
    
    // Check for saved draft data (existing functionality)
    const savedData = localStorage.getItem("formData");
    const savedData1 = localStorage.getItem("formData1"); 
    const savedDataNOK = localStorage.getItem("formDataNOK");
    if (savedData && savedData1 && savedDataNOK) {
      try {
        const parsedFormData = JSON.parse(savedData);
        setFormData(parsedFormData);
        setFormData1(JSON.parse(savedData1));
        setFormDataNOK(JSON.parse(savedDataNOK));
        
        // Fetch parent information if ID exists in saved data
        if (parsedFormData.PersonId && parsedFormData.PersonId.length === 13) {
          fetchParentInfo(parsedFormData.PersonId);
        }
      } catch (error) {
        console.error("Error parsing saved form data:", error);
      }
    }
  }, []);
  
  const validateForm = () => {
    const newErrors = {};
    
    // Basic validation rules
    if (!formData.FullName) newErrors.FullName = "Full name is required";
    if (!formData.Gender) newErrors.Gender = "Gender is required";
    
    // ID number validation (assuming South African ID format)
    if (!formData.PersonId || !/^\d{13}$/.test(formData.PersonId)) {
      newErrors.PersonId = "Please enter a valid 13-digit ID number";
    } else if (idExists) {
      newErrors.PersonId = "An application with this ID already exists";
    }

    if (formData.MotherId && !/^\d{13}$/.test(formData.MotherId)) {
      newErrors.MotherId = "Please enter a valid 13-digit ID number";
    }
    
    if (formData.FatherId && !/^\d{13}$/.test(formData.FatherId)) {
      newErrors.FatherId = "Please enter a valid 13-digit ID number";
    }
    
    // Phone validation
    if (!formData.PhoneNumber || !/^\d{10}$/.test(formData.PhoneNumber.replace(/\s/g, ''))) {
      newErrors.PhoneNumber = "Please enter a valid 10-digit phone number";
    }
    
    // Email validation
    if (!formData.Email || !/\S+@\S+\.\S+/.test(formData.Email)) {
      newErrors.Email = "Please enter a valid email address";
    }
    
    // Province validation
    if (!formData.Province) newErrors.Province = "Province is required";
    
    // Document validation
    // if (!profilePicture) newErrors.profilePicture = "Profile picture is required";
    // if (!birthCertificate) newErrors.birthCertificate = "Birth certificate is required";
    // if (!idCopy) newErrors.idCopy = "ID copy is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
  
    //let updatedFormData = { ...formData, [name]: value };

    const sanitizedValue = value === undefined ? '' : value;

  let updatedFormData = { ...formData, [name]: sanitizedValue };
  
    if (name === "PersonId" && value.length === 13) {
      const dobPart = value.substring(0, 6);
      const yearPrefix = parseInt(dobPart.substring(0, 2)) < 25 ? "20" : "19"; 
      const formattedDOB = `${yearPrefix}${dobPart.substring(0, 2)}-${dobPart.substring(2, 4)}-${dobPart.substring(4, 6)}`;
  
      const genderDigits = parseInt(value.substring(6, 10));
      const gender = genderDigits < 5000 ? "Female" : "Male";
  
      updatedFormData.DOB = formattedDOB;
      updatedFormData.Gender = gender;
  
      checkExistingApplication(value).then(exists => {
        setIdExists(exists);
        if (exists) {
          setErrors(prev => ({
            ...prev,
            PersonId: "An application with this ID already exists"
          }));
        }
      });
    }
  
    setFormData(updatedFormData);
  
    // Sync to other forms if necessary
    if (name === "PersonId") {
      setFormData1(prev => ({ ...prev, [name]: value }));
      setFormDataNOK(prev => ({ ...prev, [name]: value }));
    }
    if (name === "Email") {
      setFormData1(prev => ({ ...prev, [name]: value }));
    }
    if (name === "PhoneNumber") {
      setFormData1(prev => ({ ...prev, [name]: value }));
    }
    if (["FatherName", "FatherId", "MotherName", "MotherId"].includes(name)) {
      setFormDataNOK(prev => ({ ...prev, [name]: value }));
    }
  
    // Clear error if user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  

  const handleSave = () => {
    localStorage.setItem("formData", JSON.stringify(formData));
    localStorage.setItem("formData1", JSON.stringify(formData1));
    localStorage.setItem("formDataNOK", JSON.stringify(formDataNOK));

    setMessage("Your data has been saved.");
    alert("Your data has been saved.");
  };

  const handleContinue = () => {
    alert("You can continue the form later.");
    setFormData(initialFormState);
    setFormData1(ApplicantFormState);
    setFormDataNOK(NextOfKinFormState);
    setProfilePicture(null);
    setBirthCertificate(null);
    setIdCopy(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setParentInfoMessage('');
    setParentInfoFetchAttempted(false);
  };

  const checkExistingApplication = async (personId) => {
    try {
      console.log("Checking for existing application with ID:", personId);
      const response = await axios.get(`http://localhost:5265/api/Application/CheckExists/${personId}`);
      console.log("API response for ID check:", response.data);
      return response.data; // Will be true if an application exists
    } catch (error) {
      console.error("Error checking existing application:", error);
      return false;
    }
  };

  const handleIdBlur = async () => {
    if (formData.PersonId.length === 13) {
      const exists = await checkExistingApplication(formData.PersonId);
      setIdExists(exists);
  
      if (exists) {
        setErrors(prev => ({
          ...prev,
          PersonId: "An application with this ID already exists"
        }));
      }
      
      // Fetch parent information when ID field loses focus
      fetchParentInfo(formData.PersonId);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    setMessage("Please correct the errors in the form.");
    return;
  }

  setIsLoading(true);
  setMessage('');

  try {
    // Step 1: Upload the profile picture first
    if (profilePicture) {
      const savedData = JSON.parse(localStorage.getItem('applicationFormData')) || {};
      const photoPath = savedData.ProfilePicture;

      if (!photoPath) {
        alert("No photo found. Please take a photo first.");
        setIsLoading(false);
        return;
      }

      const serverFilePath = photoPath.replace('/Data/Photos/', '');
      const fullServerPath = `wwwroot/Data/Photos/${serverFilePath}`;

      const updateData = {
        childIdNumber: formData.PersonId,
        photoFilePath: fullServerPath
      };

      console.log("Uploading photo data:", updateData);

      // Upload the photo to the database
      const photoResponse = await axios.post(
        'http://localhost:5265/api/application/update-photo',
        updateData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Photo upload response:", photoResponse.data);
    }

    // Step 2: Submit the rest of the form as usual
    const applicationData = {
      ...formData,
      DOB: formData.DOB ? new Date(formData.DOB).toISOString() : null,
    };

    const applicantData = {
      PersonId: formData1.PersonId,
      Email: formData1.Email,
      UserPhoneNumber: formData1.PhoneNumber
    };

    const nextOfKinData = {
      PersonId: formDataNOK.PersonId,
      FatherName: formDataNOK.FatherName,
      FatherId: formDataNOK.FatherId,
      MotherName: formDataNOK.MotherName,
      MotherId: formDataNOK.MotherId
    };

    const applicationExists = await checkExistingApplication(formData.PersonId);
    if (applicationExists) {
      setMessage("An application with this ID number already exists.");
      alert("You cannot submit another application with this ID.");
      setIsLoading(false);
      return;
    }

    // Submit Application
    const applicationResponse = await axios.post(
      'http://localhost:5265/api/Application',
      applicationData
    );
    const applicationId = applicationResponse.data.applicationId;

    // Submit Applicant
    await axios.post('http://localhost:5265/api/Applicant', applicantData);

    // Submit Next Of Kin
    await axios.post('http://localhost:5265/api/NextOfKin', nextOfKinData);

    // Optional: Submit documents like birth cert and ID copy
    // const documentFormData = new FormData();
    // documentFormData.append('ApplicationId', applicationId);
    // if (birthCertificate) documentFormData.append('BirthCertificate', birthCertificate);
    // if (idCopy) documentFormData.append('IdCopy', idCopy);
    // await axios.post('http://localhost:5265/api/Document', documentFormData, {
    //   headers: { 'Content-Type': 'multipart/form-data' }
    // });

    // Success
    setMessage("Application submitted successfully!");
    alert("Your application has been submitted!");

    // Clear form
    setFormData(initialFormState);
    setFormData1(ApplicantFormState);
    setFormDataNOK(NextOfKinFormState);
    setProfilePicture(null);
    setBirthCertificate(null);
    setIdCopy(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    localStorage.removeItem("formData");
    localStorage.removeItem("formData1");
    localStorage.removeItem("formDataNOK");

    localStorage.setItem("applicantData", JSON.stringify(applicantData));
    navigate("/processing");

  } catch (error) {
    console.error("Error submitting application:", error);

    let errorMsg = "Failed to submit application.";

    if (error.response?.data?.error) {
      errorMsg += ` Error: ${error.response.data.error}`;
    } else if (error.message) {
      errorMsg += ` Message: ${error.message}`;
    }

    setMessage(errorMsg);
    alert(errorMsg);
  } finally {
    setIsLoading(false);
  }
};

  const provinces = [
    "Eastern Cape",
    "Free State",
    "Gauteng",
    "KwaZulu-Natal",
    "Limpopo",
    "Mpumalanga",
    "Northern Cape",
    "North West",
    "Western Cape"
  ];

  // Function to manually trigger parent info fetch
  const handleManualParentInfoFetch = () => {
    if (formData.PersonId && formData.PersonId.length === 13) {
      fetchParentInfo(formData.PersonId);
    } else {
      setParentInfoMessage('Please enter a valid 13-digit ID number first');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardContent}>
          <h2 className={styles.title}>Home Affairs Application Form</h2>
          
          {message && (
            <div className={message.includes('failed') || message.includes('error') || message.includes('Error') ? styles.errorMessage : styles.successMessage}>
              {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Personal Information Section */}
            <div className={styles.sectionHeader}>Personal Information</div>
            
            <div className={styles.formGroup}>
              <label htmlFor="FullName">Full Name <span className={styles.required}>*</span></label>
              <input
                id="FullName"
                type="text"
                name="FullName"
                value={formData.FullName || ''}
                //value={formData.fieldName || ''}
                onChange={handleChange}
                className={errors.FullName ? styles.inputError : ''}
                readOnly
              />
              {errors.FullName && <div className={styles.errorText}>{errors.FullName}</div>}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="DOB">Date of Birth <span className={styles.required}>*</span></label>
                <input
                  id="DOB"
                  type="date"
                  name="DOB"
                  value={formData.DOB || ''}
                  onChange={handleChange}
                  className={errors.DOB ? styles.inputError : ''}
                  readOnly
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="Gender">Gender <span className={styles.required}>*</span></label>
                <select
                  id="Gender"
                  name="Gender"
                  value={formData.Gender || ''}
                  onChange={handleChange}
                  className={errors.Gender ? styles.inputError : ''}
                  disabled
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  
                </select>
                {errors.Gender && <div className={styles.errorText}>{errors.Gender}</div>}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="idNumber">ID Number <span className={styles.required}>*</span></label>
                <input
                  id="idNumber"
                  type="text"
                  name="PersonId"
                  value={formData.PersonId || ''}
                  onChange={handleChange}
                  onBlur={handleIdBlur}
                  placeholder="13 digits"
                  className={errors.PersonId ? styles.inputError : ''}
                  readOnly
                />
                {errors.PersonId && <div className={styles.errorText}>{errors.PersonId}</div>}
                {idExists && !errors.PersonId && (<div className={styles.errorText}>An application with this ID already exists.</div>)}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone">Phone <span className={styles.required}>*</span></label>
                <input
                  id="phone"
                  type="tel"
                  name="PhoneNumber"
                  value={formData.PhoneNumber || ''}
                  onChange={handleChange}
                  placeholder="10 digits"
                  className={errors.PhoneNumber ? styles.inputError : ''}
                />
                {errors.PhoneNumber && <div className={styles.errorText}>{errors.PhoneNumber}</div>}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email <span className={styles.required}>*</span></label>
              <input
                id="email"
                type="email"
                name="Email"
                value={formData.Email || ''}
                onChange={handleChange}
                className={errors.Email ? styles.inputError : ''}
                readOnly
              />
              {errors.Email && <div className={styles.errorText}>{errors.Email}</div>}
            </div>

            {/* Rest of the form remains the same */}
            <div className={styles.formGroup}>
              <label htmlFor="address">Address</label>
              <input
                id="address"
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="countryOfBirth">Country of Birth</label>
                <input
                  id="countryOfBirth"
                  type="text"
                  name="CountryOfBirth"
                  value={formData.CountryOfBirth || ''}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="province">Province <span className={styles.required}>*</span></label>
                <select
                  id="province"
                  name="Province"
                  value={formData.Province || ''}
                  onChange={handleChange}
                  className={errors.Province ? styles.inputError : ''}
                >
                  <option value="">Select Province</option>
                  {provinces.map((province, index) => (
                    <option key={index} value={province}>{province}</option>
                  ))}
                </select>
                {errors.Province && <div className={styles.errorText}>{errors.Province}</div>}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="applicationType">Application Type</label>
              <select
                id="applicationType"
                name="applicationType"
                value={formData.applicationType || ''}
                onChange={handleChange}
                
              >
                <option value="">Select Application Type</option>
                <option value="ID Card">ID Card</option>
                
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="maritalStatus">Marital Status</label>
              <select
                id="maritalStatus"
                name="maritalStatus"
                value={formData.maritalStatus || ''}
                onChange={handleChange}
              >
                <option value="">Select Marital Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>

            {/* Family Information Section */}
            <div className={styles.sectionHeader}>Family Information</div>
            
            {/* Show parent info message if available */}
            {parentInfoMessage && (
              <div className={parentInfoMessage.includes('Error') || parentInfoMessage.includes('error') ? 
                styles.errorMessage : styles.infoMessage}>
                {parentInfoMessage}
              </div>
            )}
            
            {isLoadingParentInfo && (
              <div className={styles.loadingMessage}>
                <span>Fetching parent information...</span>
              </div>
            )}
            
            {/* Add a manual fetch button */}
            {formData.PersonId && formData.PersonId.length === 13 && !isLoadingParentInfo && (
              <div className={styles.formGroup}>
                <button 
                  type="button" 
                  className={styles.secondaryButton} 
                  onClick={handleManualParentInfoFetch}
                  disabled={isLoadingParentInfo}
                >
                  Fetch Parent Information
                </button>
              </div>
            )}
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="fatherName">Father's Name</label>
                <input
                  id="fatherName"
                  type="text"
                  name="FatherName"
                  value={formData.FatherName || ''}
                  onChange={handleChange}
                  className={errors.FatherName ? styles.inputError : ''}
                  readOnly
                />
                {errors.FatherName && <div className={styles.errorText}>{errors.FatherName}</div>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="fatherId">Father's ID</label>
                <input
                  id="fatherId"
                  type="text"
                  name="FatherId"
                  value={formData.FatherId || ''}
                  onChange={handleChange}
                  className={errors.FatherId ? styles.inputError : ''}
                  readOnly
                />
                {errors.FatherId && <div className={styles.errorText}>{errors.FatherId}</div>}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="motherName">Mother's Name</label>
                <input
                  id="motherName"
                  type="text"
                  name="MotherName"
                  value={formData.MotherName || ''}
                  onChange={handleChange}
                  className={errors.MotherName ? styles.inputError : ''}
                  readOnly
                />
                {errors.MotherName && <div className={styles.errorText}>{errors.MotherName}</div>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="motherId">Mother's ID</label>
                <input
                  id="motherId"
                  type="text"
                  name="MotherId"
                  value={formData.MotherId || ''}
                  onChange={handleChange}
                  className={errors.MotherId ? styles.inputError : ''}
                  readOnly
                />
                {errors.MotherId && <div className={styles.errorText}>{errors.MotherId}</div>}
              </div>
            </div>

            {/* Emergency Contact Section
            <div className={styles.sectionHeader}>Emergency Contact</div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="emergencyContact">Emergency Contact Name</label>
                <input
                  id="emergencyContact"
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact || ''}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="emergencyPhone">Emergency Phone</label>
                <input
                  id="emergencyPhone"
                  type="tel"
                  name="emergencyPhone"
                  value={formData.emergencyPhone || ''}
                  onChange={handleChange}
                />
              </div>
            </div> */}

            {/* Additional Information Section */}
            <div className={styles.sectionHeader}>Additional Information</div>
            
            {/* <div className={styles.formGroup}>
              <label htmlFor="disabilities">Disabilities (if any)</label>
              <input
                id="disabilities"
                type="text"
                name="disabilities"
                value={formData.disabilities || ''}
                onChange={handleChange}
              />
            </div> */}

           {/* <div className={styles.container}> */}
              {/* <div className={styles.card}> */}
                {/* Add these new sections to your form */}
                {/* <div className={styles.sectionHeader}>Profile Picture</div> */}
                {/* <div className={styles.formGroup}>
                  <label htmlFor="profilePicture">Upload Profile Photo <span className={styles.required}>*</span></label>
                  <input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    ref={fileInputRef}
                    required
                  />
                  {profilePicture && (
                    <div className={styles.previewContainer}>
                      <img 
                        src={profilePicture} 
                        alt="Profile Preview" 
                        className={styles.previewImage}
                      />
                    </div>
                  )}
                </div> */}

                {/* <div className={styles.sectionHeader}>Required Documents</div> */}
                {/* <div className={styles.formGroup}>
                  <label htmlFor="birthCertificate">Birth Certificate <span className={styles.required}>*</span></label>
                  <input
                    id="birthCertificate"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleBirthCertificateChange}
                    required
                  />
                </div> */}

                {/* <div className={styles.formGroup}>
                  <label htmlFor="idCopy">ID Copy <span className={styles.required}>*</span></label>
                  <input
                    id="idCopy"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleIdCopyChange}
                    required
                  />
                </div> */}
              {/* </div> */}
            {/* </div> */}

             <div className={styles.formGroup}>
                <label htmlFor="profilePhotoPath">Profile Photo Path</label>
                {/* <input
                  id="profilePhotoPath" // you need to work on this
                  type="text"
                  value={
                    // Try to get the path from localStorage, fallback to formData.ProfilePicture if needed
                    JSON.parse(localStorage.getItem('applicationFormData'))?.ProfilePicture || formData.ProfilePicture || ''
                  }
                  readOnly
                  
                /> */}
                <Link to="/camera">
                  <button type="button" onClick={updateChildPhoto} className={styles.secondaryButton}>
                    Take Photo
                  </button>
                </Link>

                {/* <button type="button" onClick={updateChildPhoto} className={styles.primaryButton}>
                  Submit Photo to Database
                </button> */}
              </div> 

            {/* Form Actions */}
            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.saveButton} 
                onClick={handleSave}
                disabled={isLoading}
              >
                Save for Later
              </button>
              
              <button 
                type="button" 
                className={styles.continueButton} 
                onClick={handleContinue}
                disabled={isLoading}
              >
                Clear Form
              </button>
              
              <button 
                
                className={styles.submitButton} 
                type="submit" 
                disabled={isLoading || idExists}
              >
                {isLoading ? 'Submitting...' : idExists ? 'Application Already Exists' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicationPg;