import React, { useState, useEffect } from 'react';
import { addAdmin, getAllAdmins } from '../../services/adminService';
import toast from 'react-hot-toast';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const result = await getAllAdmins();
      if (result.success) {
        setAdmins(result.data);
      } else {
        toast.error(result.error || 'Failed to load admins');
      }
    } catch (error) {
      toast.error('Error loading admins');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addAdmin({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        toast.success(result.message);
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        setShowAddForm(false);
        await loadAdmins(); // Refresh the list
      } else {
        toast.error(result.error || 'Failed to add admin');
      }
    } catch (error) {
      toast.error('Error adding admin: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Admin Management</h2>
        <div className="card">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading admins...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Admin Management</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          {showAddForm ? 'Cancel' : 'Add New Admin'}
        </button>
      </div>

      {/* Add Admin Form */}
      {showAddForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Add New Admin</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="Enter admin's full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="Enter admin's email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="Confirm the password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1"
              >
                {isSubmitting ? 'Adding Admin...' : 'Add Admin'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: ''
                  });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admins List */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">System Administrators</h3>
          <button
            onClick={loadAdmins}
            className="btn-secondary text-sm"
          >
            🔄 Refresh
          </button>
        </div>
        
        {admins.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">👨‍💼</div>
            <p className="text-gray-500">No admin users found.</p>
            <p className="text-sm text-gray-400 mt-2">Add the first admin using the form above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {admins.map((admin) => (
              <div key={admin.uid} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">{admin.name}</h4>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {admin.email}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Role:</span> Administrator
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Status:</span> 
                        <span className="text-green-600 font-medium ml-1">Active</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Created:</span>{' '}
                        {new Date(admin.createdAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      Admin
                    </span>
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
          <li>• Only existing admins can create new admin accounts</li>
          <li>• Admin accounts have full system access and control</li>
          <li>• Use strong passwords for admin accounts</li>
          <li>• Admin accounts are automatically approved and active</li>
          <li>• Admins can manage students, teachers, and system settings</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminManagement;
