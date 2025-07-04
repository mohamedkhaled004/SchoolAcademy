import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, User, Calendar, DollarSign, AlertCircle, Lock } from 'lucide-react';
import SmartVideoPlayer from '../components/SmartVideoPlayer';
import { useAuth } from '../contexts/AuthContext';

interface Class {
  id: number;
  title: string;
  description: string;
  video_url: string;
  thumbnail: string;
  price: number;
  is_free: boolean;
  teacher_name: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const assetUrl = (path: string) => `${API_BASE.replace(/\/api$/, '')}${path}`;

const ClassView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<Class | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    if (id) {
      fetchClassData();
      // Persist class access
      const opened = JSON.parse(localStorage.getItem('openedClasses') || '[]');
      if (!opened.includes(id)) {
        opened.push(id);
        localStorage.setItem('openedClasses', JSON.stringify(opened));
      }
    }
  }, [id]);

  const fetchClassData = async () => {
    try {
      const [accessRes, classesRes] = await Promise.all([
        axios.get(`${API_BASE}/check-access/${id}`),
        axios.get(`${API_BASE}/classes`)
      ]);
      
      setHasAccess(accessRes.data.hasAccess);
      
      const classItem = classesRes.data.find((c: Class) => c.id === parseInt(id!));
      if (classItem) {
        setClassData(classItem);
      } else {
        setError('Class not found');
      }
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setAuthError(true);
        setError('Your session has expired. Please log in again to access this class.');
      } else {
        setError('Failed to load class information. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    logout();
    navigate('/login', { state: { from: `/class/${id}` } });
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

  if (error || !classData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Error</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error || 'Class not found'}</p>
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

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <Lock className="h-16 w-16 text-yellow-500 dark:text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Required</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You don't have access to this class. Please enroll or enter an access code to continue.
          </p>
          <button
            onClick={() => navigate(`/teacher/${classData.teacher_name ? '1' : '1'}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            View Teacher Classes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Class Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="relative h-64 bg-gradient-to-br from-blue-400 to-indigo-500">
            {classData.thumbnail ? (
              <img
                src={assetUrl(classData.thumbnail)}
                alt={classData.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="h-24 w-24 text-white" />
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {classData.title}
              </h1>
              <div className="flex flex-wrap items-center space-x-4 text-white">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{classData.teacher_name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>{classData.is_free ? 'Free' : `$${classData.price}`}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="aspect-video">
                {classData.video_url ? (
                  <SmartVideoPlayer url={classData.video_url} title={classData.title} />
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Class Info */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About This Class</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                {classData.description}
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Instructor</span>
                  <span className="text-gray-900 dark:text-white font-semibold">{classData.teacher_name}</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Price</span>
                  <span className="text-gray-900 dark:text-white font-semibold">
                    {classData.is_free ? 'Free' : `$${classData.price}`}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Access</span>
                  <span className="text-green-600 dark:text-green-400 font-semibold">Enrolled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassView;