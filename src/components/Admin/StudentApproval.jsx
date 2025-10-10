import React, { useState, useEffect } from 'react';
import { 
  getPendingStudentRegistrations, 
  approveStudentRegistration, 
  rejectStudentRegistration 
} from '../../services/adminService';
import toast from 'react-hot-toast';

const StudentApproval = () => {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    loadPendingRegistrations();
  }, []);

  const loadPendingRegistrations = async () => {
    setLoading(true);
    try {
      const result = await getPendingStudentRegistrations();
      if (result.success) {
        setPendingStudents(result.data);
      } else {
        toast.error(result.error || 'Failed to load pending registrations');
      }
    } catch (error) {
      toast.error('Error loading pending registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (studentUid) => {
    setProcessing(prev => ({ ...prev, [studentUid]: true }));
    try {
      const result = await approveStudentRegistration(studentUid);
      if (result.success) {
        toast.success(result.message);
        // Remove the approved student from the pending list
        setPendingStudents(prev => prev.filter(student => student.uid !== studentUid));
      } else {
        toast.error(result.error || 'Failed to approve student');
      }
    } catch (error) {
      toast.error('Error approving student registration');
    } finally {
      setProcessing(prev => ({ ...prev, [studentUid]: false }));
    }
  };

  const handleReject = async (studentUid) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (reason === null) return; // User cancelled
    
    setProcessing(prev => ({ ...prev, [studentUid]: true }));
    try {
      const result = await rejectStudentRegistration(studentUid, reason);
      if (result.success) {
        toast.success(result.message);
        // Remove the rejected student from the pending list
        setPendingStudents(prev => prev.filter(student => student.uid !== studentUid));
      } else {
        toast.error(result.error || 'Failed to reject student');
      }
    } catch (error) {
      toast.error('Error rejecting student registration');
    } finally {
      setProcessing(prev => ({ ...prev, [studentUid]: false }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Student Registration Approvals</h2>
        <div className="card">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading pending registrations...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Student Registration Approvals</h2>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Pending Registrations</h3>
          <button
            onClick={loadPendingRegistrations}
            className="btn-secondary text-sm"
          >
            🔄 Refresh
          </button>
        </div>
        
        {pendingStudents.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <p className="text-gray-500">No pending student registrations.</p>
            <p className="text-sm text-gray-400 mt-2">All student registrations have been processed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingStudents.map((student) => (
              <div key={student.uid} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">{student.name}</h4>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {student.email}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Student ID:</span> {student.studentId}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Registration Date:</span>{' '}
                        {new Date(student.createdAt || Date.now()).toLocaleDateString()}
                      </p>
                      {student.phone && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Phone:</span> {student.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleApprove(student.uid)}
                      disabled={processing[student.uid]}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      {processing[student.uid] ? 'Approving...' : '✅ Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(student.uid)}
                      disabled={processing[student.uid]}
                      className="btn-danger text-sm disabled:opacity-50"
                    >
                      {processing[student.uid] ? 'Rejecting...' : '❌ Reject'}
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
          <li>• Review each student registration carefully before approval</li>
          <li>• Approved students will be able to login and book appointments immediately</li>
          <li>• Rejected students will be notified and cannot access the system</li>
          <li>• You can provide a reason for rejection to help students understand</li>
          <li>• Use the refresh button to check for new pending registrations</li>
        </ul>
      </div>
    </div>
  );
};

export default StudentApproval;
