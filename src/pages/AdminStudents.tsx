import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Edit, 
  Save, 
  X, 
  Trash2, 
  AlertCircle, 
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SecurePasswordInput from '../components/SecurePasswordInput';
import { extractArrayFromResponse, isArrayWithItems } from '../utils/arrayUtils';

interface Student {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  guardianPhone: string;
  currentLocation: string;
  country: string;
  created_at: string;
}

interface EditingStudent {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  guardianPhone: string;
  currentLocation: string;
  country: string;
  password?: string;
}

const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<EditingStudent | null>(null);
  const [editingPassword, setEditingPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const API_BASE = 'http://localhost:3001/api';

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchStudents();
  }, [user, navigate]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await axios.get(`${API_BASE}/admin/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('🔍 Raw API Response:', response.data);
      
      const studentsData = extractArrayFromResponse(response.data);
      console.log('🔍 Extracted students data:', studentsData);
      
      if (isArrayWithItems(studentsData)) {
        console.log('🔍 First student data:', studentsData[0]);
        setStudents(studentsData);
      } else {
        console.log('⚠️ No students data found or invalid format');
        setStudents([]);
      }
    } catch (error: any) {
      console.error('❌ Fetch students error:', error);
      setError(error.response?.data?.error || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (student: Student) => {
    setEditingId(student.id);
    setEditingData({
      id: student.id,
      name: student.name,
      email: student.email,
      phoneNumber: student.phoneNumber,
      guardianPhone: student.guardianPhone,
      currentLocation: student.currentLocation,
      country: student.country
    });
    setEditingPassword('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingData(null);
    setEditingPassword('');
  };

  const saveEdit = async () => {
    if (!editingData) return;

    try {
      const token = localStorage.getItem('token');
      const updateData = { ...editingData };
      
      if (editingPassword) {
        updateData.password = editingPassword;
      }

      await axios.put(`${API_BASE}/admin/students/${editingData.id}`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setSuccess('Student updated successfully');
      fetchStudents();
      cancelEditing();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update student');
    }
  };

  const deleteStudent = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/admin/students/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setSuccess('Student deleted successfully');
      setDeleteConfirm(null);
      fetchStudents();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete student');
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Student Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all student accounts and data
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-700">{error}</span>
            <button onClick={clearMessages} className="ml-auto text-red-600 hover:text-red-800">×</button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-700">{success}</span>
            <button onClick={clearMessages} className="ml-auto text-green-600 hover:text-green-800">×</button>
          </div>
        )}

        {/* Students Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Country</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Guardian Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Password</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isArrayWithItems(students) ? (
                  students.map((student) => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === student.id ? (
                          <input
                            type="text"
                            value={editingData?.name || ''}
                            onChange={(e) => setEditingData(prev => prev ? {...prev, name: e.target.value} : null)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === student.id ? (
                          <input
                            type="email"
                            value={editingData?.email || ''}
                            onChange={(e) => setEditingData(prev => prev ? {...prev, email: e.target.value} : null)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 dark:text-white">{student.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === student.id ? (
                          <input
                            type="text"
                            value={editingData?.country || ''}
                            onChange={(e) => setEditingData(prev => prev ? {...prev, country: e.target.value} : null)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 dark:text-white">
                            {student.country ? (
                              <span className="text-green-600 dark:text-green-400">{student.country}</span>
                            ) : (
                              <span className="text-gray-400 italic">No country</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === student.id ? (
                          <input
                            type="tel"
                            value={editingData?.phoneNumber || ''}
                            onChange={(e) => setEditingData(prev => prev ? {...prev, phoneNumber: e.target.value} : null)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 dark:text-white">
                            {student.phoneNumber && student.phoneNumber !== 'N/A' ? (
                              <span className="text-green-600 dark:text-green-400">{student.phoneNumber}</span>
                            ) : (
                              <span className="text-gray-400 italic">No phone</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === student.id ? (
                          <input
                            type="tel"
                            value={editingData?.guardianPhone || ''}
                            onChange={(e) => setEditingData(prev => prev ? {...prev, guardianPhone: e.target.value} : null)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 dark:text-white">
                            {student.guardianPhone && student.guardianPhone !== 'N/A' ? (
                              <span className="text-green-600 dark:text-green-400">{student.guardianPhone}</span>
                            ) : (
                              <span className="text-gray-400 italic">No guardian phone</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === student.id ? (
                          <input
                            type="text"
                            value={editingData?.currentLocation || ''}
                            onChange={(e) => setEditingData(prev => prev ? {...prev, currentLocation: e.target.value} : null)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 dark:text-white">
                            {student.currentLocation && student.currentLocation !== 'N/A' ? (
                              <span className="text-green-600 dark:text-green-400">{student.currentLocation}</span>
                            ) : (
                              <span className="text-gray-400 italic">No location</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === student.id ? (
                          <div className="w-48">
                            <SecurePasswordInput
                              value={editingPassword}
                              onChange={(e) => setEditingPassword(e.target.value)}
                              placeholder="Enter password"
                              isExistingPassword={true}
                              className="w-full"
                            />
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                              ••••••••
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(student.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingId === student.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={saveEdit}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditing(student)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(student.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No students available</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!isArrayWithItems(students) && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Students Found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {!Array.isArray(students) ? 'Unable to load students data.' : 'No students have registered yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Delete Student</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to delete this student? This action cannot be undone.</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteStudent(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudents;
