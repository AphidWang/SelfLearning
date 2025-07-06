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
import HabitChallengePage from './pages/student/HabitChallengePage';
import TaskHabitIntegrationPage from './pages/student/TaskHabitIntegrationPage';
import LottiePreview from './pages/preview/LottiePreview';
import { StudentLearningMap } from './pages/student/StudentLearningMap';
import { UserAdminPage } from './pages/admin/UserAdminPage';
import { AuthCallback } from './pages/AuthCallback.tsx';
import { ErrorBoundary } from './config/sentry';
import { SentryTestButton } from './components/shared/SentryTestButton';

// import { initGA } from './utils/analytics';

// initGA();

// 自訂錯誤邊界組件
class CustomErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">出現錯誤</h2>
            <p className="text-gray-600 mb-4">
              很抱歉，應用程式遇到了問題。請重新載入頁面或聯繫支援。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重新載入頁面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 智能重定向組件 - 只處理角色重定向邏輯
const SmartRedirectContent: React.FC = () => {
  const { user } = useAuth();

  // 此時用戶一定已經認證（被 ProtectedRoute 保護）
  if (!user) return null;

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

// 使用 ProtectedRoute 包裝，避免重複認證邏輯
const SmartRedirect: React.FC = () => (
  <ProtectedRoute>
    <SmartRedirectContent />
  </ProtectedRoute>
);

function App() {
  return (
    <CustomErrorBoundary>
      <ErrorBoundary
        fallback={({ error, resetError }) => (
          <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center p-8 max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">系統錯誤</h2>
              <p className="text-gray-600 mb-4">
                {error instanceof Error ? error.message : '應用程式遇到了問題，請重試或聯繫支援。'}
              </p>
              <div className="space-x-2">
                <button
                  onClick={resetError}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  重試
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  重新載入
                </button>
              </div>
            </div>
          </div>
        )}
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
                    <Route path="/student/habits" element={
                      <RoleProtectedRoute requiredRoles={['student', 'parent', 'admin', 'mentor']}>
                        <HabitChallengePage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/student/task-habit-integration" element={
                      <RoleProtectedRoute requiredRoles={['student', 'parent', 'admin', 'mentor']}>
                        <TaskHabitIntegrationPage />
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
      </ErrorBoundary>
    </CustomErrorBoundary>
  );
}

export default App;