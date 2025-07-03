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
import { Sentry } from './config/sentry';
import { SentryTestButton } from './components/shared/SentryTestButton';

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
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">哎呀！出現了錯誤</h2>
            <p className="text-gray-600 mb-4">
              很抱歉，應用程式遇到了一個錯誤。我們已經收到錯誤報告，會盡快修復。
            </p>
            <div className="space-y-2">
              <button
                onClick={resetError}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                重試
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                重新載入頁面
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">錯誤詳情</summary>
                <pre className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded overflow-auto">
                  {error instanceof Error ? error.toString() : String(error)}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}
      beforeCapture={(scope) => {
        scope.setTag('component', 'App');
      }}
    >
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
    <SentryTestButton />
  </Sentry.ErrorBoundary>
  );
}

export default App;