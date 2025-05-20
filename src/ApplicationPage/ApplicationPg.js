import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styles from "./ApplicationPg.module.css";


//ALTER SEQUENCE "NextOfKin_NEXT_OF_KIN_ID_seq" RESTART WITH 1;
//TRUNCATE TABLE public."Applicant" RESTART IDENTITY;

const ApplicationPg = () => {

  const [idExists, setIdExists] = useState(false);
  const navigate = useNavigate();
  // Add these new state variables
  const [profilePicture, setProfilePicture] = useState(null);
  const [birthCertificate, setBirthCertificate] = useState(null);
  const [idCopy, setIdCopy] = useState(null);
  const fileInputRef = useRef(null);

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

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("formData");
    const savedData1 = localStorage.getItem("formData1"); 
    const savedDataNOK = localStorage.getItem("formDataNOK");
    if (savedData && savedData1 && savedDataNOK) {
      try {
        setFormData(JSON.parse(savedData));
        setFormData1(JSON.parse(savedData1));
        setFormDataNOK(JSON.parse(savedDataNOK));
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
    // if (!formData.PersonId || !/^\d{13}$/.test(formData.PersonId)) {
    //   newErrors.PersonId = "Please enter a valid 13-digit ID number";
    // }

    if (!formData.PersonId || !/^\d{13}$/.test(formData.PersonId)) {
      newErrors.PersonId = "Please enter a valid 13-digit ID number";
    } else if (idExists) {
      newErrors.PersonId = "An application with this ID already exists";
    }

    // if (!formData.MotherId || !/^\d{13}$/.test(formData.MotherId)) {
    //   newErrors.MotherId = "Please enter a valid 13-digit ID number";
    // } else if (idExists) {
    //   newErrors.MotherId = "A Parent application with this ID already exists";
    // }

    // if (!formData.FatherId || !/^\d{13}$/.test(formData.FatherId)) {
    //   newErrors.FatherId = "Please enter a valid 13-digit ID number";
    // } else if (idExists) {
    //   newErrors.FatherId = "A Parent application with this ID already exists";
    // }

    if (formData.MotherId && !/^\d{13}$/.test(formData.MotherId)) {
      newErrors.MotherId = "Please enter a valid 13-digit ID number";
    } else if (idExists) {
      newErrors.MotherId = "A Parent application with this ID already exists";
    }
    
    if (formData.FatherId && !/^\d{13}$/.test(formData.FatherId)) {
      newErrors.FatherId = "Please enter a valid 13-digit ID number";
    } else if (idExists) {
      newErrors.FatherId = "A Parent application with this ID already exists";
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  

  const handleChange = (e) => {
    const { name, value } = e.target;
  
    let updatedFormData = { ...formData, [name]: value };
  
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

    // if (name === "MotherId" && value.length === 13) {

    //   checkExistingApplication(value).then(exists => {
    //     setIdExists(exists);
    //     if (exists) {
    //       setErrors(prev => ({
    //         ...prev,
    //         MotherId: "An application with this ID already exists"
    //       }));

          
    //     }
    //   });
    // }

    // if (name === "FatherId" && value.length === 13) {

    //   checkExistingApplication(value).then(exists => {
    //     setIdExists(exists);
    //     if (exists) {
    //       setErrors(prev => ({
    //         ...prev,
    //         FatherId: "An application with this ID already exists"
    //       }));

          
    //     }
    //   });
    // }
  
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

  const populatedATEofBirth = async(personId) =>{
    
    //0208086212080

    // try {

    //   var String yearBirth = personId.substring();
      
    // } catch (error) {
      
    // }
  }

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
    }

    // if (formData.MotherId.length === 13) {
    //   const exists = await checkExistingApplication(formData.MotherId);
    //   setIdExists(exists);
  
    //   if (exists) {
    //     setErrors(prev => ({
    //       ...prev,
    //       MotherId: "A Parent application with this ID already exists"
    //     }));
    //   }
    // }

    // if (formData.FatherId.length === 13) {
    //   const exists = await checkExistingApplication(formData.FatherId);
    //   setIdExists(exists);
  
    //   if (exists) {
    //     setErrors(prev => ({
    //       ...prev,
    //       FatherId: "A Parent application with this ID already exists"
    //     }));
    //   }
    // }
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

      const applicationData = { 
        ...formData,
        // Format DOB properly for backend
        DOB: formData.DOB ? new Date(formData.DOB).toISOString() : null,

        ProfilePicture: profilePicture ? profilePicture.split(',')[1] : null 
      };

      // const applicationData = { ...formData };
      const applicantData = { 
        PersonId: formData1.PersonId,
        Email: formData1.Email,
        UserPhoneNumber: formData1.PhoneNumber // Map to UserPhoneNumber as expected by API
      };
      localStorage.setItem("applicantData", JSON.stringify(applicantData));
      
      const nextOfKinData = {
        PersonId: formDataNOK.PersonId,
        FatherName: formDataNOK.FatherName,
        FatherId: formDataNOK.FatherId,
        MotherName: formDataNOK.MotherName,
        MotherId: formDataNOK.MotherId
      }

      const applicationExists = await checkExistingApplication(formData.PersonId);
      console.log("Application exists check result:", applicationExists);
      // Now validate using the result of the async check
      const isValid = validateForm(applicationExists);

      if (!isValid) {
        setMessage("Please correct the errors in the form.");
        setIsLoading(false);
        return;
      }

      
    
      if (applicationExists) {
        setMessage("An application with this ID number already exists. You cannot submit another application.");
        alert("Application already exists: You have already submitted an application with this ID number.");
        setIsLoading(false);
        return;
      }

      // Create copies of formData for submission
      
  
      if (formData.DOB) {
        // Convert DOB to UTC and format as ISO string
        const dobDate = new Date(formData.DOB);
        applicationData.DOB = dobDate.toISOString();
      }
      
  
      // First submit the Application
      const applicationResponse = await axios.post('http://localhost:5265/api/Application', applicationData);
      console.log('Application submitted successfully:', applicationResponse.data);
      

      const applicationId = applicationResponse.data.applicationId;

      const documentFormData = new FormData();
      documentFormData.append('ApplicationId', applicationId);

      if (birthCertificate) {
        documentFormData.append('BirthCertificate', birthCertificate);
      }
      if (idCopy) {
        documentFormData.append('IdCopy', idCopy);
      }

      await axios.post('http://localhost:5265/api/Document', documentFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Then submit the Applicant
      const applicantResponse = await axios.post('http://localhost:5265/api/Applicant', applicantData);
      console.log('Applicant submitted successfully:', applicantResponse.data);

      localStorage.setItem("applicantData", JSON.stringify(applicantData));

      const nextOFkINResponse = await axios.post('http://localhost:5265/api/NextOfKin', nextOfKinData);
      console.log('Next of kin submitted successfully:', nextOFkINResponse.data);
      
      const successMessage = 'Application successfully submitted!';
      setMessage(successMessage);
      alert(successMessage);
  
      // Clear form data
      setFormData(initialFormState);
      setFormData1(ApplicantFormState);
      setFormDataNOK(NextOfKinFormState);
      setProfilePicture(null);
      setBirthCertificate(null);
      setIdCopy(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      localStorage.removeItem("formData");
      localStorage.removeItem("formData1");
      localStorage.removeItem("formDataNOK");

      //navigate('/generate_id');
      navigate('/processing');
    } catch (error) {
      if (error.response?.data?.errors) {
        console.log("Validation errors:", error.response.data.errors);
      }
      if (error.response) {
        console.error('Server responded with:', error.response.data);
        console.error('Status code:', error.response.status);
        setMessage(`Error: ${error.response.data.title || error.message}`);
      } else {
        console.error('Error:', error.message);
        setMessage('Network error. Please try again.');
      }

      if (error.response?.status === 400) {
        // Display the backend error message on the screen
        const errorMessage = error.response.data || "An error occurred.";
        setMessage(errorMessage);
      } else {
        console.error("API Error:", error.message);
        setMessage('Application failed. Please check the form and try again.');
      }
      alert(' ' + (error.response?.data || error.message));
    
      setMessage('Application failed. Please check the form and try again.');
      alert('Error: ' + (error.response?.data?.title || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const generateValuer = [
    
  ]
  //0208086212180
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

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardContent}>
          <h2 className={styles.title}>Home Affairs Application Form</h2>
          
          {message && (
            <div className={message.includes('failed') ? styles.errorMessage : styles.successMessage}>
              {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Personal Information Section */}
            <div className={styles.sectionHeader}>Personal Information</div>
            
            <div className={styles.formGroup}>
              <label htmlFor="fullName">Full Name <span className={styles.required}>*</span></label>
              <input
                id="fullName"
                type="text"
                name="FullName"
                value={formData.FullName}
                onChange={handleChange}
                className={errors.FullName ? styles.inputError : ''}
              />
              {errors.FullName && <div className={styles.errorText}>{errors.FullName}</div>}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="dob">Date of Birth <span className={styles.required}>*</span></label>
                <input
                  id="dob"
                  type="date"
                  name="DOB"
                  value={formData.DOB}
                  onChange={handleChange}
                  className={errors.DOB ? styles.inputError : ''}
                  readOnly
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="gender">Gender <span className={styles.required}>*</span></label>
                <select
                  id="gender"
                  name="Gender"
                  value={formData.Gender}
                  onChange={handleChange}
                  className={errors.Gender ? styles.inputError : ''}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
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
                  value={formData.PersonId}
                  onChange={handleChange}
                  placeholder="13 digits"
                  className={errors.PersonId ? styles.inputError : ''}
                 
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
                  value={formData.PhoneNumber}
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
                value={formData.Email}
                onChange={handleChange}
                className={errors.Email ? styles.inputError : ''}
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
                value={formData.address}
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
                  value={formData.CountryOfBirth}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="province">Province <span className={styles.required}>*</span></label>
                <select
                  id="province"
                  name="Province"
                  value={formData.Province}
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
                value={formData.applicationType}
                onChange={handleChange}
              >
                <option value="">Select Application Type</option>
                <option value="ID Card">ID Card</option>
                <option value="Passport">Passport</option>
                <option value="Birth Certificate">Birth Certificate</option>
                <option value="Marriage Certificate">Marriage Certificate</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="maritalStatus">Marital Status</label>
              <select
                id="maritalStatus"
                name="maritalStatus"
                value={formData.maritalStatus}
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
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="fatherName">Father's Name</label>
                <input
                  id="fatherName"
                  type="text"
                  name="FatherName"
                  value={formData.FatherName}
                  onChange={handleChange}
                  onBlur={handleIdBlur}
                  className={errors.FatherName ? styles.inputError : ''}
                />
                {errors.FatherName && <div className={styles.errorText}>{errors.FatherName}</div>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="fatherId">Father's ID</label>
                <input
                  id="fatherId"
                  type="text"
                  name="FatherId"
                  value={formData.FatherId}
                  onChange={handleChange}
                  className={errors.FatherId ? styles.inputError : ''}
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
                  value={formData.MotherName}
                  onChange={handleChange}
                  className={errors.MotherName ? styles.inputError : ''}
                />
                {errors.MotherName && <div className={styles.errorText}>{errors.MotherName}</div>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="motherId">Mother's ID</label>
                <input
                  id="motherId"
                  type="text"
                  name="MotherId"
                  value={formData.MotherId}
                  onChange={handleChange}
                  className={errors.MotherId ? styles.inputError : ''}
                />
                {errors.MotherId && <div className={styles.errorText}>{errors.MotherId}</div>}
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className={styles.sectionHeader}>Emergency Contact</div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="emergencyContact">Emergency Contact Name</label>
                <input
                  id="emergencyContact"
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="emergencyPhone">Emergency Phone</label>
                <input
                  id="emergencyPhone"
                  type="tel"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Additional Information Section */}
            <div className={styles.sectionHeader}>Additional Information</div>
            
            <div className={styles.formGroup}>
              <label htmlFor="disabilities">Disabilities (if any)</label>
              <input
                id="disabilities"
                type="text"
                name="disabilities"
                value={formData.disabilities}
                onChange={handleChange}
              />
            </div>

            <div className={styles.container}>
      <div className={styles.card}>
        {/* ... existing form content ... */}
        
        {/* Add these new sections to your form */}
        <div className={styles.sectionHeader}>Profile Picture</div>
        <div className={styles.formGroup}>
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
        </div>

        <div className={styles.sectionHeader}>Required Documents</div>
        <div className={styles.formGroup}>
          <label htmlFor="birthCertificate">Birth Certificate <span className={styles.required}>*</span></label>
          <input
            id="birthCertificate"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleBirthCertificateChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="idCopy">ID Copy <span className={styles.required}>*</span></label>
          <input
            id="idCopy"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleIdCopyChange}
            required
          />
        </div>

        {/* ... rest of your form ... */}
      </div>
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