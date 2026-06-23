import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Pages
import Auth from './pages/auth/Auth';
import Profile from './pages/profile/Profile';
import LearnerDashboard from './pages/learner/Dashboard';
import MyPlans from './pages/learner/MyPlans';
import PlanDetail from './pages/learner/PlanDetail';
import Documents from './pages/learner/Documents';
import CreatePlanFromDoc from './pages/learner/CreateCourse/CreatePlanFromDoc'; 
import LessonView from './pages/learner/LessonView';
import StudentList from './pages/instructor/StudentList';
import SharedPlans from './pages/instructor/SharedPlans';
import StudentPlanView from './pages/instructor/StudentPlanView';
import InstructorCourses from './pages/instructor/InstructorCourses';
import Market from './pages/learner/Market';
import InstructorDirectory from './pages/learner/InstructorDirectory';
import TeachingFields from './pages/instructor/TeachingFields';
import InstructorMarketListings from './pages/instructor/InstructorMarketListings';
import Friends from './pages/learner/Friends';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import CourseManagement from './pages/admin/CourseManagement';
import ReportManagement from './pages/admin/ReportManagement';
/**
 * 1. Component Bảo vệ Tuyến đường
 */
const ProtectedRoute = ({ 
  children, 
  allowedRole 
}: { 
  children: React.ReactNode, 
  allowedRole?: 'learner' | 'instructor' | 'admin'
}) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/auth" replace />;

  // Kiểm tra xem trong mảng role của user có quyền này không
  if (allowedRole && !user.role.includes(allowedRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

/**
 * 2. AppContent: Tách riêng để sử dụng được hook useAuth
 */
function AppRoutes() {
  const { user, activeMode } = useAuth();

  return (
    <Routes>
      {/* Route công khai */}
      <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" replace />} />

      {/* Nhóm Route bảo vệ */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        
        {/* Trang chủ điều hướng theo activeMode */}
        <Route index element={
          user?.role.includes('admin')
            ? <Navigate to="/admin/dashboard" replace />
            : (activeMode === 'instructor' && user?.role.includes('instructor'))
              ? <Navigate to="/instructor/courses" replace /> 
              : <Navigate to="/dashboard" replace />
        } />

        <Route path="profile" element={<Profile />} />

        {/* Routes cho Người học */}
        <Route path="dashboard" element={<ProtectedRoute allowedRole="learner"><LearnerDashboard /></ProtectedRoute>} />
        <Route path="create-plan" element={<ProtectedRoute allowedRole="learner"><CreatePlanFromDoc /></ProtectedRoute>} />
        <Route path="my-plans" element={<ProtectedRoute allowedRole="learner"><MyPlans /></ProtectedRoute>} />
        <Route path="plan/:id" element={<ProtectedRoute allowedRole="learner"><PlanDetail /></ProtectedRoute>} />
        <Route path="plan/:id/lesson/:dayNumber" element={<ProtectedRoute allowedRole="learner"><LessonView /></ProtectedRoute>} />
        <Route path="documents" element={<ProtectedRoute allowedRole="learner"><Documents /></ProtectedRoute>} />
        <Route path="market" element={
          <ProtectedRoute allowedRole="learner"><Market /></ProtectedRoute>
        } />
        <Route path="my-imports" element={
          <Navigate to="/dashboard" replace />
        } />
        <Route path="shared-plans" element={
          <ProtectedRoute allowedRole="learner"><SharedPlans /></ProtectedRoute>
        } />
        <Route path="instructors" element={
          <ProtectedRoute allowedRole="learner"><InstructorDirectory /></ProtectedRoute>
        } />
        <Route path="market-listings" element={
          <ProtectedRoute allowedRole="learner"><InstructorMarketListings /></ProtectedRoute>
        } />
        <Route path="friends" element={
          <ProtectedRoute allowedRole="learner"><Friends /></ProtectedRoute>
        } />
        {/* Routes cho Giảng viên */}
        
        <Route path="instructor/students" element={<ProtectedRoute allowedRole="instructor"><StudentList /></ProtectedRoute>} />
        <Route path="instructor/courses" element={<ProtectedRoute allowedRole="instructor"><InstructorCourses /></ProtectedRoute>} />
        <Route path="instructor/teaching-fields" element={<ProtectedRoute allowedRole="instructor"><TeachingFields /></ProtectedRoute>} />
        <Route path="instructor/market-listings" element={<ProtectedRoute allowedRole="instructor"><InstructorMarketListings /></ProtectedRoute>} />
        <Route path="instructor/course/:planId" element={<ProtectedRoute allowedRole="instructor"><StudentPlanView /></ProtectedRoute>} />
      </Route>

      {/* ── ADMIN ROUTES (Layout riêng, không dùng MainLayout) ── */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRole="admin">
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users"     element={<UserManagement />} />
        <Route path="courses"   element={<CourseManagement />} />
        <Route path="reports"   element={<ReportManagement />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * 3. Component Gốc
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;