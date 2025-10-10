import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChange, 
  getCurrentUserData, 
  loginUser, 
  registerUser, 
  logoutUser, 
  resetPassword 
} from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, get their data from Firestore
        const userData = await getCurrentUserData(firebaseUser.uid);
        if (userData && userData.approved) {
          setUser(userData);
        } else {
          setUser(null);
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      const result = await loginUser(email, password);
      if (result.success) {
        setUser(result.user);
      }
      setAuthLoading(false);
      return result;
    } catch (error) {
      setAuthLoading(false);
      return { success: false, error: error.message };
    }
  };

  const register = async (email, password, userData) => {
    setAuthLoading(true);
    try {
      const result = await registerUser(email, password, userData);
      setAuthLoading(false);
      return result;
    } catch (error) {
      setAuthLoading(false);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    setAuthLoading(true);
    try {
      const result = await logoutUser();
      setUser(null);
      setAuthLoading(false);
      return result;
    } catch (error) {
      setAuthLoading(false);
      return { success: false, error: error.message };
    }
  };

  const forgotPassword = async (email) => {
    setAuthLoading(true);
    try {
      const result = await resetPassword(email);
      setAuthLoading(false);
      return result;
    } catch (error) {
      setAuthLoading(false);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    loading,
    authLoading,
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
