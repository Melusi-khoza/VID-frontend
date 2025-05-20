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

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for password to validate it
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
    
    // Update form data
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.UserPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

   
    
    // Convert PersonId to number for backend
    const submissionData = {
      ...formData,
      //PersonId: parseInt(formData.PersonId, 10) || 0 // Convert to number or use 0 if invalid
    };
    
    setIsLoading(true);
    setMessage(' ');

    try {
      const response = await axios.post('http://localhost:5265/api/Person', submissionData);
      const successMessage = 'Registration successful!';
      setMessage(successMessage);
      alert(successMessage); // 
      
      // Reset form 
      setFormData({
        IdentityId:'',
        Firstname: '',
        Surname: '',
        DateOfBirth: '',
        Email: '',
        UserPassword: '',
        Gender: ''
      });
      setConfirmPassword('');
      
      // Navigate programmatically after successful registration
      navigate('/login');
      
    } catch (error) {
      console.error('Registration error:', error);

      let errorMessage = 'Registration failed: ';
      if (error.response) {
        console.error('Response data:', error.response.data);
        errorMessage += (error.response.data.message || error.response.data || error.response.statusText);
      } else if (error.request) {
        errorMessage += 'No response from server. Check your connection.';
      } else {
        errorMessage += error.message;
      }

      setMessage('Registration failed: ' + (error.response?.data || error.message));
      alert(message); // Show error message
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.formFrame}>
        <h1>Welcome to Your New Account</h1>
        <h2>Sign Up</h2>
        <p>Create a new account to get started.</p>

        {message && <div className={styles.message}>{message}</div>}

        <form onSubmit={handleSubmit}>
          {/* Step 1 */}
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
                />
              </div>
            </>
          )}

          {/* Step 2 */}
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

          {/* Step 3 */}
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

              <div className={styles.inputGroup}>
                <label htmlFor="Gender">Gender</label>
                <select
                  id="Gender"
                  name="Gender"
                  value={formData.Gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </>
          )}

          {/* Step Navigation Buttons */}
          <div
  style={{
    display: 'flex',
    gap: '10px', // space between the buttons
    justifyContent: 'center', // center buttons
    marginTop: '20px',
  }}
>
  {step > 1 && (
    <button
      type="button"
      onClick={() => setStep(step - 1)}
      style={{
        backgroundColor: '#1e90ff', // blue like in your screenshot
        color: 'white',
        fontWeight: 'bold',
        padding: '12px 40px',
        border: 'none',
        borderRadius: '999px', // fully rounded
        cursor: 'pointer',
        fontSize: '16px',
        
      }}
    >
      Back
    </button>
  )}
  {step < 3 && (
    <button
      type="button"
      onClick={() => setStep(step + 1)}
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

          {/* Submit Button */}
          {step === 3 && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button className={styles.registerButton} type="submit" disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </div>
          
          )}

          {/* Back to Login Button */}
          <div className={styles.backButtons}>
            {/* <Link to="/login">
                Back to Login
              
            </Link> */}
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