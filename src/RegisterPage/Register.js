import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Register.module.css';
import axios from 'axios';

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    IdentityId: '',
    Firstname: '',
    Surname: '',
    DateOfBirth: '',
    Email: '',
    UserPassword: '',
    Gender: ''
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [isIdValid, setIsIdValid] = useState(false);
  const [userExists, setUserExists] = useState(false);

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;

    if (name === 'UserPassword') {
      if (!validatePassword(value)) {
        setPasswordError([
          'Password must be at least 8 characters long.',
          'Password must include at least one uppercase letter.',
          'Password must include at least one lowercase letter.',
          'Password must include at least one number.',
          'Password must include at least one special character (e.g., @$!%*?&).'
        ]);
      } else {
        setPasswordError('');
      }
    }

    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'IdentityId' && value.length >= 6) {
      try {
        // Check if user already exists with this ID
        const existsRes = await axios.get(`http://localhost:5265/api/Person/exists/${value}`);
        if (existsRes.data.exists) {
          setMessage('An account with this ID number already exists.');
          setIsIdValid(false);
          setUserExists(true);
          return; // Stop further processing
        } else {
          setUserExists(false);
        }
        
        // If user doesn't exist, check if their info is in the system
        const res = await axios.get(`http://localhost:5265/api/Person/child-info/${value}`);
        if (res.data) {
          setFormData((prev) => ({
            ...prev,
            Gender: res.data.gender === 'M' ? 'Male' : res.data.gender === 'F' ? 'Female' : 'Other',
            Firstname: res.data.firstname,
            Surname: res.data.surname,
            DateOfBirth: res.data.dateOfBirth
          }));
          setMessage('');
          setIsIdValid(true);
        }
      } catch (err) {
        // If error is from exists check, the message is already set
        if (!userExists) {
          setMessage('ID not found in system.');
          setFormData((prev) => ({
            ...prev,
            Firstname: '',
            Surname: '',
            Gender: '',
            DateOfBirth: ''
          }));
          setIsIdValid(false);
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isIdValid || userExists) {
      const msg = userExists 
        ? 'An account with this ID number already exists.' 
        : 'You must enter a valid ID found in the system.';
      setMessage(msg);
      alert(msg);
      return;
    }

    if (formData.UserPassword !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setMessage(msg);
      alert(msg);
      return;
    }

    const submissionData = { ...formData };

    setIsLoading(true);
    setMessage('');

    try {
      const response = await axios.post('http://localhost:5265/api/Person', submissionData);
      const successMessage = 'Registration successful!';
      setMessage(successMessage);
      alert(successMessage);

      // Save user data to localStorage for use in the application form
      const userApplicationData = {
        PersonId: formData.IdentityId,
        FullName: `${formData.Firstname} ${formData.Surname}`,
        Gender: formData.Gender,
        DOB: formData.DateOfBirth,
        Email: formData.Email,
        // Add any other fields you want to pre-populate
      };
      
      // Store the user data with the email as key for later retrieval
      localStorage.setItem(`applicationData_${formData.Email}`, JSON.stringify(userApplicationData));
      
      // Also store the currently logged in user's email
      localStorage.setItem('currentUserEmail', formData.Email);

      setFormData({
        IdentityId: '',
        Firstname: '',
        Surname: '',
        DateOfBirth: '',
        Email: '',
        UserPassword: '',
        Gender: ''
      });
      setConfirmPassword('');
      setIsIdValid(false);
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);

      let errorMessage = 'Registration failed: ';
      if (error.response) {
        errorMessage += (error.response.data.message || error.response.data || error.response.statusText);
      } else if (error.request) {
        errorMessage += 'No response from server. Check your connection.';
      } else {
        errorMessage += error.message;
      }

      setMessage(errorMessage);
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageStyle = () => {
    if (!message) return '';
    return message.toLowerCase().includes('success') ? styles.successMessage : styles.errorMessage;
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.formFrame}>
        <h1>Welcome to Your New Account</h1>
        <h2>Sign Up</h2>
        <p>Create a new account to get started.</p>

        {message && <div className={getMessageStyle()}>{message}</div>}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <div className={styles.inputGroup}>
                <label htmlFor="IdentityId">South African ID Number</label>
                <input
                  type="text"
                  id="IdentityId"
                  name="IdentityId"
                  value={formData.IdentityId}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
              <label htmlFor="Firstname">First Name</label>
              <input
                type="text"
                id="Firstname"
                name="Firstname"
                value={formData.Firstname}
                onChange={handleChange}
                required
                disabled={isIdValid}
                readOnly
              />
            </div>

            <div className={styles.inputGroup}>
            <label htmlFor="Surname">Surname</label>
            <input
              type="text"
              id="Surname"
              name="Surname"
              value={formData.Surname}
              onChange={handleChange}
              required
              disabled={isIdValid}
              readOnly
            />
          </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className={styles.inputGroup}>
              <label htmlFor="DateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="DateOfBirth"
                name="DateOfBirth"
                value={formData.DateOfBirth}
                onChange={handleChange}
                required
                disabled={isIdValid}
                readOnly
              />
            </div>


              <div className={styles.inputGroup}>
                <label htmlFor="Email">Email</label>
                <input
                  type="email"
                  id="Email"
                  name="Email"
                  value={formData.Email}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className={styles.inputGroup}>
                <label htmlFor="UserPassword">Password</label>
                <input
                  type="password"
                  name="UserPassword"
                  id="UserPassword"
                  placeholder="Password"
                  value={formData.UserPassword}
                  onChange={handleChange}
                  required
                />
                {passwordError && (
                  <ul className={styles.errorText}>
                    {Array.isArray(passwordError)
                      ? passwordError.map((error, index) => <li key={index}>{error}</li>)
                      : <li>{passwordError}</li>}
                  </ul>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {confirmPassword && confirmPassword !== formData.UserPassword && (
                  <p className={styles.errorText}>Passwords do not match.</p>
                )}
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                style={{
                  backgroundColor: '#1e90ff',
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '12px 40px',
                  border: 'none',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Back
              </button>
            )}
            {step < 3 && (
              <button
                type="button"
                onClick={() => {
                  // Don't allow proceeding if user already exists
                  if (userExists) {
                    alert('An account with this ID number already exists.');
                    return;
                  }
                  setStep(step + 1);
                  setMessage('');
                }}
                style={{
                  backgroundColor: '#1e90ff',
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '12px 30px',
                  border: 'none',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  paddingBottom: '10px'
                }}
              >
                Next
              </button>
            )}
          </div>

          {step === 3 && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                className={styles.registerButton}
                type="submit"
                disabled={isLoading || !isIdValid || userExists}
              >
                {isLoading ? 'Registering...' : 'Register'}
              </button>
            </div>
          )}

          <div className={styles.backButtons}>
            <Link to="/login" className={styles['back-login']}>
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;