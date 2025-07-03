import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      'Unlock Your Potential with': 'Unlock Your Potential with',
      'Join a vibrant learning community. Access premium courses, learn from top educators, and achieve your goals with flexible, modern online education.': 'Join a vibrant learning community. Access premium courses, learn from top educators, and achieve your goals with flexible, modern online education.',
      'Explore Courses': 'Explore Courses',
      'Join Now': 'Join Now',
      'Admin Dashboard': 'Admin Dashboard',
      'Manage Teachers': 'Manage Teachers',
      'Manage Classes': 'Manage Classes',
      'Current Teachers': 'Current Teachers',
      'Current Classes': 'Current Classes',
      'Add New Teacher': 'Add New Teacher',
      'Add New Class': 'Add New Class',
      'Edit': 'Edit',
      'Delete': 'Delete',
      'Free': 'Free',
      'Dashboard': 'Dashboard',
      'Logout': 'Logout',
      'Sign In': 'Sign In',
      'Register': 'Register',
      'Switch to English': 'Switch to English',
      'التبديل إلى العربية': 'Switch to Arabic',
      // Add more as needed
    },
  },
  ar: {
    translation: {
      'Unlock Your Potential with': 'اكتشف إمكانياتك مع',
      'Join a vibrant learning community. Access premium courses, learn from top educators, and achieve your goals with flexible, modern online education.': 'انضم إلى مجتمع تعليمي نابض بالحياة. احصل على دورات متميزة وتعلم من أفضل المعلمين وحقق أهدافك من خلال التعليم الحديث والمرن.',
      'Explore Courses': 'استكشف الدورات',
      'Join Now': 'انضم الآن',
      'Admin Dashboard': 'لوحة تحكم المشرف',
      'Manage Teachers': 'إدارة المعلمين',
      'Manage Classes': 'إدارة الدورات',
      'Current Teachers': 'المعلمون الحاليون',
      'Current Classes': 'الدورات الحالية',
      'Add New Teacher': 'إضافة معلم جديد',
      'Add New Class': 'إضافة دورة جديدة',
      'Edit': 'تعديل',
      'Delete': 'حذف',
      'Free': 'مجاني',
      'Dashboard': 'لوحة التحكم',
      'Logout': 'تسجيل الخروج',
      'Sign In': 'تسجيل الدخول',
      'Register': 'إنشاء حساب',
      'Switch to English': 'Switch to English',
      'التبديل إلى العربية': 'التبديل إلى العربية',
      // Add more as needed
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

// Set dir attribute on html for RTL/LTR
 i18n.on('languageChanged', (lng) => {
   if (lng === 'ar') {
     document.documentElement.dir = 'rtl';
   } else {
     document.documentElement.dir = 'ltr';
   }
 });

export default i18n; 