import React, { useState } from 'react';
import Login from './components/Login';
import Signin from './components/Signin';
import Chat from './components/Chat';
import { signup, login as loginApi } from './api';

function App(){
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('hs_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'

  const handleLogin = async ({ name, email, password }) => {
    try {
      // Try login first; if user not found, fallback to signup
      let res;
      try {
        res = await loginApi({ email, password });
      } catch (e) {
        if (e.response && e.response.status === 401 && mode === 'signup') {
          // signup
          res = await signup({ name, email, password });
        } else {
          throw e;
        }
      }
      localStorage.setItem('hs_user', JSON.stringify(res));
      setUser(res);
    } catch (e) {
      alert('Authentication failed');
      console.error(e);
    }
  };

  const logout = () => {
    localStorage.removeItem('hs_user');
    setUser(null);
  };

  if (user) return <Chat user={user} onLogout={logout} />;
  if (mode === 'signin') {
    return <Signin onSignin={({ email, password }) => handleLogin({ email, password })} onSwitchToSignup={() => setMode('signup')} />
  }
  return <Login onLogin={(payload) => handleLogin(payload)} />
}

export default App;
