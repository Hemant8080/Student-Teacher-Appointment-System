import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMessagesForUser, sendMessage, subscribeToAppointmentMessages } from '../../services/messageService';
import { getAppointments } from '../../services/appointmentService';
import toast from 'react-hot-toast';

const Messages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState(null);

  useEffect(() => {
    loadMessages();
    loadAppointments();
  }, []);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [unsubscribe]);

  const loadMessages = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getMessagesForUser(user.uid, 'teacher');
      if (result.success) {
        setMessages(result.data);
      } else {
        setError(result.error || 'Failed to load messages');
      }
    } catch (error) {
      setError('Error loading messages');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      const result = await getAppointments(user.uid, 'teacher');
      if (result.success) {
        // Only show approved appointments for messaging
        const approvedAppointments = result.data.filter(apt => apt.status === 'approved');
        setAppointments(approvedAppointments);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedAppointment || !newMessage.trim()) return;

    setSending(true);
    try {
      const result = await sendMessage({
        appointmentId: selectedAppointment,
        senderId: user.uid,
        senderType: 'teacher',
        message: newMessage.trim()
      });

      if (result.success) {
        setNewMessage('');
        toast.success('Message sent successfully!');
        // Messages will be updated via real-time subscription
      } else {
        toast.error('Failed to send message: ' + result.error);
      }
    } catch (error) {
      toast.error('Error sending message: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleAppointmentChange = (appointmentId) => {
    setSelectedAppointment(appointmentId);
    
    // Cleanup previous subscription
    if (unsubscribe) {
      unsubscribe();
    }

    if (appointmentId) {
      // Subscribe to real-time messages for this appointment
      const unsubscribeFn = subscribeToAppointmentMessages(appointmentId, (result) => {
        if (result.success) {
          setMessages(result.data);
        }
      });
      setUnsubscribe(() => unsubscribeFn);
    } else {
      setMessages([]);
    }
  };

  const groupedMessages = messages.reduce((groups, message) => {
    const appointment = appointments.find(apt => apt.id === message.appointmentId);
    if (!appointment) return groups;

    const key = appointment.appointmentName || `Appointment #${appointment.id.slice(-8)} - ${appointment.date} ${appointment.time}`;
    if (!groups[key]) {
      groups[key] = {
        appointment,
        messages: []
      };
    }
    groups[key].messages.push(message);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
        <div className="card">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading messages...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
        <div className="card">
          <div className="text-center py-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadMessages}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
        <button
          onClick={loadMessages}
          className="btn-secondary text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Send New Message */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Send Message</h3>
        <form onSubmit={handleSendMessage} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Appointment
            </label>
            <select
              className="input-field"
              value={selectedAppointment}
              onChange={(e) => handleAppointmentChange(e.target.value)}
              required
            >
              <option value="">Choose an appointment...</option>
              {appointments.map((appointment) => (
                <option key={appointment.id} value={appointment.id}>
                  {appointment.appointmentName || `Appointment #${appointment.id.slice(-8)} - ${appointment.date} at ${appointment.time}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              className="input-field"
              rows="4"
              placeholder="Type your message here..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              required
              disabled={sending}
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={sending || !selectedAppointment}
          >
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>

      {/* Message History */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Message History</h3>
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">💬</div>
            <p className="text-gray-500">No messages yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              {appointments.length === 0 
                ? 'You need approved appointments before you can send messages to students.'
                : 'Select an appointment above to start messaging.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMessages).map(([key, group]) => (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">{key}</h4>
                <div className="space-y-3">
                  {group.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.senderType === 'teacher'
                          ? 'bg-blue-50 ml-8'
                          : 'bg-gray-50 mr-8'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {message.senderType === 'teacher' ? 'You' : 'Student'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {message.timestamp?.toDate ? 
                            new Date(message.timestamp.toDate()).toLocaleString() : 
                            'N/A'
                          }
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{message.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {appointments.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">No Approved Appointments</h4>
          <p className="text-sm text-blue-800">
            You need to have approved appointments before you can send messages to students.
            Students will appear here once they book appointments with you.
          </p>
        </div>
      )}
    </div>
  );
};

export default Messages;
