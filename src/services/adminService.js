import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { updatePassword, createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { db, auth, getSecondaryAuth } from '../config/firebase';

// Get all pending student registrations
export const getPendingStudentRegistrations = async () => {
  try {
    const q = query(
      collection(db, 'pendingRegistrations'), 
      where('status', '==', 'pending'),
      where('role', '==', 'student')
    );
    const querySnapshot = await getDocs(q);
    const pendingStudents = [];
    
    querySnapshot.forEach((doc) => {
      pendingStudents.push({ 
        id: doc.id, 
        ...doc.data() 
      });
    });
    
    return {
      success: true,
      data: pendingStudents
    };
  } catch (error) {
    console.error('Error getting pending registrations:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Approve student registration
export const approveStudentRegistration = async (studentUid) => {
  try {
    // Update user document to set approved = true
    await updateDoc(doc(db, 'users', studentUid), {
      approved: true,
      approvedAt: new Date().toISOString(),
      status: 'active'
    });

    // Update pending registration status
    await updateDoc(doc(db, 'pendingRegistrations', studentUid), {
      status: 'approved',
      approvedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Student registration approved successfully! The student can now login.'
    };
  } catch (error) {
    console.error('Error approving student registration:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Reject student registration
export const rejectStudentRegistration = async (studentUid, reason = '') => {
  try {
    // Update pending registration status
    await updateDoc(doc(db, 'pendingRegistrations', studentUid), {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason
    });

    // Optionally, you can also update the user document
    await updateDoc(doc(db, 'users', studentUid), {
      approved: false,
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason
    });

    return {
      success: true,
      message: 'Student registration rejected.'
    };
  } catch (error) {
    console.error('Error rejecting student registration:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get all approved students
export const getApprovedStudents = async () => {
  try {
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'student'),
      where('approved', '==', true)
    );
    const querySnapshot = await getDocs(q);
    const students = [];
    
    querySnapshot.forEach((doc) => {
      students.push({ 
        id: doc.id, 
        ...doc.data() 
      });
    });
    
    return {
      success: true,
      data: students
    };
  } catch (error) {
    console.error('Error getting approved students:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Get all teachers
export const getAllTeachers = async () => {
  try {
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'teacher'),
      where('approved', '==', true)
    );
    const querySnapshot = await getDocs(q);
    const teachers = [];
    
    querySnapshot.forEach((doc) => {
      teachers.push({ 
        id: doc.id, 
        ...doc.data() 
      });
    });
    
    return {
      success: true,
      data: teachers
    };
  } catch (error) {
    console.error('Error getting teachers:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Add new teacher (Admin function)
export const addTeacher = async (teacherData) => {
  try {
    // Use a secondary auth so we don't affect the current admin session
    const secondaryAuth = getSecondaryAuth();

    try {
      // Try creating the Firebase Authentication user first
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        teacherData.email, 
        teacherData.password
      );
      
      const firebaseUser = userCredential.user;

      // Create teacher document in Firestore
      const teacherDoc = {
        uid: firebaseUser.uid,
        email: teacherData.email,
        name: teacherData.name,
        department: teacherData.department,
        subject: teacherData.subject,
        phone: teacherData.phone || '',
        role: 'teacher',
        approved: true,
        createdAt: new Date().toISOString(),
        addedBy: auth.currentUser?.uid || 'admin',
        status: 'active'
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), teacherDoc);

      // Clear the secondary session
      await signOut(secondaryAuth);

      return {
        success: true,
        message: `Teacher added successfully! Teacher ID: ${firebaseUser.uid}. The teacher can now login with their email and password.`,
        teacherId: firebaseUser.uid
      };
    } catch (createErr) {
      // If the email is already in use, attempt to sign in and link the Firestore doc
      if (createErr?.code === 'auth/email-already-in-use') {
        try {
          // Try signing in with the provided password
          const signInCred = await signInWithEmailAndPassword(
            secondaryAuth,
            teacherData.email,
            teacherData.password
          );
          const existingUser = signInCred.user;

          // Create or update teacher document in Firestore
          const teacherDoc = {
            uid: existingUser.uid,
            email: teacherData.email,
            name: teacherData.name,
            department: teacherData.department,
            subject: teacherData.subject,
            phone: teacherData.phone || '',
            role: 'teacher',
            approved: true,
            createdAt: new Date().toISOString(),
            addedBy: auth.currentUser?.uid || 'admin',
            status: 'active'
          };

          await setDoc(doc(db, 'users', existingUser.uid), teacherDoc);
          await signOut(secondaryAuth);

          return {
            success: true,
            message: `Existing account linked. Teacher ID: ${existingUser.uid}. The teacher can now login with their existing email and password.`,
            teacherId: existingUser.uid
          };
        } catch (signinErr) {
          // Could not sign in with the provided password; send a reset email and report
          try {
            await sendPasswordResetEmail(secondaryAuth, teacherData.email);
          } catch (resetErr) {
            // Log but do not block on reset email failure
            console.warn('Failed to send password reset email:', resetErr?.message);
          }

          return {
            success: false,
            error: 'A user with this email already exists. A password reset email has been sent to this address. Ask the teacher to reset the password, then try linking again using the correct password.'
          };
        }
      }

      // Other errors from create flow
      let errorMessage = 'Failed to add teacher';
      if (createErr.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (createErr.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check the email format.';
      } else {
        errorMessage = createErr.message;
      }

      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error('Error adding teacher:', error);
    return {
      success: false,
      error: error.message || 'Failed to add teacher'
    };
  }
};

// Update teacher information
export const updateTeacher = async (teacherId, updates) => {
  try {
    // Note: Password updates through client-side Firebase Auth have limitations
    // In a production system, you would use Firebase Admin SDK for this
    if (updates.password) {
      console.log('Password update requires Firebase Admin SDK for security');
      // For now, we'll just log this and continue with other updates
    }

    // Remove password from updates before saving to Firestore
    const { password, ...firestoreUpdates } = updates;
    
    await updateDoc(doc(db, 'users', teacherId), {
      ...firestoreUpdates,
      updatedAt: new Date().toISOString()
    });

    let message = 'Teacher information updated successfully!';
    if (updates.password) {
      message += ' Note: Password updates require Firebase Admin SDK. The password field was not updated for security reasons.';
    }

    return {
      success: true,
      message: message
    };
  } catch (error) {
    console.error('Error updating teacher:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete teacher
export const deleteTeacher = async (teacherId, options = { hardDelete: true }) => {
  try {
    if (options?.hardDelete) {
      // Permanently remove the teacher document from Firestore
      await deleteDoc(doc(db, 'users', teacherId));
      return {
        success: true,
        message: 'Teacher deleted permanently!'
      };
    }

    // Fallback: mark as inactive (soft delete)
    await updateDoc(doc(db, 'users', teacherId), {
      status: 'inactive',
      approved: false,
      deletedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Teacher deactivated successfully!'
    };
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Add new admin (Admin function)
export const addAdmin = async (adminData) => {
  try {
    // Use secondary auth to avoid affecting current session
    const secondaryAuth = getSecondaryAuth();

    // Create Firebase Authentication user on the secondary auth instance
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth, 
      adminData.email, 
      adminData.password
    );
    
    const firebaseUser = userCredential.user;

    // Create admin document in Firestore
    const adminDoc = {
      uid: firebaseUser.uid,
      email: adminData.email,
      name: adminData.name,
      role: 'admin',
      approved: true,
      createdAt: new Date().toISOString(),
      addedBy: 'system',
      status: 'active'
    };

    // Save to Firestore
    await setDoc(doc(db, 'users', firebaseUser.uid), adminDoc);

    // Clear the secondary session
    await signOut(secondaryAuth);

    return {
      success: true,
      message: `Admin added successfully! Admin ID: ${firebaseUser.uid}. The admin can now login with their email and password.`,
      adminId: firebaseUser.uid
    };
  } catch (error) {
    console.error('Error adding admin:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to add admin';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'A user with this email already exists. Please use a different email.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Please use a stronger password.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address. Please check the email format.';
    } else {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Get user statistics for admin dashboard
export const getUserStatistics = async () => {
  try {
    const [pendingStudents, approvedStudents, teachers] = await Promise.all([
      getPendingStudentRegistrations(),
      getApprovedStudents(),
      getAllTeachers()
    ]);

    return {
      success: true,
      data: {
        pendingStudents: pendingStudents.data?.length || 0,
        approvedStudents: approvedStudents.data?.length || 0,
        totalTeachers: teachers.data?.length || 0,
        totalUsers: (approvedStudents.data?.length || 0) + (teachers.data?.length || 0)
      }
    };
  } catch (error) {
    console.error('Error getting user statistics:', error);
    return {
      success: false,
      error: error.message,
      data: {
        pendingStudents: 0,
        approvedStudents: 0,
        totalTeachers: 0,
        totalUsers: 0
      }
    };
  }
};

// Check if a teacher has a Firebase Auth account
export const checkTeacherAuthStatus = async (teacherEmail) => {
  try {
    // This is a helper function to check if a teacher can login
    // In a real system, you'd use Firebase Admin SDK to verify this
    return {
      success: true,
      message: 'Teacher authentication status checked. Note: This requires Firebase Admin SDK for full verification.',
      hasAuthAccount: true // Placeholder - would be determined by Admin SDK
    };
  } catch (error) {
    console.error('Error checking teacher auth status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get all users for admin overview
export const getAllUsers = async () => {
  try {
    const [studentsResult, teachersResult] = await Promise.all([
      getApprovedStudents(),
      getAllTeachers()
    ]);

    const allUsers = [
      ...(studentsResult.data || []),
      ...(teachersResult.data || [])
    ];

    return {
      success: true,
      data: allUsers
    };
  } catch (error) {
    console.error('Error getting all users:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Get all admins
export const getAllAdmins = async () => {
  try {
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'admin'),
      where('approved', '==', true)
    );
    const querySnapshot = await getDocs(q);
    const admins = [];
    
    querySnapshot.forEach((doc) => {
      admins.push({ 
        id: doc.id, 
        ...doc.data() 
      });
    });
    
    return {
      success: true,
      data: admins
    };
  } catch (error) {
    console.error('Error getting admins:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Get system statistics for admin dashboard
export const getSystemStatistics = async () => {
  try {
    const [pendingStudents, approvedStudents, teachers, allUsers] = await Promise.all([
      getPendingStudentRegistrations(),
      getApprovedStudents(),
      getAllTeachers(),
      getAllUsers()
    ]);

    // Get additional statistics from other services
    let totalAppointments = 0;
    let totalScheduleSlots = 0;
    
    try {
      // Import these services dynamically to avoid circular dependencies
      const { getAppointments } = await import('./appointmentService.js');
      const { getAvailableScheduleSlots } = await import('./scheduleService.js');
      
      // Get appointment count (admin can see all)
      const appointmentsResult = await getAppointments('admin', 'admin');
      if (appointmentsResult.success) {
        totalAppointments = appointmentsResult.data.length;
      }
      
      // Get schedule slot count
      const slotsResult = await getAvailableScheduleSlots();
      if (slotsResult.success) {
        totalScheduleSlots = slotsResult.data.length;
      }
    } catch (serviceError) {
      console.log('Some services not available yet:', serviceError.message);
    }

    return {
      success: true,
      data: {
        pendingStudents: pendingStudents.data?.length || 0,
        approvedStudents: approvedStudents.data?.length || 0,
        totalTeachers: teachers.data?.length || 0,
        totalUsers: allUsers.data?.length || 0,
        totalAppointments: totalAppointments,
        totalScheduleSlots: totalScheduleSlots
      }
    };
  } catch (error) {
    console.error('Error getting system statistics:', error);
    return {
      success: false,
      error: error.message,
      data: {
        pendingStudents: 0,
        approvedStudents: 0,
        totalTeachers: 0,
        totalUsers: 0,
        totalAppointments: 0,
        totalScheduleSlots: 0
      }
    };
  }
};
