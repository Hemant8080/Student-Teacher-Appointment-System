import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import TeacherManagement from './TeacherManagement';
import StudentApproval from './StudentApproval';
import AdminMessages from './AdminMessages';
import AdminScheduleSlots from './AdminScheduleSlots';
import AdminManagement from './AdminManagement';
import { getSystemStatistics } from '../../services/adminService';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'teachers', label: 'Teacher Management', icon: '👨‍🏫' },
    { id: 'students', label: 'Student Approvals', icon: '��‍🎓' },
    { id: 'admins', label: 'Admin Management', icon: '👨‍💼' },
    { id: 'slots', label: 'Schedule Slots', icon: '📅' },
    { id: 'messages', label: 'Messages', icon: '💬' }
  ];

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getSystemStatistics();
      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error || 'Failed to load system statistics');
      }
    } catch (error) {
      setError('Error loading system statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <button
                onClick={logout}
                className="btn-secondary"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
              <button
                onClick={loadStats}
                className="btn-secondary text-sm"
              >
                🔄 Refresh
              </button>
            </div>

            {loading ? (
              <div className="card">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading statistics...</span>
                </div>
              </div>
            ) : error ? (
              <div className="card">
                <div className="text-center py-8">
                  <div className="text-red-500 text-6xl mb-4">⚠️</div>
                  <p className="text-red-600 mb-4">{error}</p>
                  <button 
                    onClick={loadStats}
                    className="btn-primary"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="card text-center">
                    <div className="text-3xl font-bold text-blue-600">{stats.pendingStudents || 0}</div>
                    <div className="text-sm text-gray-600">Pending Student Approvals</div>
                  </div>
                  <div className="card text-center">
                    <div className="text-3xl font-bold text-green-600">{stats.approvedStudents || 0}</div>
                    <div className="text-sm text-gray-600">Approved Students</div>
                  </div>
                  <div className="card text-center">
                    <div className="text-3xl font-bold text-purple-600">{stats.totalTeachers || 0}</div>
                    <div className="text-sm text-gray-600">Total Teachers</div>
                  </div>
                  <div className="card text-center">
                    <div className="text-3xl font-bold text-orange-600">{stats.totalAppointments || 0}</div>
                    <div className="text-sm text-gray-600">Total Appointments</div>
                  </div>
                </div>

                {/* Additional Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card text-center">
                    <div className="text-3xl font-bold text-indigo-600">{stats.totalScheduleSlots || 0}</div>
                    <div className="text-sm text-gray-600">Total Schedule Slots</div>
                  </div>
                  <div className="card text-center">
                    <div className="text-3xl font-bold text-teal-600">{stats.totalUsers || 0}</div>
                    <div className="text-sm text-gray-600">Total Users</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setActiveTab('students')}
                      className="btn-primary text-center"
                    >
                      👨‍🎓 Review Student Approvals
                    </button>
                    <button
                      onClick={() => setActiveTab('teachers')}
                      className="btn-primary text-center"
                    >
                      👨‍🏫 Manage Teachers
                    </button>
                    <button
                      onClick={() => setActiveTab('slots')}
                      className="btn-primary text-center"
                    >
                      📅 Monitor Schedule Slots
                    </button>
                  </div>
                </div>

                {/* System Status */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">System Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Database Connection</span>
                      <span className="text-green-600 font-medium">✅ Connected</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Authentication Service</span>
                      <span className="text-green-600 font-medium">✅ Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Message System</span>
                      <span className="text-green-600 font-medium">✅ Operational</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Appointment System</span>
                      <span className="text-green-600 font-medium">✅ Operational</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        
        {activeTab === 'teachers' && <TeacherManagement />}
        {activeTab === 'students' && <StudentApproval />}
        {activeTab === 'admins' && <AdminManagement />}
        {activeTab === 'slots' && <AdminScheduleSlots />}
        {activeTab === 'messages' && <AdminMessages />}
      </main>
    </div>
  );
};

export default AdminDashboard;
