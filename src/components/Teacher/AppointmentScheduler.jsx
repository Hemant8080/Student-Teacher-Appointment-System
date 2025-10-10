import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createScheduleSlot, getTeacherScheduleSlots, updateScheduleSlot, deleteScheduleSlot, getScheduleSlotStats } from '../../services/scheduleService';
import toast from 'react-hot-toast';

const AppointmentScheduler = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: '30',
    purpose: '',
    maxStudents: '1'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [slots, setSlots] = useState([]);
  const [stats, setStats] = useState({});
  const [editingSlot, setEditingSlot] = useState(null);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    loadScheduleSlots();
    loadStats();
  }, []);

  const loadScheduleSlots = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getTeacherScheduleSlots(user.uid);
      if (result.success) {
        setSlots(result.data);
      } else {
        setError(result.error || 'Failed to load schedule slots');
      }
    } catch (error) {
      setError('Error loading schedule slots');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await getScheduleSlotStats(user.uid);
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const result = await createScheduleSlot({
        teacherId: user.uid,
        ...formData,
        duration: parseInt(formData.duration),
        maxStudents: parseInt(formData.maxStudents)
      });

      if (result.success) {
        // Reset form
        setFormData({
          date: '',
          time: '',
          duration: '30',
          purpose: '',
          maxStudents: '1'
        });
        
        // Reload slots and stats
        await loadScheduleSlots();
        await loadStats();
        
        toast.success(result.message);
      } else {
        setError(result.error || 'Failed to create schedule slot');
      }
    } catch (error) {
      setError('Error creating schedule slot: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSlot = (slot) => {
    setEditingSlot(slot);
    setFormData({
      date: slot.date,
      time: slot.time,
      duration: slot.duration.toString(),
      purpose: slot.purpose || '',
      maxStudents: slot.maxStudents.toString()
    });
    setShowForm(true);
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const result = await updateScheduleSlot(editingSlot.id, {
        date: formData.date,
        time: formData.time,
        duration: parseInt(formData.duration),
        maxStudents: parseInt(formData.maxStudents),
        purpose: formData.purpose
      });

      if (result.success) {
        // Reset form and editing state
        setFormData({
          date: '',
          time: '',
          duration: '30',
          purpose: '',
          maxStudents: '1'
        });
        setEditingSlot(null);
        
        // Reload slots and stats
        await loadScheduleSlots();
        await loadStats();
        
        toast.success(result.message);
      } else {
        setError(result.error || 'Failed to update schedule slot');
      }
    } catch (error) {
      setError('Error updating schedule slot: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!confirm('Are you sure you want to delete this schedule slot? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await deleteScheduleSlot(slotId);
      if (result.success) {
        await loadScheduleSlots();
        await loadStats();
        toast.success(result.message);
      } else {
        toast.error('Failed to delete slot: ' + result.error);
      }
    } catch (error) {
      toast.error('Error deleting slot: ' + error.message);
    }
  };

  const cancelEdit = () => {
    setEditingSlot(null);
    setFormData({
      date: '',
      time: '',
      duration: '30',
      purpose: '',
      maxStudents: '1'
    });
    toast.success('Edit cancelled. Form reset to default values.');
  };

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'booked': return 'bg-blue-100 text-blue-800';
      case 'fully_booked': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Available';
      case 'booked': return 'Partially Booked';
      case 'fully_booked': return 'Fully Booked';
      case 'cancelled': return 'Cancelled';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Schedule Appointment Slots</h2>
        <div className="card">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading schedule slots...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Schedule Appointment Slots</h2>
        <button
          onClick={() => {
            loadScheduleSlots();
            loadStats();
          }}
          className="btn-secondary text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total || 0}</div>
          <div className="text-sm text-gray-600">Total Slots</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{stats.available || 0}</div>
          <div className="text-sm text-gray-600">Available</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.booked || 0}</div>
          <div className="text-sm text-gray-600">Partially Booked</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.fullyBooked || 0}</div>
          <div className="text-sm text-gray-600">Fully Booked</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">{stats.cancelled || 0}</div>
          <div className="text-sm text-gray-600">Cancelled</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-600">{stats.completed || 0}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>

      {/* Create/Edit Form */}
      <div className="card max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {editingSlot ? 'Edit Schedule Slot' : 'Create New Appointment Slot'}
          </h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-secondary text-sm"
          >
            {showForm ? 'Hide Form' : 'Show Form'}
          </button>
        </div>
        
        {showForm && (
          <form onSubmit={editingSlot ? handleUpdateSlot : handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={formData.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <select
                  required
                  className="input-field"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                >
                  <option value="">Select time</option>
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <select
                  className="input-field"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Students
                </label>
                <select
                  className="input-field"
                  value={formData.maxStudents}
                  onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                >
                  <option value="1">1 student</option>
                  <option value="2">2 students</option>
                  <option value="3">3 students</option>
                  <option value="5">5 students</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose/Topic (Optional)
              </label>
              <textarea
                className="input-field"
                rows="3"
                placeholder="e.g., Office hours for assignment help, Project discussion, etc."
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1"
              >
                {isSubmitting ? 'Saving...' : (editingSlot ? 'Update Slot' : 'Schedule Appointment Slot')}
              </button>
              
              {editingSlot && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="btn-secondary"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Existing Slots */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Your Schedule Slots</h3>
        
        {slots.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <p className="text-gray-500">No schedule slots created yet.</p>
            <p className="text-sm text-gray-400 mt-2">Create your first slot above to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {slots.map((slot) => (
              <div key={slot.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-lg">📅</span>
                      <div>
                        <span className="font-medium">{slot.date}</span>
                        <span className="text-gray-500 mx-2">at</span>
                        <span className="font-medium">{slot.time}</span>
                        <span className="text-gray-500 mx-2">•</span>
                        <span className="font-medium">{slot.duration} min</span>
                      </div>
                    </div>
                    
                    {slot.purpose && (
                      <p className="text-gray-600 text-sm mb-2">{slot.purpose}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Max: {slot.maxStudents} students</span>
                      <span>Booked: {slot.currentBookings || 0}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(slot.status)}`}>
                        {getStatusText(slot.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditSlot(slot)}
                      className="btn-secondary text-sm"
                      disabled={slot.status === 'completed' || slot.status === 'cancelled'}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="btn-secondary text-sm text-red-600 hover:text-red-700"
                      disabled={slot.status === 'completed'}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Instructions</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Schedule appointment slots when you're available to meet students</li>
          <li>• Students can book these slots and you'll receive notifications</li>
          <li>• You can edit or delete slots before they're booked</li>
          <li>• Set appropriate duration based on the type of consultation</li>
          <li>• Monitor booking status and manage your schedule effectively</li>
        </ul>
      </div>
    </div>
  );
};

export default AppointmentScheduler;
