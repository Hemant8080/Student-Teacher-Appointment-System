import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// User registration
export const registerUser = async (email, password, userData) => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update the user's display name
    await updateProfile(user, {
      displayName: userData.name
    });

    // Create user document in Firestore
    const userDocData = {
      uid: user.uid,
      email: user.email,
      name: userData.name,
      role: userData.role,
      createdAt: new Date().toISOString(),
      approved: userData.role === 'student' ? false : true, // Students need approval
      phone: userData.phone, // Add phone field
      ...userData
    };

    // Save user data to Firestore
    await setDoc(doc(db, 'users', user.uid), userDocData);

    // If it's a student, also add to pending registrations
    if (userData.role === 'student') {
      await setDoc(doc(db, 'pendingRegistrations', user.uid), {
        ...userDocData,
        status: 'pending'
      });
    }

    return {
      success: true,
      user: userDocData,
      message: userData.role === 'student' 
        ? 'Registration successful! Please wait for admin approval.' 
        : 'Registration successful!'
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// User login
export const loginUser = async (email, password) => {
  try {
    // Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }

    const userData = userDoc.data();

    // Check if user is approved (especially for students)
    if (!userData.approved) {
      await signOut(auth); // Sign out the user
      throw new Error('Your account is pending approval. Please contact the administrator.');
    }

    return {
      success: true,
      user: userData,
      message: 'Login successful!'
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// User logout
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return {
      success: true,
      message: 'Logout successful!'
    };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get current user data
export const getCurrentUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Password reset
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: 'Password reset email sent!'
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Auth state observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Admin functions
export const getPendingRegistrations = async () => {
  try {
    const q = query(collection(db, 'pendingRegistrations'), where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    const pendingUsers = [];
    
    querySnapshot.forEach((doc) => {
      pendingUsers.push({ id: doc.id, ...doc.data() });
    });
    
    return pendingUsers;
  } catch (error) {
    console.error('Error getting pending registrations:', error);
    return [];
  }
};

export const approveUserRegistration = async (uid) => {
  try {
    // Update user document
    await updateDoc(doc(db, 'users', uid), {
      approved: true,
      approvedAt: new Date().toISOString()
    });

    // Update pending registration status
    await updateDoc(doc(db, 'pendingRegistrations', uid), {
      status: 'approved',
      approvedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'User approved successfully!'
    };
  } catch (error) {
    console.error('Error approving user:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const rejectUserRegistration = async (uid) => {
  try {
    // Update pending registration status
    await updateDoc(doc(db, 'pendingRegistrations', uid), {
      status: 'rejected',
      rejectedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'User registration rejected!'
    };
  } catch (error) {
    console.error('Error rejecting user:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get all users by role
export const getUsersByRole = async (role) => {
  try {
    const q = query(collection(db, 'users'), where('role', '==', role), where('approved', '==', true));
    const querySnapshot = await getDocs(q);
    const users = [];
    
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    return users;
  } catch (error) {
    console.error('Error getting users by role:', error);
    return [];
  }
};
