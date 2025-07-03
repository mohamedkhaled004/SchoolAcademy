import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, BookOpen, DollarSign, Unlock, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface Teacher {
  id: number;
  name: string;
  bio: string;
  subject: string;
  photo: string;
}

interface Class {
  id: number;
  title: string;
  description: string;
  teacher_id: number;
  video_url: string;
  thumbnail: string;
  price: number;
  is_free: boolean;
}

const TeacherProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { t } = useTranslation();
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, type: 'success' | 'error' }>({ open: false, message: '', type: 'success' });

  useEffect(() => {
    if (id) {
      fetchTeacherData();
    }
  }, [id]);

  useEffect(() => {
    if (showCodeModal && selectedClass) {
      const opened = JSON.parse(localStorage.getItem('openedClasses') || '[]');
      if (opened.includes(String(selectedClass.id))) {
        setShowCodeModal(false);
        setSelectedClass(null);
        setAccessCode('');
        navigate(`/class/${selectedClass.id}`);
      }
    }
  }, [showCodeModal, selectedClass, navigate]);

  const fetchTeacherData = async () => {
    try {
      const [teacherRes, classesRes] = await Promise.all([
        axios.get(`http://localhost:3001/api/teachers/${id}`),
        axios.get(`http://localhost:3001/api/classes?teacher_id=${id}`)
      ]);
      setTeacher(teacherRes.data);
      setClasses(classesRes.data);
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setAuthError(true);
        setError('Your session has expired. Please log in again to view teacher information.');
      } else {
        setError('Failed to load teacher information. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (classItem: Class) => {
    if (!user) {
      setError('Please login to join classes');
      return;
    }

    setError('');

    if (classItem.is_free) {
      try {
        const response = await axios.post('http://localhost:3001/api/enroll-free', {
          class_id: classItem.id
        });
        
        if (response.data.success) {
          // Show success message and redirect to class
          alert('Successfully enrolled in free class!');
          navigate(`/class/${classItem.id}`);
        }
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          setAuthError(true);
          setError('Your session has expired. Please log in again to join classes.');
        } else if (error.response?.data?.error === 'Already enrolled in this class') {
          // If already enrolled, just navigate to the class
          navigate(`/class/${classItem.id}`);
        } else {
          setError(error.response?.data?.error || 'Failed to enroll');
        }
      }
    } else {
      setSelectedClass(classItem);
      setShowCodeModal(true);
      setCodeError('');
      setCodeSuccess('');
      setAccessCode('');
    }
  };

  const showSnackbar = (msg: string, type: 'success' | 'error') => {
    setSnackbar({ open: true, message: msg, type });
    setTimeout(() => setSnackbar({ open: false, message: '', type }), 4000);
  };

  const hideSnackbar = () => setSnackbar({ open: false, message: '', type: snackbar.type });

  const handleRedeemCode = async () => {
    if (!accessCode.trim()) {
      setCodeError(t('Please enter an access code'));
      showSnackbar(t('Please enter an access code'), 'error');
      return;
    }
    setIsRedeeming(true);
    setCodeError('');
    try {
      const response = await axios.post('http://localhost:3001/api/redeem-code', {
        code: accessCode.trim()
      });
      if (response.data.success) {
        // Copy code to clipboard
        await navigator.clipboard.writeText(accessCode.trim());
        // Store class as opened
        const opened = JSON.parse(localStorage.getItem('openedClasses') || '[]');
        if (!opened.includes(String(selectedClass?.id))) {
          opened.push(String(selectedClass?.id));
          localStorage.setItem('openedClasses', JSON.stringify(opened));
        }
        showSnackbar(t('Class code copied successfully!'), 'success');
        setTimeout(() => {
          setShowCodeModal(false);
          setSelectedClass(null);
          setAccessCode('');
          navigate(`/class/${selectedClass?.id}`);
        }, 800);
      }
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setAuthError(true);
        setError('Your session has expired. Please log in again to redeem codes.');
        setShowCodeModal(false);
      } else if (error.response?.data?.error === 'You already have access to this class') {
        setShowCodeModal(false);
        setSelectedClass(null);
        navigate(`/class/${selectedClass?.id}`);
      } else {
        setCodeError(error.response?.data?.error || t('Failed to redeem code'));
        showSnackbar(error.response?.data?.error || t('Invalid class code'), 'error');
      }
    } finally {
      setIsRedeeming(false);
    }
  };

  const closeModal = () => {
    setShowCodeModal(false);
    setSelectedClass(null);
    setAccessCode('');
    setCodeError('');
    setCodeSuccess('');
    setIsRedeeming(false);
  };

  const handleLoginRedirect = () => {
    logout();
    navigate('/login', { state: { from: `/teacher/${id}` } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Session Expired</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={handleLoginRedirect}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Log In Again
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Teacher Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">The teacher you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Teacher Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
            <div className="relative">
              {teacher.photo ? (
                <img
                  src={`http://localhost:3001${teacher.photo}`}
                  alt={teacher.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-white bg-opacity-20 flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="h-16 w-16 text-white" />
                </div>
              )}
            </div>
            
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2">{teacher.name}</h1>
              <p className="text-xl text-blue-100 mb-4">{teacher.subject}</p>
              <p className="text-lg text-blue-50 max-w-2xl leading-relaxed">{teacher.bio}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Classes Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Available Classes</h2>
          <p className="text-gray-600 dark:text-gray-300">Explore the courses offered by {teacher.name}</p>
        </div>

        {classes.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No classes available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {classes.map((classItem) => (
              <div
                key={classItem.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
              >
                <div className="relative h-48 bg-gradient-to-br from-blue-400 to-indigo-500">
                  {classItem.thumbnail ? (
                    <img
                      src={`http://localhost:3001${classItem.thumbnail}`}
                      alt={classItem.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-white" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      classItem.is_free
                        ? 'bg-green-500 text-white'
                        : 'bg-yellow-500 text-white'
                    }`}>
                      {classItem.is_free ? 'Free' : `$${classItem.price}`}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{classItem.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3 leading-relaxed">
                    {classItem.description}
                  </p>
                  
                  <button
                    onClick={() => handleJoinClass(classItem)}
                    className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 ${
                      classItem.is_free
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {classItem.is_free ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    <span>{classItem.is_free ? 'Join Free Class' : 'Enter Access Code'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Access Code Modal */}
      {showCodeModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Enter Access Code for "{selectedClass.title}"
            </h3>
            
            {codeError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                {codeError}
              </div>
            )}
            
            {codeSuccess && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>{codeSuccess}</span>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Access Code
              </label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter your access code"
                disabled={isRedeeming || !!codeSuccess}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRedeemCode}
                disabled={isRedeeming || !!codeSuccess}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors"
              >
                {isRedeeming ? 'Redeeming...' : 'Redeem Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbar.open && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          snackbar.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {snackbar.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{snackbar.message}</span>
            <button onClick={hideSnackbar} className="ml-2 hover:opacity-75">
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherProfile;