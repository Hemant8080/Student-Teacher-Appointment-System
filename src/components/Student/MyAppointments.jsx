import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAppointments } from '../../services/appointmentService';
import toast from 'react-hot-toast';

const MyAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAppointments(user.uid, 'student');
      if (result.success) {
        setAppointments(result.data);
      } else {
        setError(result.error || 'Failed to load appointments');
      }
    } catch (error) {
      setError('Error loading appointments');
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'approved': return '✅';
      case 'cancelled': return '❌';
      case 'completed': return '✅';
      default: return '📅';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
        </div>
        <div className="card">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading appointments...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
        </div>
        <div className="card">
          <div className="text-center py-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadAppointments}
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
        <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={loadAppointments}
            className="btn-secondary text-sm"
          >
            🔄 Refresh
          </button>
          <select
            className="input-field w-auto"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Appointments</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="card">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <p className="text-gray-500">
              {filter === 'all' ? 'No appointments found.' : `No ${filter} appointments found.`}
            </p>
            {filter === 'all' && (
              <p className="text-sm text-gray-400 mt-2">
                Go to "Find Teachers" to book your first appointment!
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">
                        {appointment.appointmentName || `Appointment #${appointment.id.slice(-8)}`}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)} {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p><span className="font-medium">Date:</span> {appointment.date}</p>
                        <p><span className="font-medium">Time:</span> {appointment.time}</p>
                        <p><span className="font-medium">Teacher:</span> {appointment.teacherName || 'Unknown Teacher'}</p>
                      </div>
                      <div>
                        <p><span className="font-medium">Status:</span> {appointment.status}</p>
                        <p><span className="font-medium">Requested:</span> {appointment.createdAt ? new Date(appointment.createdAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                    
                    {appointment.purpose && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">Purpose:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-1">
                          {appointment.purpose}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Status-specific messages */}
                {appointment.status === 'pending' && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    ⏳ Waiting for teacher approval
                  </div>
                )}
                
                {appointment.status === 'approved' && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                    ✅ Appointment confirmed! Don't forget to attend.
                  </div>
                )}
                
                {appointment.status === 'cancelled' && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                    ❌ This appointment has been cancelled.
                  </div>
                )}

                {appointment.status === 'completed' && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                    ✅ Appointment completed successfully!
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {appointments.filter(apt => apt.status === 'pending').length}
            </p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {appointments.filter(apt => apt.status === 'approved').length}
            </p>
            <p className="text-sm text-gray-600">Approved</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {appointments.filter(apt => apt.status === 'completed').length}
            </p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">
              {appointments.length}
            </p>
            <p className="text-sm text-gray-600">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAppointments;
