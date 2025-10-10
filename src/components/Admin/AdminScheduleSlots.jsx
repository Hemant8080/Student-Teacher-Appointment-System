import React, { useState, useEffect } from 'react';
import { getAvailableScheduleSlots } from '../../services/scheduleService';
import { getAllTeachers } from '../../services/adminService';
import toast from 'react-hot-toast';

const AdminScheduleSlots = () => {
  const [slots, setSlots] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    teacherId: '',
    date: '',
    status: 'all'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Load teachers for filter dropdown
      const teachersResult = await getAllTeachers();
      if (teachersResult.success) {
        setTeachers(teachersResult.data);
      }

      // Load all available slots
      const slotsResult = await getAvailableScheduleSlots();
      if (slotsResult.success) {
        setSlots(slotsResult.data);
      } else {
        setError(slotsResult.error || 'Failed to load schedule slots');
      }
    } catch (error) {
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const filteredSlots = slots.filter(slot => {
    if (filters.teacherId && slot.teacherId !== filters.teacherId) return false;
    if (filters.date && slot.date !== filters.date) return false;
    if (filters.status !== 'all' && slot.status !== filters.status) return false;
    return true;
  });

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.uid === teacherId);
    return teacher ? teacher.name : 'Unknown Teacher';
  };

  const getTeacherDepartment = (teacherId) => {
    const teacher = teachers.find(t => t.uid === teacherId);
    return teacher ? teacher.department : 'Unknown';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Schedule Slots Management</h2>
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
        <h2 className="text-2xl font-bold text-gray-900">Schedule Slots Management</h2>
        <button
          onClick={loadData}
          className="btn-secondary text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{slots.length}</div>
          <div className="text-sm text-gray-600">Total Slots</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {slots.filter(s => s.status === 'available').length}
          </div>
          <div className="text-sm text-gray-600">Available</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {slots.filter(s => s.status === 'booked').length}
          </div>
          <div className="text-sm text-gray-600">Partially Booked</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-orange-600">
            {slots.filter(s => s.status === 'fully_booked').length}
          </div>
          <div className="text-sm text-gray-600">Fully Booked</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-600">
            {slots.filter(s => s.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teacher
            </label>
            <select
              className="input-field"
              value={filters.teacherId}
              onChange={(e) => setFilters({ ...filters, teacherId: e.target.value })}
            >
              <option value="">All Teachers</option>
              {teachers.map(teacher => (
                <option key={teacher.uid} value={teacher.uid}>
                  {teacher.name} ({teacher.department})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              className="input-field"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="input-field"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="booked">Partially Booked</option>
              <option value="fully_booked">Fully Booked</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Slots List */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">
          Schedule Slots ({filteredSlots.length})
        </h3>
        
        {error ? (
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
        ) : filteredSlots.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <p className="text-gray-500">No schedule slots found.</p>
            <p className="text-sm text-gray-400 mt-2">
              {filters.teacherId || filters.date || filters.status !== 'all' 
                ? 'Try adjusting your filters.' 
                : 'Teachers need to create schedule slots first.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSlots.map((slot) => (
              <div key={slot.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-lg">📅</span>
                      <div>
                        <span className="font-medium">{formatDate(slot.date)}</span>
                        <span className="text-gray-500 mx-2">at</span>
                        <span className="font-medium">{slot.time}</span>
                        <span className="text-gray-500 mx-2">•</span>
                        <span className="font-medium">{slot.duration} min</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-sm text-gray-600">
                        <span className="font-medium">Teacher:</span> {getTeacherName(slot.teacherId)}
                      </span>
                      <span className="text-sm text-gray-600">
                        <span className="font-medium">Department:</span> {getTeacherDepartment(slot.teacherId)}
                      </span>
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
                  
                  <div className="text-right text-sm text-gray-500">
                    <div>Created: {slot.createdAt?.toDate ? formatDate(slot.createdAt.toDate()) : 'Unknown'}</div>
                    <div>Updated: {slot.updatedAt?.toDate ? formatDate(slot.updatedAt.toDate()) : 'Unknown'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Schedule Slots Management</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Monitor all schedule slots created by teachers across the system</li>
          <li>• Use filters to view specific teachers, dates, or statuses</li>
          <li>• Track slot utilization and booking patterns</li>
          <li>• Identify teachers who may need assistance with scheduling</li>
          <li>• Ensure efficient use of available appointment times</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminScheduleSlots;
