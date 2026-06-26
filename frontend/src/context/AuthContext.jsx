import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(undefined); // undefined = not checked yet
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser  = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      if (savedUser && savedToken && savedUser !== 'undefined') {
        setUser(JSON.parse(savedUser));
      } else {
        setUser(null);
      }
    } catch (err) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Show nothing until we've checked localStorage — prevents flash-redirect to landing page
  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center',
                    justifyContent:'center', height:'100vh' }}>
        <p style={{ color:'#1565c0' }}>Loading...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);