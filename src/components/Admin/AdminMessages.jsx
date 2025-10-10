import React, { useState, useEffect } from 'react';
import { getMessagesForUser } from '../../services/messageService';
import { getAppointments } from '../../services/appointmentService';
import { getAllTeachers } from '../../services/adminService';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Load all appointments and messages for admin overview
      const [appointmentsResult, teachersResult] = await Promise.all([
        getAppointments('admin', 'admin'),
        getAllTeachers()
      ]);

      if (appointmentsResult.success) {
        setAppointments(appointmentsResult.data);
      }

      if (teachersResult.success) {
        setTeachers(teachersResult.data);
      }

      // Load all messages (admin can see all)
      const messagesResult = await getMessagesForUser('admin', 'admin');
      if (messagesResult.success) {
        setMessages(messagesResult.data);
      } else {
        setError(messagesResult.error || 'Failed to load messages');
      }
    } catch (error) {
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter(message => {
    if (filter === 'all') return true;
    if (filter === 'student') return message.senderType === 'student';
    if (filter === 'teacher') return message.senderType === 'teacher';
    return true;
  });

  const groupedMessages = filteredMessages.reduce((groups, message) => {
    const appointment = appointments.find(apt => apt.id === message.appointmentId);
    if (!appointment) return groups;

    const teacher = teachers.find(t => t.uid === appointment.teacherId);
    const key = appointment.appointmentName || `Appointment #${appointment.id.slice(-8)} - ${teacher?.name || 'Unknown Teacher'} - ${appointment.date} ${appointment.time}`;
    
    if (!groups[key]) {
      groups[key] = {
        appointment,
        teacher,
        messages: []
      };
    }
    groups[key].messages.push(message);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Message Monitoring</h2>
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
        <h2 className="text-2xl font-bold text-gray-900">Message Monitoring</h2>
        <div className="card">
          <div className="text-center py-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadData}
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
        <h2 className="text-2xl font-bold text-gray-900">Message Monitoring</h2>
        <button
          onClick={loadData}
          className="btn-secondary text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filter Controls */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by sender:</label>
          <select
            className="input-field w-auto"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Messages</option>
            <option value="student">Student Messages</option>
            <option value="teacher">Teacher Messages</option>
          </select>
        </div>
      </div>

      {/* Message Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {messages.length}
            </p>
            <p className="text-sm text-gray-600">Total Messages</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {messages.filter(msg => msg.senderType === 'student').length}
            </p>
            <p className="text-sm text-gray-600">Student Messages</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {messages.filter(msg => msg.senderType === 'teacher').length}
            </p>
            <p className="text-sm text-gray-600">Teacher Messages</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {Object.keys(groupedMessages).length}
            </p>
            <p className="text-sm text-gray-600">Active Conversations</p>
          </div>
        </div>
      </div>

      {/* Message History */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Message History</h3>
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">💬</div>
            <p className="text-gray-500">No messages found.</p>
            <p className="text-sm text-gray-400 mt-2">
              Messages will appear here once students and teachers start communicating.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMessages).map(([key, group]) => (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-900">{key}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    group.appointment.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {group.appointment.status}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {group.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.senderType === 'student'
                          ? 'bg-blue-50 ml-8'
                          : 'bg-green-50 mr-8'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {message.senderType === 'student' ? 'Student' : 'Teacher'}
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

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Admin Message Monitoring</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Monitor all conversations between students and teachers</li>
          <li>• Filter messages by sender type (student/teacher)</li>
          <li>• View message statistics and conversation counts</li>
          <li>• Ensure appropriate communication standards are maintained</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminMessages;
