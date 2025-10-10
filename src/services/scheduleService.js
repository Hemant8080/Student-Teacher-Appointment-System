import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Create a new schedule slot
export const createScheduleSlot = async (slotData) => {
  try {
    // Validate date and time
    const selectedDateTime = new Date(slotData.date + ' ' + slotData.time);
    const now = new Date();
    
    if (selectedDateTime <= now) {
      return {
        success: false,
        error: 'Schedule slot must be in the future. Please select a future date and time.'
      };
    }

    // Check for duplicate slots (same teacher, date, and time)
    const duplicateQuery = query(
      collection(db, 'scheduleSlots'),
      where('teacherId', '==', slotData.teacherId),
      where('date', '==', slotData.date),
      where('time', '==', slotData.time)
    );
    
    const duplicateSnapshot = await getDocs(duplicateQuery);
    if (!duplicateSnapshot.empty) {
      return {
        success: false,
        error: 'A schedule slot already exists for this teacher at the selected date and time. Please choose a different time or date.'
      };
    }

    const slotDoc = {
      teacherId: slotData.teacherId,
      date: slotData.date,
      time: slotData.time,
      duration: parseInt(slotData.duration),
      maxStudents: parseInt(slotData.maxStudents),
      purpose: slotData.purpose || '',
      status: 'available', // available, booked, cancelled, completed
      currentBookings: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'scheduleSlots'), slotDoc);
    
    return {
      success: true,
      message: 'Schedule slot created successfully!',
      slotId: docRef.id,
      data: { ...slotDoc, id: docRef.id }
    };
  } catch (error) {
    console.error('Error creating schedule slot:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get schedule slots for a teacher
export const getTeacherScheduleSlots = async (teacherId, status = null) => {
  try {
    let slotsQuery;
    
    if (status) {
      slotsQuery = query(
        collection(db, 'scheduleSlots'),
        where('teacherId', '==', teacherId),
        where('status', '==', status)
      );
    } else {
      slotsQuery = query(
        collection(db, 'scheduleSlots'),
        where('teacherId', '==', teacherId)
      );
    }

    const querySnapshot = await getDocs(slotsQuery);
    const slots = [];
    
    querySnapshot.forEach((doc) => {
      slots.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Client-side sorting by date and time
    slots.sort((a, b) => {
      const dateA = new Date(a.date + ' ' + a.time);
      const dateB = new Date(b.date + ' ' + b.time);
      return dateA - dateB;
    });

    return {
      success: true,
      data: slots
    };
  } catch (error) {
    console.error('Error getting teacher schedule slots:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get all available schedule slots (for students to book)
export const getAvailableScheduleSlots = async (filters = {}) => {
  try {
    let slotsQuery = query(
      collection(db, 'scheduleSlots'),
      where('status', '==', 'available')
    );

    const querySnapshot = await getDocs(slotsQuery);
    const slots = [];
    
    querySnapshot.forEach((doc) => {
      const slotData = doc.data();
      slots.push({
        id: doc.id,
        ...slotData
      });
    });

    // Apply client-side filters
    let filteredSlots = slots;
    
    if (filters.date) {
      filteredSlots = filteredSlots.filter(slot => slot.date === filters.date);
    }
    
    if (filters.teacherId) {
      filteredSlots = filteredSlots.filter(slot => slot.teacherId === filters.teacherId);
    }
    
    if (filters.department) {
      // This would need to be enhanced with teacher data join
      filteredSlots = filteredSlots.filter(slot => slot.department === filters.department);
    }

    // Client-side sorting by date and time
    filteredSlots.sort((a, b) => {
      const dateA = new Date(a.date + ' ' + a.time);
      const dateB = new Date(b.date + ' ' + b.time);
      return dateA - dateB;
    });

    return {
      success: true,
      data: filteredSlots
    };
  } catch (error) {
    console.error('Error getting available schedule slots:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update a schedule slot
export const updateScheduleSlot = async (slotId, updates) => {
  try {
    await updateDoc(doc(db, 'scheduleSlots', slotId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      message: 'Schedule slot updated successfully!'
    };
  } catch (error) {
    console.error('Error updating schedule slot:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete a schedule slot
export const deleteScheduleSlot = async (slotId) => {
  try {
    await deleteDoc(doc(db, 'scheduleSlots', slotId));
    
    return {
      success: true,
      message: 'Schedule slot deleted successfully!'
    };
  } catch (error) {
    console.error('Error deleting schedule slot:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Book a schedule slot (called when student books appointment)
export const bookScheduleSlot = async (slotId, studentId) => {
  try {
    const slotRef = doc(db, 'scheduleSlots', slotId);
    
    // Get current slot data
    const slotDoc = await getDocs(query(collection(db, 'scheduleSlots'), where('__name__', '==', slotId)));
    const slotData = slotDoc.docs[0]?.data();
    
    if (!slotData) {
      return {
        success: false,
        error: 'Schedule slot not found'
      };
    }
    
    if (slotData.currentBookings >= slotData.maxStudents) {
      return {
        success: false,
        error: 'This slot is already fully booked'
      };
    }
    
    // Update the slot
    await updateDoc(slotRef, {
      currentBookings: slotData.currentBookings + 1,
      updatedAt: serverTimestamp()
    });
    
    // If fully booked, mark as unavailable
    if (slotData.currentBookings + 1 >= slotData.maxStudents) {
      await updateDoc(slotRef, {
        status: 'fully_booked',
        updatedAt: serverTimestamp()
      });
    }
    
    return {
      success: true,
      message: 'Slot booked successfully!'
    };
  } catch (error) {
    console.error('Error booking schedule slot:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get schedule slot statistics for a teacher
export const getScheduleSlotStats = async (teacherId) => {
  try {
    const slotsQuery = query(
      collection(db, 'scheduleSlots'),
      where('teacherId', '==', teacherId)
    );
    
    const querySnapshot = await getDocs(slotsQuery);
    const slots = [];
    
    querySnapshot.forEach((doc) => {
      slots.push(doc.data());
    });
    
    const stats = {
      total: slots.length,
      available: slots.filter(slot => slot.status === 'available').length,
      booked: slots.filter(slot => slot.status === 'booked').length,
      fullyBooked: slots.filter(slot => slot.status === 'fully_booked').length,
      cancelled: slots.filter(slot => slot.status === 'cancelled').length,
      completed: slots.filter(slot => slot.status === 'completed').length
    };
    
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error getting schedule slot stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
