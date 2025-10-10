import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  orderBy,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Book a new appointment
export const bookAppointment = async (appointmentData) => {
  try {
    // First, check if there's an available schedule slot
    const slotsQuery = query(
      collection(db, 'scheduleSlots'),
      where('teacherId', '==', appointmentData.teacherId),
      where('date', '==', appointmentData.date),
      where('time', '==', appointmentData.time),
      where('status', '==', 'available')
    );
    
    const slotsSnapshot = await getDocs(slotsQuery);
    
    if (slotsSnapshot.empty) {
      return {
        success: false,
        error: 'No available schedule slot found for the selected date and time. Please choose a different time or contact the teacher.'
      };
    }
    
    const slotDoc = slotsSnapshot.docs[0];
    const slotData = slotDoc.data();
    
    // Check if slot can accommodate more students
    if (slotData.currentBookings >= slotData.maxStudents) {
      return {
        success: false,
        error: 'This time slot is already fully booked. Please choose a different time.'
      };
    }
    
    // Create the appointment
    const appointmentDoc = {
      teacherId: appointmentData.teacherId,
      studentId: appointmentData.studentId,
      date: appointmentData.date,
      time: appointmentData.time,
      purpose: appointmentData.purpose,
      status: 'pending',
      scheduleSlotId: slotDoc.id, // Link to the schedule slot
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'appointments'), appointmentDoc);
    
    // Update the schedule slot to reflect the new booking
    await updateDoc(doc(db, 'scheduleSlots', slotDoc.id), {
      currentBookings: slotData.currentBookings + 1,
      updatedAt: serverTimestamp()
    });
    
    // If slot is now fully booked, update its status
    if (slotData.currentBookings + 1 >= slotData.maxStudents) {
      await updateDoc(doc(db, 'scheduleSlots', slotDoc.id), {
        status: 'fully_booked',
        updatedAt: serverTimestamp()
      });
    }
    
    return {
      success: true,
      message: 'Appointment request sent successfully! The teacher will review and approve your request.',
      appointmentId: docRef.id,
      data: { ...appointmentDoc, id: docRef.id }
    };
  } catch (error) {
    console.error('Error booking appointment:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get appointments for a user
export const getAppointments = async (userId, userRole) => {
  try {
    let appointmentsQuery;
    
    if (userRole === 'admin') {
      // Admin can see all appointments; server-side sort is fine (no composite index needed)
      appointmentsQuery = query(
        collection(db, 'appointments'),
        orderBy('createdAt', 'desc')
      );
    } else if (userRole === 'teacher') {
      // Teachers see appointments assigned to them; avoid composite index by removing orderBy
      appointmentsQuery = query(
        collection(db, 'appointments'),
        where('teacherId', '==', userId)
      );
    } else if (userRole === 'student') {
      // Students see their own appointments; avoid composite index by removing orderBy
      appointmentsQuery = query(
        collection(db, 'appointments'),
        where('studentId', '==', userId)
      );
    }

    const querySnapshot = await getDocs(appointmentsQuery);
    const appointments = [];
    
    querySnapshot.forEach((docItem) => {
      appointments.push({
        id: docItem.id,
        ...docItem.data()
      });
    });

    // Fetch student names for appointments
    const appointmentsWithNames = await Promise.all(
      appointments.map(async (appointment) => {
        try {
          let studentName = 'Unknown Student';
          let teacherName = 'Unknown Teacher';
          
          // Get student data to fetch name
          const studentDoc = await getDoc(doc(db, 'users', appointment.studentId));
          const studentData = studentDoc.data();
          if (studentData?.name) {
            studentName = studentData.name;
          }
          
          // Get teacher data to fetch name (for students viewing their appointments)
          if (userRole === 'student') {
            const teacherDoc = await getDoc(doc(db, 'users', appointment.teacherId));
            const teacherData = teacherDoc.data();
            if (teacherData?.name) {
              teacherName = teacherData.name;
            }
          }
          
          // Create appointment name based on user role and available data
          let appointmentName = 'Appointment';
          if (userRole === 'teacher' && studentName) {
            appointmentName = `${studentName}'s Appointment`;
          } else if (userRole === 'student' && teacherName) {
            appointmentName = `Appointment with ${teacherName}`;
          } else if (userRole === 'admin') {
            // For admin, show both student and teacher names if available
            if (studentName !== 'Unknown Student' && teacherName !== 'Unknown Teacher') {
              appointmentName = `${studentName} with ${teacherName}`;
            } else if (studentName !== 'Unknown Student') {
              appointmentName = `${studentName}'s Appointment`;
            } else if (teacherName !== 'Unknown Teacher') {
              appointmentName = `Appointment with ${teacherName}`;
            }
          }
          
          // Add purpose to name if available
          if (appointment.purpose) {
            const shortPurpose = appointment.purpose.length > 25 
              ? appointment.purpose.substring(0, 25) + '...' 
              : appointment.purpose;
            appointmentName += ` - ${shortPurpose}`;
          }
          
          // Add date as fallback if no meaningful name could be created
          if (appointmentName === 'Appointment' && appointment.date) {
            appointmentName = `Appointment on ${appointment.date}`;
          }
          
          return {
            ...appointment,
            studentName: studentName,
            teacherName: teacherName,
            appointmentName: appointmentName
          };
        } catch (error) {
          console.error('Error fetching user data:', error);
          return {
            ...appointment,
            studentName: 'Unknown Student',
            teacherName: 'Unknown Teacher',
            appointmentName: 'Appointment'
          };
        }
      })
    );

    // Client-side sort by createdAt desc to avoid composite index
    appointmentsWithNames.sort((a, b) => {
      const aMs = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bMs = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return bMs - aMs;
    });

    return {
      success: true,
      data: appointmentsWithNames
    };
  } catch (error) {
    console.error('Error getting appointments:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Update appointment status
export const updateAppointmentStatus = async (appointmentId, status, reason = '') => {
  try {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    
    // Get the current appointment data to check if it has a schedule slot
    const appointmentDoc = await getDocs(query(collection(db, 'appointments'), where('__name__', '==', appointmentId)));
    const appointmentData = appointmentDoc.docs[0]?.data();
    
    // Update the appointment
    await updateDoc(appointmentRef, {
      status,
      reason,
      updatedAt: serverTimestamp()
    });

    // If appointment is cancelled or rejected and it has a schedule slot, update the slot
    if ((status === 'cancelled' || status === 'rejected') && appointmentData?.scheduleSlotId) {
      try {
        const slotRef = doc(db, 'scheduleSlots', appointmentData.scheduleSlotId);
        
        // Get current slot data
        const slotDoc = await getDocs(query(collection(db, 'scheduleSlots'), where('__name__', '==', appointmentData.scheduleSlotId)));
        const slotData = slotDoc.docs[0]?.data();
        
        if (slotData) {
          // Decrease the current bookings count
          const newBookingsCount = Math.max(0, (slotData.currentBookings || 0) - 1);
          
          await updateDoc(slotRef, {
            currentBookings: newBookingsCount,
            updatedAt: serverTimestamp()
          });
          
          // If slot was fully booked and now has space, make it available again
          if (slotData.status === 'fully_booked' && newBookingsCount < slotData.maxStudents) {
            await updateDoc(slotRef, {
              status: 'available',
              updatedAt: serverTimestamp()
            });
          }
        }
      } catch (slotError) {
        console.error('Error updating schedule slot:', slotError);
        // Don't fail the appointment update if slot update fails
      }
    }

    return {
      success: true,
      message: 'Appointment status updated successfully!'
    };
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get appointment statistics
export const getAppointmentStats = async (userId, userRole) => {
  try {
    const result = await getAppointments(userId, userRole);
    if (!result.success) {
      return { success: false, data: {} };
    }

    const appointments = result.data;
    const stats = {
      total: appointments.length,
      pending: appointments.filter(apt => apt.status === 'pending').length,
      approved: appointments.filter(apt => apt.status === 'approved').length,
      cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
      completed: appointments.filter(apt => apt.status === 'completed').length
    };

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error getting appointment stats:', error);
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};
