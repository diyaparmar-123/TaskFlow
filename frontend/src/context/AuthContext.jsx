import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tf_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tf_token');
    if (!token) { setLoading(false); return; }
    authAPI.me()
      .then(res => setUser(res.data.user))
      .catch(() => { localStorage.removeItem('tf_token'); localStorage.removeItem('tf_user'); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user } = res.data;
    localStorage.setItem('tf_token', token);
    localStorage.setItem('tf_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const signup = async (name, email, password) => {
    const res = await authAPI.signup({ name, email, password });
    const { token, user } = res.data;
    localStorage.setItem('tf_token', token);
    localStorage.setItem('tf_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
