import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Login.module.css'; // Importing the CSS module
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';


const Login = () =>{

  const[email, setEmail] = useState('');
  const[password, setPassword] = useState('');

  const[error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {

    e.preventDefault();
    setError('');
    setLoading(true);
  
    try{
        const response = await axios.post('http://localhost:5265/api/auth/login',{
          email,
          password
        });

        console.log("Login response:", response.data);

        //console.log("User ID saved:", response.data.userId);
        // Store the token in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.userId);

        // Redirect to dashboard or home page
        navigate('/my_register');
        // Example after successful login
      //localStorage.setItem("userId", user.personId);

      } 
      catch(err){
        setError(
          alert("Login failed. Please check your credentials and try again.")
          //err.response?.data || 'Login failed. Please check your credentials and try again.'

          
        );
      } finally{
        setLoading(false);
      }
    }

  return (

    
    <div className={styles['login-container']}>
     <h2>Login to Your Account</h2>
      <p>Welcome back! Please enter your credentials.</p>

      <form onSubmit={handleSubmit}>
        <div className={styles['input-group']}>
          <label htmlFor="idNumber">Email</label>
          <input type="text" id="email" placeholder="Enter your Email" value={email} onChange={(e) => setEmail(e.target.value)}/>
        </div>

        <div className={styles['input-group']}>
          <label htmlFor="password">Password</label>
          <input type="password" id="password" placeholder="Enter your Password" value={password} onChange={(e) => setPassword(e.target.value)}/>
        </div>

        <button type="submit" className={styles['login-btn']} disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div style={{ display: 'flex', gap: '1rem' }}>
        <div>
          <Link to="/register" className={styles['forgot-gotoregister']}>
            Go to register?
          </Link>
        </div>
        <div>
          <Link to="/forgot-password" className={styles['forgot-password']}>
            Forgot Password?
          </Link>
        </div>
      </div>     
        </form>
    </div>
  
  );
}

export default Login;
