import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  User, 
  BookOpen, 
  GraduationCap, 
  Clock, 
  Users, 
  Star, 
  ArrowRight, 
  Play,
  Shield,
  Zap,
  Globe,
  TrendingUp
} from 'lucide-react';
import HeroSlider from '../components/HeroSlider';

interface Teacher {
  id: number;
  name: string;
  bio: string;
  subject: string;
  photo: string;
}

interface Stats {
  students: number;
  teachers: number;
  classes: number;
}

const HomePage: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [stats, setStats] = useState<Stats>({ students: 0, teachers: 0, classes: 0 });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [hoveredTeacher, setHoveredTeacher] = useState<number | null>(null);

  useEffect(() => {
    fetchTeachers();
    fetchStats();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/teachers');
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [studentsRes, teachersRes, classesRes] = await Promise.all([
        axios.get('http://localhost:3001/api/stats/students'),
        axios.get('http://localhost:3001/api/stats/teachers'),
        axios.get('http://localhost:3001/api/stats/classes')
      ]);
      
      setStats({
        students: studentsRes.data.count,
        teachers: teachersRes.data.count,
        classes: classesRes.data.count
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-slate-600 dark:text-gray-300 font-medium">Loading amazing content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <HeroSlider />
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-2">
                {statsLoading ? (
                  <div className="animate-pulse bg-slate-200 dark:bg-gray-600 h-8 w-16 rounded mx-auto"></div>
                ) : (
                  `${stats.students}+`
                )}
              </h3>
              <p className="text-slate-600 dark:text-gray-300 font-medium">Active Students</p>
            </div>
            <div className="text-center group">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-2">
                {statsLoading ? (
                  <div className="animate-pulse bg-slate-200 dark:bg-gray-600 h-8 w-16 rounded mx-auto"></div>
                ) : (
                  `${stats.teachers}+`
                )}
              </h3>
              <p className="text-slate-600 dark:text-gray-300 font-medium">Expert Teachers</p>
            </div>
            <div className="text-center group">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-2">
                {statsLoading ? (
                  <div className="animate-pulse bg-slate-200 dark:bg-gray-600 h-8 w-16 rounded mx-auto"></div>
                ) : (
                  `${stats.classes}+`
                )}
              </h3>
              <p className="text-slate-600 dark:text-gray-300 font-medium">Premium Courses</p>
            </div>
            <div className="text-center group">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-2">4.9</h3>
              <p className="text-slate-600 dark:text-gray-300 font-medium">Student Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Teachers Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-semibold mb-6">
              <Star className="h-4 w-4 mr-2" />
              Expert Instructors
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              Learn from the <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Best</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Discover world-class educators who are passionate about sharing their expertise and helping you achieve your learning goals.
            </p>
          </div>

          {teachers.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="h-12 w-12 text-slate-400 dark:text-gray-500" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-700 dark:text-gray-300 mb-2">No Teachers Available</h3>
              <p className="text-slate-500 dark:text-gray-400">We're working on bringing amazing instructors to the platform.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-slate-100 dark:border-gray-700"
                  onMouseEnter={() => setHoveredTeacher(teacher.id)}
                  onMouseLeave={() => setHoveredTeacher(null)}
                >
                  {/* Teacher Image */}
                  <div className="relative h-72 overflow-hidden">
                    {teacher.photo ? (
                      <img
                        src={`http://localhost:3001${teacher.photo}`}
                        alt={teacher.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                        <User className="h-20 w-20 text-white" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                        <Play className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Teacher Info */}
                  <div className="p-8">
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                        {teacher.name}
                      </h3>
                      <div className="inline-flex items-center px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold">
                        {teacher.subject}
                      </div>
                    </div>
                    
                    <p className="text-slate-600 dark:text-gray-300 mb-6 leading-relaxed line-clamp-3">
                      {teacher.bio}
                    </p>
                    
                    <Link
                      to={`/teacher/${teacher.id}`}
                      className="group/btn inline-flex items-center justify-between w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <span>View Classes</span>
                      <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full text-sm font-semibold mb-6">
              <Zap className="h-4 w-4 mr-2" />
              Why Choose Us
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              Everything you need to <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">succeed</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Our platform provides all the tools and resources you need to accelerate your learning journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-100 dark:border-gray-700">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Premium Content</h3>
              <p className="text-slate-600 dark:text-gray-300 leading-relaxed mb-6">
                Access high-quality educational content created by industry experts and academic professionals.
              </p>
              <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                Learn more <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-100 dark:border-gray-700">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Learn at Your Pace</h3>
              <p className="text-slate-600 dark:text-gray-300 leading-relaxed mb-6">
                Study whenever and wherever you want with lifetime access to your enrolled courses.
              </p>
              <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                Learn more <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-100 dark:border-gray-700">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Secure & Reliable</h3>
              <p className="text-slate-600 dark:text-gray-300 leading-relaxed mb-6">
                Your data and progress are protected with enterprise-grade security and backup systems.
              </p>
              <div className="flex items-center text-purple-600 dark:text-purple-400 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                Learn more <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-100 dark:border-gray-700">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Global Community</h3>
              <p className="text-slate-600 dark:text-gray-300 leading-relaxed mb-6">
                Connect with learners from around the world and share your knowledge and experiences.
              </p>
              <div className="flex items-center text-orange-600 dark:text-orange-400 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                Learn more <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-100 dark:border-gray-700">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Track Progress</h3>
              <p className="text-slate-600 dark:text-gray-300 leading-relaxed mb-6">
                Monitor your learning journey with detailed progress tracking and achievement badges.
              </p>
              <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                Learn more <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-100 dark:border-gray-700">
              <div className="bg-gradient-to-br from-teal-500 to-cyan-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Expert Support</h3>
              <p className="text-slate-600 dark:text-gray-300 leading-relaxed mb-6">
                Get help when you need it with our dedicated support team and community forums.
              </p>
              <div className="flex items-center text-teal-600 dark:text-teal-400 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                Learn more <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to start your learning journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of learners who are already transforming their careers and lives with our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-600 hover:bg-slate-100 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl inline-flex items-center justify-center"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
            <Link
              to="/login"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 inline-flex items-center justify-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;