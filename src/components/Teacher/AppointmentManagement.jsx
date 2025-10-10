import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAppointments, updateAppointmentStatus } from '../../services/appointmentService';
import toast from 'react-hot-toast';

const AppointmentManagement = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAppointments(user.uid, 'teacher');
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

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    setProcessing(prev => ({ ...prev, [appointmentId]: true }));
    try {
      const result = await updateAppointmentStatus(appointmentId, newStatus);
      if (result.success) {
        toast.success(`Appointment status updated to ${newStatus} successfully!`);
        await loadAppointments(); // Refresh the list
      } else {
        toast.error('Failed to update appointment status: ' + result.error);
      }
    } catch (error) {
      toast.error('Error updating appointment status: ' + error.message);
    } finally {
      setProcessing(prev => ({ ...prev, [appointmentId]: false }));
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
      case 'pending': return '⚠️';
      case 'approved': return '✅';
      case 'cancelled': return '❌';
      case 'completed': return '✅';
      default: return '';
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
            <p className="text-gray-500">No appointments found.</p>
            {filter === 'all' && (
              <p className="text-sm text-gray-400 mt-2">
                Students will appear here when they book appointments with you.
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
                        <p><span className="font-medium">Student:</span> {appointment.studentName || 'Unknown Student'}</p>
                      </div>
                      <div>
                        <p><span className="font-medium">Status:</span> {appointment.status}</p>
                        <p><span className="font-medium">Booked:</span> {appointment.createdAt ? new Date(appointment.createdAt.toDate()).toLocaleDateString() : 'N/A'}</p>
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
                  
                  {appointment.status === 'pending' && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, 'approved')}
                        disabled={processing[appointment.id]}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
                      >
                        {processing[appointment.id] ? 'Updating...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                        disabled={processing[appointment.id]}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
                      >
                        {processing[appointment.id] ? 'Updating...' : 'Cancel'}
                      </button>
                    </div>
                  )}

                  {appointment.status === 'approved' && (
                    <div className="ml-4">
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                        disabled={processing[appointment.id]}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
                      >
                        {processing[appointment.id] ? 'Updating...' : 'Mark Complete'}
                      </button>
                    </div>
                  )}
                </div>
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
            <p className="text-sm text-gray-600">Pending Requests</p>
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
            <p className="text-sm text-gray-600">Total Appointments</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentManagement;
