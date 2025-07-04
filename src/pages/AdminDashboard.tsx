import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Users, BookOpen, Key, Edit, Trash2, AlertCircle, CheckCircle, Clipboard } from 'lucide-react';
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
  teacher_name: string;
  video_url: string;
  thumbnail: string;
  price: number;
  is_free: boolean;
}

interface AccessCode {
  id: number;
  code: string;
  class_id: number;
  class_title: string;
  price: number;
  is_used: boolean;
  used_by_name?: string;
  created_at: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const assetUrl = (path: string) => `${API_BASE.replace(/\/api$/, '')}${path}`;

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('teachers');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { t } = useTranslation();

  // Form states
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    bio: '',
    subject: '',
    photo: null as File | null
  });

  const [classForm, setClassForm] = useState({
    title: '',
    description: '',
    teacher_id: '',
    video_url: '',
    thumbnail: null as File | null,
    price: ''
  });

  const [codeForm, setCodeForm] = useState({
    class_id: '',
    price: ''
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  // Add state for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{ type: 'teacher' | 'class' | null, id: number | null }>({ type: null, id: null });

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string }>({ open: false, message: '' });

  // Add state for code snackbar
  const [codeSnackbar, setCodeSnackbar] = useState<{ open: boolean, code: string, copied: boolean }>({ open: false, code: '', copied: false });

  // Snackbar show/hide helpers
  const showSnackbar = (msg: string) => {
    setSnackbar({ open: true, message: msg });
    setTimeout(() => setSnackbar({ open: false, message: '' }), 4000);
  };
  const hideSnackbar = () => setSnackbar({ open: false, message: '' });

  const showCodeSnackbar = (code: string) => {
    setCodeSnackbar({ open: true, code, copied: false });
    setTimeout(() => setCodeSnackbar({ open: false, code: '', copied: false }), 5000);
  };
  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(codeSnackbar.code);
    setCodeSnackbar((prev) => ({ ...prev, copied: true }));
    setTimeout(() => setCodeSnackbar({ open: false, code: '', copied: false }), 1200);
  };
  const hideCodeSnackbar = () => setCodeSnackbar({ open: false, code: '', copied: false });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teachersRes, classesRes, codesRes] = await Promise.all([
        axios.get(`${API_BASE}/teachers`),
        axios.get(`${API_BASE}/classes`),
        axios.get(`${API_BASE}/access-codes`)
      ]);
      setTeachers(teachersRes.data);
      setClasses(classesRes.data);
      setAccessCodes(codesRes.data);
    } catch (error) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('name', teacherForm.name);
    formData.append('bio', teacherForm.bio);
    formData.append('subject', teacherForm.subject);
    if (teacherForm.photo) {
      formData.append('photo', teacherForm.photo);
    }

    try {
      await axios.post(`${API_BASE}/teachers`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showSnackbar(t('Teacher added successfully! Welcome aboard!'));
      setTeacherForm({ name: '', bio: '', subject: '', photo: null });
      fetchData();
    } catch (error) {
      setError('Failed to add teacher');
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('title', classForm.title);
    formData.append('description', classForm.description);
    formData.append('teacher_id', classForm.teacher_id);
    formData.append('video_url', classForm.video_url);
    formData.append('price', classForm.price);
    if (classForm.thumbnail) {
      formData.append('thumbnail', classForm.thumbnail);
    }

    try {
      await axios.post(`${API_BASE}/classes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showSnackbar(t('Class added successfully!'));
      setClassForm({ title: '', description: '', teacher_id: '', video_url: '', thumbnail: null, price: '' });
      fetchData();
    } catch (error) {
      setError('Failed to add class');
    }
  };

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_BASE}/access-codes`, {
        class_id: parseInt(codeForm.class_id),
        price: parseFloat(codeForm.price)
      });
      showCodeSnackbar(response.data.code);
      setCodeForm({ class_id: '', price: '' }); // Fixed: Reset form after successful generation
      fetchData();
    } catch (error) {
      setError('Failed to generate access code');
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleEditClick = (classItem: Class) => {
    setEditingClass(classItem);
    setEditModalOpen(true);
  };

  const handleEditSave = () => {
    setEditModalOpen(false);
    setEditingClass(null);
    fetchData();
  };

  const handleDelete = (type: 'teacher' | 'class', id: number) => {
    setConfirmDialog({ type, id });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.type || confirmDialog.id == null) return;
    try {
      const token = localStorage.getItem('token');
      if (confirmDialog.type === 'teacher') {
        await axios.delete(`${API_BASE}/teachers/${confirmDialog.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeachers((prev) => prev.filter((t) => t.id !== confirmDialog.id));
        showSnackbar(t('Teacher deleted successfully!'));
      } else {
        await axios.delete(`${API_BASE}/classes/${confirmDialog.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClasses((prev) => prev.filter((c) => c.id !== confirmDialog.id));
        showSnackbar(t('Class deleted successfully!'));
      }
    } catch (err) {
      setError(t('Failed to delete'));
    } finally {
      setConfirmDialog({ type: null, id: null });
    }
  };

  const cancelDelete = () => setConfirmDialog({ type: null, id: null });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('Admin Dashboard')}</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">{t('Manage teachers, classes, and access codes')}</p>
            </div>
            <a
              href="/admin/students"
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Students
            </a>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-red-700 dark:text-red-300">{error}</span>
            </div>
            <button onClick={clearMessages} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200">×</button>
          </div>
        )}

        {snackbar.open && (
          <div
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg animate-fade-in-up cursor-pointer dark:bg-green-700"
            onClick={hideSnackbar}
            dir={t('dir')}
            role="alert"
            style={{ minWidth: 250 }}
          >
            <CheckCircle className="h-6 w-6 text-white" />
            <span className="font-semibold">{snackbar.message}</span>
          </div>
        )}

        {/* Code Snackbar */}
        {codeSnackbar.open && (
          <div
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg animate-fade-in-up cursor-pointer dark:bg-blue-700"
            dir={t('dir')}
            role="alert"
            style={{ minWidth: 250 }}
            onClick={hideCodeSnackbar}
          >
            <Clipboard className="h-6 w-6 text-white" />
            <span className="font-semibold">{codeSnackbar.copied ? t('Copied!') : t('New class code:')} {codeSnackbar.copied ? '' : codeSnackbar.code}</span>
            {!codeSnackbar.copied && (
              <button
                className="ml-2 px-3 py-1 bg-white bg-opacity-20 rounded text-white font-semibold hover:bg-opacity-40"
                onClick={e => { e.stopPropagation(); handleCopyCode(); }}
              >
                {t('Copy')}
              </button>
            )}
            <button className="ml-2 text-white text-lg font-bold" onClick={hideCodeSnackbar}>&times;</button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'teachers', label: 'Teachers', icon: Users },
                { id: 'classes', label: 'Classes', icon: BookOpen },
                { id: 'codes', label: 'Access Codes', icon: Key }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 flex items-center space-x-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Teachers Tab */}
            {activeTab === 'teachers' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Users className="h-6 w-6 text-blue-500 dark:text-blue-400" /> {t('Manage Teachers')}</h2>
                  <form onSubmit={handleAddTeacher} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Teacher Name"
                        value={teacherForm.name}
                        onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                        className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Subject"
                        value={teacherForm.subject}
                        onChange={(e) => setTeacherForm({ ...teacherForm, subject: e.target.value })}
                        className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <textarea
                      placeholder="Bio"
                      rows={3}
                      value={teacherForm.bio}
                      onChange={(e) => setTeacherForm({ ...teacherForm, bio: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setTeacherForm({ ...teacherForm, photo: e.target.files?.[0] || null })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      <Plus className="h-4 w-4 inline mr-2" />
                      {t('Add Teacher')}
                    </button>
                  </form>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Current Teachers</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teachers.map((teacher) => (
                      <TeacherCard key={teacher.id} teacher={teacher} onDelete={() => handleDelete('teacher', teacher.id)} t={t} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Classes Tab */}
            {activeTab === 'classes' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><BookOpen className="h-6 w-6 text-blue-500 dark:text-blue-400" /> {t('Manage Classes')}</h2>
                  <form onSubmit={handleAddClass} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Class Title"
                        value={classForm.title}
                        onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                        className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                      <select
                        value={classForm.teacher_id}
                        onChange={(e) => setClassForm({ ...classForm, teacher_id: e.target.value })}
                        className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="">Select Teacher</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      placeholder="Class Description"
                      rows={3}
                      value={classForm.description}
                      onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="url"
                        placeholder="Video URL (YouTube embed)"
                        value={classForm.video_url}
                        onChange={(e) => setClassForm({ ...classForm, video_url: e.target.value })}
                        className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price (0 for free)"
                        value={classForm.price}
                        onChange={(e) => setClassForm({ ...classForm, price: e.target.value })}
                        className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setClassForm({ ...classForm, thumbnail: e.target.files?.[0] || null })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      <Plus className="h-4 w-4 inline mr-2" />
                      {t('Add Class')}
                    </button>
                  </form>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Current Classes</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((classItem) => (
                      <ClassCard key={classItem.id} classItem={classItem} onEdit={handleEditClick} onDelete={() => handleDelete('class', classItem.id)} t={t} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Access Codes Tab */}
            {activeTab === 'codes' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Generate Access Code</h2>
                  <form onSubmit={handleGenerateCode} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select
                        value={codeForm.class_id}
                        onChange={(e) => setCodeForm({ ...codeForm, class_id: e.target.value })}
                        className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="">Select Class</option>
                        {classes.filter(c => !c.is_free).map((classItem) => (
                          <option key={classItem.id} value={classItem.id}>
                            {classItem.title} - ${classItem.price}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Code Price"
                        value={codeForm.price}
                        onChange={(e) => setCodeForm({ ...codeForm, price: e.target.value })}
                        className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      <Key className="h-4 w-4 inline mr-2" />
                      {t('Generate Code')}
                    </button>
                  </form>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Access Codes</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Class
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Used By
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {accessCodes.map((code) => (
                          <tr key={code.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900 dark:text-white">
                              {code.code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {code.class_title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              ${code.price}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                code.is_used 
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              }`}>
                                {code.is_used ? 'Used' : 'Available'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {code.used_by_name || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Class Modal */}
      <EditClassModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        classItem={editingClass}
        onSave={handleEditSave}
      />

      {/* Confirmation Dialog */}
      {confirmDialog.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-sm relative">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t('Are you sure?')}</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-200">{confirmDialog.type === 'teacher' ? t('This will permanently delete the teacher.') : t('This will permanently delete the class.')}</p>
            <div className="flex justify-end gap-2">
              <button onClick={cancelDelete} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold">{t('Cancel')}</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-semibold">{t('Delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// EditClassModal component
const EditClassModal = ({ open, onClose, classItem, onSave }: any) => {
  const [form, setForm] = useState({
    title: classItem?.title || '',
    description: classItem?.description || '',
    video_url: classItem?.video_url || '',
    price: classItem?.price?.toString() || '0',
    thumbnail: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (classItem) {
      setForm({
        title: classItem.title,
        description: classItem.description,
        video_url: classItem.video_url,
        price: classItem.price?.toString() || '0',
        thumbnail: null,
      });
    }
  }, [classItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('video_url', form.video_url);
      formData.append('price', form.price);
      if (form.thumbnail) {
        formData.append('thumbnail', form.thumbnail);
      }
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/videos/${classItem.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      onSave();
    } catch (err: any) {
      setError('Failed to update class');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-lg relative">
        <button className="absolute top-2 right-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Class</h2>
        {error && <div className="mb-2 text-red-600 dark:text-red-400">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Class Title"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={3}
          />
          <input
            type="url"
            placeholder="Video URL"
            value={form.video_url}
            onChange={e => setForm({ ...form, video_url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Price (0 for free)"
            value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
          <input
            type="file"
            accept="image/*"
            onChange={e => setForm({ ...form, thumbnail: e.target.files?.[0] || null })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Modularize TeacherCard and ClassCard for clarity and style
const TeacherCard = ({ teacher, onDelete, t }: any) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col items-start gap-2 border border-gray-100 dark:border-gray-700 relative group">
    <div className="flex items-center gap-4 w-full">
      <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden">
        {teacher.photo ? (
          <img src={assetUrl(teacher.photo)} alt={teacher.name} className="w-full h-full object-cover" />
        ) : (
          <Users className="h-8 w-8 text-blue-400 dark:text-blue-300" />
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{teacher.name}</h3>
        <p className="text-blue-600 dark:text-blue-400 font-medium text-sm">{teacher.subject}</p>
        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">{teacher.bio}</p>
      </div>
    </div>
    <button
      className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold shadow transition-colors"
      onClick={() => onDelete(teacher.id)}
      title="Delete Teacher"
    >
      <Trash2 className="h-4 w-4" /> {t('Delete')}
    </button>
  </div>
);

const ClassCard = ({ classItem, onEdit, onDelete, t }: any) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col gap-2 border border-gray-100 dark:border-gray-700 relative group">
    <div className="flex items-center gap-4">
      <div className="w-20 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
        {classItem.thumbnail ? (
          <img src={assetUrl(classItem.thumbnail)} alt={classItem.title} className="w-full h-full object-cover" />
        ) : (
          <BookOpen className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{classItem.title}</h3>
        <p className="text-blue-600 dark:text-blue-400 font-medium text-sm">{classItem.teacher_name}</p>
        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">{classItem.description}</p>
        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${classItem.is_free ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'}`}>{classItem.is_free ? 'Free' : `$${classItem.price}`}</span>
      </div>
    </div>
    <div className="flex gap-2 mt-2 self-end">
      <button
        className="inline-flex items-center px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded text-sm font-semibold shadow"
        onClick={() => onEdit(classItem)}
        title="Edit Class"
      >
        <Edit className="h-4 w-4 mr-1" /> {t('Edit')}
      </button>
      <button
        className="inline-flex items-center px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-semibold shadow"
        onClick={() => onDelete(classItem.id)}
        title="Delete Class"
      >
        <Trash2 className="h-4 w-4 mr-1" /> {t('Delete')}
      </button>
    </div>
  </div>
);

export default AdminDashboard;