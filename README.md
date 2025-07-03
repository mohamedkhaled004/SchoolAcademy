# Educational Platform

A modern educational platform built with React, TypeScript, and Node.js that allows teachers to create and manage online classes, and students to enroll and access course content.

## 🚀 Recent Updates - Access Issue Resolution

### Problem Identified
Some teachers were experiencing problems when trying to access their classes and were being redirected back unexpectedly. This issue was related to user account configuration and authentication token management.

### Root Cause
The authentication system had several issues:
1. **Token Expiration**: JWT tokens expired after 24 hours without proper validation
2. **Silent Authentication Failures**: API calls failed due to expired tokens without clear error messages
3. **Missing Token Validation**: The frontend didn't validate tokens on app startup
4. **No Automatic Logout**: Expired tokens weren't automatically cleared

### Solution Implemented

#### 1. Enhanced Authentication Context (`AuthContext.tsx`)
- Added automatic token validation on app startup
- Implemented axios interceptors for automatic token handling
- Added automatic logout on authentication failures (401/403 responses)
- Improved error handling and user feedback

#### 2. Server-Side Token Validation (`server/index.js`)
- Added `/api/validate-token` endpoint for token validation
- Enhanced error responses for better debugging
- Improved authentication middleware

#### 3. Better Error Handling in Components
- **ClassView**: Added specific handling for authentication errors with clear user feedback
- **TeacherProfile**: Improved error states and authentication error handling
- **LoginPage**: Added support for redirects from access errors

#### 4. User Notification System
- Added notification banner in Navbar about the access issue resolution
- Improved error messages and user guidance
- Better visual feedback for authentication states

### Key Features

#### For Students
- Browse available teachers and their classes
- Enroll in free classes
- Access paid classes using access codes
- View enrolled classes in personal dashboard
- Watch video content with smart video player

#### For Teachers
- Create and manage course content
- Upload video materials
- Set pricing and access codes
- View student enrollments

#### For Administrators
- Manage teachers and classes
- Generate access codes
- Monitor platform usage
- Full administrative control

### Technical Stack

#### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication
- **Lucide React** for icons

#### Backend
- **Node.js** with Express
- **SQLite** database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Multer** for file uploads
- **CORS** enabled

### Getting Started

#### Prerequisites
- Node.js 16+ 
- npm or yarn

#### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

This will start both the frontend (Vite) and backend (Node.js) servers concurrently.

#### Default Credentials
- **Admin**: admin@example.com / Admin12345!
- **Student**: Register a new account

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/validate-token` - Token validation

#### Teachers
- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/:id` - Get specific teacher
- `POST /api/teachers` - Create teacher (admin only)
- `DELETE /api/teachers/:id` - Delete teacher (admin only)

#### Classes
- `GET /api/classes` - Get all classes
- `POST /api/classes` - Create class (admin only)
- `DELETE /api/classes/:id` - Delete class (admin only)
- `PUT /api/videos/:id` - Update class (admin only)

#### Access Management
- `POST /api/access-codes` - Generate access code (admin only)
- `GET /api/access-codes` - Get all access codes (admin only)
- `POST /api/redeem-code` - Redeem access code
- `POST /api/enroll-free` - Enroll in free class
- `GET /api/check-access/:class_id` - Check class access
- `GET /api/my-classes` - Get user's enrolled classes

### Database Schema

#### Users
- id, email, password, name, role, created_at

#### Teachers
- id, name, bio, subject, photo, created_at

#### Classes
- id, title, description, teacher_id, video_url, thumbnail, price, is_free, created_at

#### Access Codes
- id, code, class_id, price, is_used, used_by, created_at, used_at

#### User Classes
- id, user_id, class_id, enrolled_at

### Security Features

- JWT-based authentication with 24-hour expiration
- Automatic token validation and refresh
- Password hashing with bcrypt
- Protected routes with role-based access control
- Input validation and sanitization
- CORS configuration for security

### Error Handling

The platform now includes comprehensive error handling:
- Authentication errors with clear user feedback
- Automatic logout on token expiration
- Graceful error recovery
- User-friendly error messages
- Proper HTTP status codes

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### License

This project is licensed under the MIT License.

### Support

If you experience any issues:
1. Check the notification banner for recent updates
2. Try logging out and logging back in
3. Clear your browser cache
4. Contact support if issues persist

---

**Note**: The access issue has been resolved. If you continue to experience problems, please log out and log back in to refresh your authentication token. 