import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Send a new message
export const sendMessage = async (messageData) => {
  try {
    const messageDoc = {
      appointmentId: messageData.appointmentId,
      senderId: messageData.senderId,
      senderType: messageData.senderType, // 'student' or 'teacher'
      message: messageData.message,
      timestamp: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'messages'), messageDoc);
    
    return {
      success: true,
      message: 'Message sent successfully!',
      messageId: docRef.id,
      data: { ...messageDoc, id: docRef.id }
    };
  } catch (error) {
    console.error('Error sending message:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get messages for a specific appointment
export const getMessagesForAppointment = async (appointmentId) => {
  try {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('appointmentId', '==', appointmentId)
      // orderBy removed to avoid composite index requirement
    );

    const querySnapshot = await getDocs(messagesQuery);
    let messages = [];
    
    querySnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Client-side sorting by timestamp
    messages.sort((a, b) => {
      const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(0);
      const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(0);
      return timeA - timeB; // Ascending order (oldest first)
    });

    return {
      success: true,
      data: messages
    };
  } catch (error) {
    console.error('Error getting messages for appointment:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Get all messages for a user (student or teacher)
export const getMessagesForUser = async (userId, userRole) => {
  try {
    // First get the user's appointments
    const { getAppointments } = await import('./appointmentService');
    const appointmentsResult = await getAppointments(userId, userRole);
    
    if (!appointmentsResult.success) {
      return { success: false, data: [] };
    }

    const appointments = appointmentsResult.data;
    const appointmentIds = appointments.map(apt => apt.id);
    
    if (appointmentIds.length === 0) {
      return { success: true, data: [] };
    }

    // Get messages for all user's appointments
    const messagesQuery = query(
      collection(db, 'messages'),
      where('appointmentId', 'in', appointmentIds)
      // orderBy removed to avoid composite index requirement
    );

    const querySnapshot = await getDocs(messagesQuery);
    let messages = [];
    
    querySnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Client-side sorting by timestamp (newest first)
    messages.sort((a, b) => {
      const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(0);
      const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(0);
      return timeB - timeA; // Descending order (newest first)
    });

    return {
      success: true,
      data: messages
    };
  } catch (error) {
    console.error('Error getting messages for user:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Real-time listener for messages in an appointment
export const subscribeToAppointmentMessages = (appointmentId, callback) => {
  try {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('appointmentId', '==', appointmentId)
      // orderBy removed to avoid composite index requirement
    );

    return onSnapshot(messagesQuery, (querySnapshot) => {
      let messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Client-side sorting by timestamp
      messages.sort((a, b) => {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(0);
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(0);
        return timeA - timeB; // Ascending order (oldest first)
      });

      callback({ success: true, data: messages });
    }, (error) => {
      console.error('Error in message subscription:', error);
      callback({ success: false, error: error.message, data: [] });
    });
  } catch (error) {
    console.error('Error setting up message subscription:', error);
    callback({ success: false, error: error.message, data: [] });
  }
};

// Get message statistics for a user
export const getMessageStats = async (userId, userRole) => {
  try {
    const result = await getMessagesForUser(userId, userRole);
    if (!result.success) {
      return { success: false, data: {} };
    }

    const messages = result.data;
    const stats = {
      total: messages.length,
      today: messages.filter(msg => {
        const msgDate = msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date();
        const today = new Date();
        return msgDate.toDateString() === today.toDateString();
      }).length,
      thisWeek: messages.filter(msg => {
        const msgDate = msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return msgDate >= weekAgo;
      }).length
    };

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error getting message stats:', error);
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};
