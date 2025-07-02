import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext.tsx';
import { AuthProvider, ProtectedRoute, RoleProtectedRoute, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import MentorDashboard from './pages/mentor/MentorDashboard';
import StudentSchedule from './pages/student/StudentSchedule';
import StudentTasks from './pages/student/StudentTasks';
import StudentJournal from './pages/student/StudentJournal';
import StudentGoals from './pages/student/StudentGoals';
import MentorStudentOverview from './pages/mentor/MentorStudentOverview.tsx';
import MentorTaskManager from './pages/mentor/MentorTaskManager';
import MentorProgressTracker from './pages/mentor/MentorProgressTracker.tsx';
import SubjectPage from './pages/shared/SubjectPage';
import NotFound from './pages/NotFound';
import MentorCurriculum from './pages/mentor/MentorCurriculum';
import MentorTaskPlanner from './pages/mentor/MentorTaskPlanner.tsx';
import CourseBluePrint from './pages/mentor/CourseBluePrint';
import { CurriculumProvider } from './context/CurriculumContext';
import { ErrorProvider } from './context/ErrorContext';
import StudentPlanning from './pages/student/StudentPlanning';
import GoalMindMapPage from './pages/student/GoalMindMapPage';
import TopicMindMapPage from './pages/student/TopicMindMapPage.tsx';
import TaskWallPage from './pages/student/TaskWallPage';
import LottiePreview from './pages/preview/LottiePreview';
import { StudentLearningMap } from './pages/student/StudentLearningMap';
import { UserAdminPage } from './pages/admin/UserAdminPage';
import { AuthCallback } from './pages/AuthCallback.tsx';

// import { initGA } from './utils/analytics';

// initGA();

// 智能重定向組件
const SmartRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div>載入中...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 根據用戶的主要角色重定向
  const userRoles = user.roles || (user.role ? [user.role] : ['student']);
  const primaryRole = userRoles[0];

  if (primaryRole === 'admin') {
    return <Navigate to="/admin/users" replace />;
  } else if (primaryRole === 'mentor') {
    return <Navigate to="/mentor" replace />;
  } else {
    return <Navigate to="/student" replace />;
  }
};

function App() {
  return (
    <ErrorProvider>
      <AuthProvider>
        <CurriculumProvider>
          <UserProvider>
            <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* Preview Routes */}
            <Route path="/preview/lottie" element={<LottiePreview />} />
            
            {/* Student Routes */}
            <Route path="/student" element={
              <RoleProtectedRoute requiredRoles={['student', 'parent', 'admin', 'mentor']}>
                <TaskWallPage />
              </RoleProtectedRoute>
            } />
            <Route path="/student/task-wall" element={
              <RoleProtectedRoute requiredRoles={['student', 'parent', 'admin', 'mentor']}>
                <TaskWallPage />
              </RoleProtectedRoute>
            } />
            <Route path="/student/schedule" element={
              <RoleProtectedRoute requiredRoles={['student', 'parent', 'admin', 'mentor']}>
                <StudentSchedule />
              </RoleProtectedRoute>
            } />
            <Route path="/student/tasks" element={
              <RoleProtectedRoute requiredRoles={['student', 'parent', 'admin', 'mentor']}>
                <StudentTasks />
              </RoleProtectedRoute>
            } />
            <Route path="/student/planning" element={
              <RoleProtectedRoute requiredRoles={['student', 'parent', 'admin', 'mentor']}>
                <StudentPlanning />
              </RoleProtectedRoute>
            } />
            <Route path="/student/planning/goal/:goalId" element={
              <RoleProtectedRoute requiredRoles={['student', 'parent', 'admin', 'mentor']}>
                <GoalMindMapPage />
              </RoleProtectedRoute>
            } />
            <Route path="/student/planning/topic/:topicId" element={
              <RoleProtectedRoute requiredRoles={['student', 'parent', 'admin', 'mentor']}>
                <TopicMindMapPage />
              </RoleProtectedRoute>
            } />
            <Route path="/student/journal" element={
              <RoleProtectedRoute requiredRoles={['student', 'parent', 'admin', 'mentor']}>
                <StudentJournal />
              </RoleProtectedRoute>
            } />
            <Route path="/student/goals" element={
              <RoleProtectedRoute requiredRoles={['student', 'parent', 'admin', 'mentor']}>
                <StudentGoals />
              </RoleProtectedRoute>
            } />
            <Route path="/student/learning-map" element={
              <RoleProtectedRoute requiredRoles={['student', 'parent', 'admin', 'mentor']}>
                <StudentLearningMap />
              </RoleProtectedRoute>
            } />
            <Route path="/student/subject/:subjectId" element={
              <RoleProtectedRoute requiredRoles={['student', 'parent', 'admin', 'mentor']}>
                <SubjectPage />
              </RoleProtectedRoute>
            } />
            
            {/* Mentor Routes */}
            <Route path="/mentor" element={
              <RoleProtectedRoute requiredRoles={['mentor', 'admin']}>
                <MentorDashboard />
              </RoleProtectedRoute>
            } />
            <Route path="/mentor/tasks" element={
              <RoleProtectedRoute requiredRoles={['mentor', 'admin']}>
                <MentorTaskManager />
              </RoleProtectedRoute>
            } />
            <Route path="/mentor/task-planner" element={
              <RoleProtectedRoute requiredRoles={['mentor', 'admin']}>
                <MentorTaskPlanner />
              </RoleProtectedRoute>
            } />
            <Route path="/mentor/subject/:subjectId" element={
              <RoleProtectedRoute requiredRoles={['mentor', 'admin']}>
                <SubjectPage isMentor={true} />
              </RoleProtectedRoute>
            } />
            <Route path="/mentor/curriculum" element={
              <RoleProtectedRoute requiredRoles={['mentor', 'admin']}>
                <MentorCurriculum />
              </RoleProtectedRoute>
            } />
            <Route path="/mentor/course-blueprint" element={
              <RoleProtectedRoute requiredRoles={['mentor', 'admin']}>
                <CourseBluePrint />
              </RoleProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin/users" element={
              <RoleProtectedRoute requiredRoles={['admin']}>
                <UserAdminPage />
              </RoleProtectedRoute>
            } />
            

            
            {/* Default and Not Found Routes */}
            <Route path="/" element={<SmartRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
            </Router>
          </UserProvider>
        </CurriculumProvider>
      </AuthProvider>
    </ErrorProvider>
  );
}

export default App;