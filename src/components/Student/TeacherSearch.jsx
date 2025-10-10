import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllTeachers } from '../../services/adminService';
import { bookAppointment } from '../../services/appointmentService';
import { getAvailableScheduleSlots } from '../../services/scheduleService';
import toast from 'react-hot-toast';

const TeacherSearch = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingData, setBookingData] = useState({
    slotId: '',
    purpose: ''
  });

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAllTeachers();
      if (result.success) {
        setTeachers(result.data);
      } else {
        setError(result.error || 'Failed to load teachers');
      }
    } catch (error) {
      setError('Error loading teachers');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async (teacherId) => {
    setLoadingSlots(true);
    try {
      const result = await getAvailableScheduleSlots({ teacherId });
      if (result.success) {
        setAvailableSlots(result.data);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error loading slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBookAppointment = async (teacher) => {
    setSelectedTeacher(teacher);
    setShowBookingForm(true);
    await loadAvailableSlots(teacher.uid);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    
    if (!bookingData.slotId) {
      toast.error('Please select an available time slot');
      return;
    }
    
    // Find the selected slot to get date and time
    const selectedSlot = availableSlots.find(slot => slot.id === bookingData.slotId);
    if (!selectedSlot) {
      toast.error('Selected slot not found');
      return;
    }
    
    try {
      const result = await bookAppointment({
        teacherId: selectedTeacher.uid,
        studentId: user.uid,
        date: selectedSlot.date,
        time: selectedSlot.time,
        purpose: bookingData.purpose
      });

      if (result.success) {
        toast.success(result.message);
        setShowBookingForm(false);
        setSelectedTeacher(null);
        setBookingData({ slotId: '', purpose: '' });
        setAvailableSlots([]);
      } else {
        toast.error('Failed to book appointment: ' + result.error);
      }
    } catch (error) {
      toast.error('Error booking appointment: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Find Teachers</h2>
        <div className="card">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading teachers...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Find Teachers</h2>
        <div className="card">
          <div className="text-center py-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadTeachers}
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
        <h2 className="text-2xl font-bold text-gray-900">Find Teachers</h2>
        <button
          onClick={loadTeachers}
          className="btn-secondary text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, department, or subject..."
              className="input-field"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-primary">
            🔍 Search
          </button>
        </div>
      </div>

      {/* Teachers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.map((teacher) => (
          <div key={teacher.uid} className="card hover:shadow-lg transition-shadow duration-200">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">👨‍🏫</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{teacher.name}</h3>
              <p className="text-sm text-gray-600">{teacher.department}</p>
            </div>
            
            <div className="space-y-2 mb-4">
              <p className="text-sm"><span className="font-medium">Subject:</span> {teacher.subject}</p>
              <p className="text-sm"><span className="font-medium">Email:</span> {teacher.email}</p>
              {teacher.phone && (
                <p className="text-sm"><span className="font-medium">Phone:</span> {teacher.phone}</p>
              )}
            </div>
            
            <button
              onClick={() => handleBookAppointment(teacher)}
              className="btn-primary w-full"
            >
              Book Appointment
            </button>
          </div>
        ))}
      </div>

      {filteredTeachers.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <p className="text-gray-500">
            {searchTerm ? 'No teachers found matching your search.' : 'No teachers available.'}
          </p>
          {!searchTerm && (
            <p className="text-sm text-gray-400 mt-2">
              Teachers may need to be added by an administrator.
            </p>
          )}
        </div>
      )}

      {/* Booking Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Book Appointment with {selectedTeacher?.name}
            </h3>
            
            <form onSubmit={handleSubmitBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Time Slots
                </label>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading slots...</span>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p>No available time slots for this teacher.</p>
                    <p className="text-sm mt-1">Please check back later or contact the teacher directly.</p>
                  </div>
                ) : (
                  <select
                    required
                    className="input-field"
                    value={bookingData.slotId}
                    onChange={(e) => setBookingData({ ...bookingData, slotId: e.target.value })}
                  >
                    <option value="">Select available time slot</option>
                    {availableSlots.map(slot => (
                      <option key={slot.id} value={slot.id}>
                        {formatDate(slot.date)} at {slot.time} ({slot.duration} min)
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose/Reason
                </label>
                <textarea
                  required
                  className="input-field"
                  rows="3"
                  placeholder="Briefly describe why you need this appointment..."
                  value={bookingData.purpose}
                  onChange={(e) => setBookingData({ ...bookingData, purpose: e.target.value })}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loadingSlots || availableSlots.length === 0}
                  className="btn-primary flex-1"
                >
                  Book Appointment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingForm(false);
                    setSelectedTeacher(null);
                    setBookingData({ slotId: '', purpose: '' });
                    setAvailableSlots([]);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSearch;
