import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Login.css';
//Comment comit
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(username, password)) {
      navigate('/dashboard');
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="login-container">
      <div id="logo"> 
        <h1><i>Login ARQUI2A_2S2025_G6 </i></h1>
      </div> 
      <section className="tech-login"> 
        <form onSubmit={handleSubmit}>	
          <div id="fade-box">
            <input 
              type="text" 
              placeholder="Username" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input 
              type="password" 
              placeholder="Password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <div className="error-message">{error}</div>}
            <button type="submit">Log In</button> 
          </div>
        </form>
        <div className="hexagons">
          {Array(12).fill().map((_, i) => <span key={i}>&#x2B22;</span>)}
          <br/>
          {Array(11).fill().map((_, i) => <span key={i}>&#x2B22;</span>)}
          <br/>
          {Array(12).fill().map((_, i) => <span key={i}>&#x2B22;</span>)}
          <br/>
          {Array(11).fill().map((_, i) => <span key={i}>&#x2B22;</span>)}
          <br/>
          {Array(12).fill().map((_, i) => <span key={i}>&#x2B22;</span>)}
        </div>      
      </section> 
      
      <div id="circle1">
        <div id="inner-cirlce1">
          <h2> </h2>
        </div>
      </div>
    </div>
  );
};

export default Login;
