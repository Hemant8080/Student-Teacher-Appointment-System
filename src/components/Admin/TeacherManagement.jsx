import React, { useState, useEffect } from 'react';
import { getAllTeachers, updateTeacher, deleteTeacher, addTeacher } from '../../services/adminService';
import toast from 'react-hot-toast';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    subject: '',
    email: '',
    phone: '',
    password: ''
  });

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const result = await getAllTeachers();
      if (result.success) {
        setTeachers(result.data);
      } else {
        toast.error(result.error || 'Failed to load teachers');
      }
    } catch (error) {
      toast.error('Error loading teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!editingTeacher && !formData.password) {
      toast.error('Password is required for new teachers');
      return;
    }
    
    if (editingTeacher) {
      await handleUpdateTeacher();
    } else {
      await handleAddTeacher();
    }
  };

  const handleAddTeacher = async () => {
    setProcessing(prev => ({ ...prev, 'new': true }));
    
    try {
      const result = await addTeacher(formData);
      if (result.success) {
        toast.success(result.message);
        setShowAddForm(false);
        setFormData({ name: '', department: '', subject: '', email: '', phone: '', password: '' });
        loadTeachers(); // Refresh the teachers list
        
        // If reauth is required, show a special message
        if (result.requiresReauth) {
          toast.success('Teacher added successfully! Please sign back in as admin to continue.', {
            duration: 8000,
          });
        }
      } else {
        toast.error(result.error || 'Failed to add teacher');
      }
    } catch (error) {
      console.error('Error adding teacher:', error);
      toast.error('Error adding teacher. You may need to sign back in as admin.');
    } finally {
      setProcessing(prev => ({ ...prev, 'new': false }));
    }
  };

  const handleUpdateTeacher = async () => {
    setProcessing(prev => ({ ...prev, [editingTeacher.uid]: true }));
    try {
      // Only include password if it's been changed
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password; // Don't update password if field is empty
      }
      
      const result = await updateTeacher(editingTeacher.uid, updateData);
      if (result.success) {
        toast.success(result.message);
        setEditingTeacher(null);
        setFormData({ name: '', department: '', subject: '', email: '', phone: '', password: '' });
        setShowAddForm(false);
        loadTeachers();
      } else {
        toast.error(result.error || 'Failed to update teacher');
      }
    } catch (error) {
      toast.error('Error updating teacher information');
    } finally {
      setProcessing(prev => ({ ...prev, [editingTeacher.uid]: false }));
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name || '',
      department: teacher.department || '',
      subject: teacher.subject || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      password: '' // Leave password empty for editing
    });
    setShowAddForm(true);
  };

  const handleRecreateTeacher = async (teacher) => {
    if (window.confirm(`Are you sure you want to recreate the authentication for "${teacher.name}"? This will delete their existing Firebase Authentication account.`)) {
      setProcessing(prev => ({ ...prev, [teacher.uid]: true }));
      try {
        const result = await deleteTeacher(teacher.uid); // Delete the teacher first
        if (result.success) {
          toast.info(`Authentication for "${teacher.name}" deleted. Please add them again using the "Add Teacher" form.`);
          loadTeachers();
        } else {
          toast.error(result.error || 'Failed to delete teacher authentication');
        }
      } catch (error) {
        toast.error('Error deleting teacher authentication');
      } finally {
        setProcessing(prev => ({ ...prev, [teacher.uid]: false }));
      }
    }
  };

  const handleDelete = async (teacherUid) => {
    if (window.confirm('Are you sure you want to permanently delete this teacher? This action cannot be undone.')) {
      setProcessing(prev => ({ ...prev, [teacherUid]: true }));
      try {
        const result = await deleteTeacher(teacherUid, { hardDelete: true });
        if (result.success) {
          toast.success(result.message);
          loadTeachers();
        } else {
          toast.error(result.error || 'Failed to delete teacher');
        }
      } catch (error) {
        toast.error('Error deleting teacher');
      } finally {
        setProcessing(prev => ({ ...prev, [teacherUid]: false }));
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', department: '', subject: '', email: '', phone: '', password: '' });
    setEditingTeacher(null);
    setShowAddForm(false);
  };

  const clearMessage = () => {
    setMessage({ type: '', text: '' });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Teacher Management</h2>
        </div>
        <div className="card">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading teachers...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Teacher Management</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          + Add Teacher
        </button>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700'
            : message.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <div className="flex justify-between items-center">
            <span>{message.text}</span>
            <button 
              onClick={clearMessage}
              className="text-sm font-medium hover:opacity-75"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      

      {/* Add/Edit Teacher Form */}
      {showAddForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="input-field"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  className="input-field"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {editingTeacher ? '(Leave blank to keep current password)' : '(Required for new teachers)'}
              </label>
              <input
                type="password"
                required={!editingTeacher}
                className="input-field"
                placeholder={editingTeacher ? 'Enter new password or leave blank' : 'Enter password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              {editingTeacher ? (
                <p className="text-xs text-gray-500 mt-1">
                  Note: Password updates require the teacher to be signed in or admin SDK access
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Note: Teachers can also register themselves and will be automatically approved
                </p>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={processing[editingTeacher?.uid] || processing['new']}
              >
                {processing[editingTeacher?.uid] || processing['new'] ? 'Processing...' : (editingTeacher ? 'Update Teacher' : 'Add Teacher')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teachers List */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Teachers List</h3>
          <button
            onClick={loadTeachers}
            className="btn-secondary text-sm"
          >
            🔄 Refresh
          </button>
        </div>
        
       
        
        {teachers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">👨‍🏫</div>
            <p className="text-gray-500">No teachers found.</p>
            <p className="text-sm text-gray-400 mt-2">Teachers can register themselves and will be automatically approved.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teachers.map((teacher) => (
                  <tr key={teacher.uid}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {teacher.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {teacher.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {teacher.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {teacher.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {teacher.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        teacher.status === 'active' || teacher.approved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {teacher.status === 'active' || teacher.approved ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(teacher)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRecreateTeacher(teacher)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Recreate
                      </button>
                      <button
                        onClick={() => handleDelete(teacher.uid)}
                        disabled={processing[teacher.uid]}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {processing[teacher.uid] ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherManagement;
