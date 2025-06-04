import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext.tsx';
import Login from './pages/Login';
import StudentDashboard from './pages/student/StudentDashboard';
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
import { CurriculumProvider } from './context/CurriculumContext';
import StudentPlanning from './pages/student/StudentPlanning';
import GoalMindMapPage from './pages/student/GoalMindMapPage';
import LottiePreview from './pages/preview/LottiePreview';
import { StudentLearningMap } from './pages/student/StudentLearningMap';

function App() {
  return (
    <CurriculumProvider>
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Preview Routes */}
            <Route path="/preview/lottie" element={<LottiePreview />} />
            
            {/* Student Routes */}
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/schedule" element={<StudentSchedule />} />
            <Route path="/student/tasks" element={<StudentTasks />} />
            <Route path="/student/planning" element={<StudentPlanning />} />
            <Route path="/student/planning/goal/:goalId" element={<GoalMindMapPage />} />
            <Route path="/student/journal" element={<StudentJournal />} />
            <Route path="/student/goals" element={<StudentGoals />} />
            <Route path="/student/learning-map" element={<StudentLearningMap />} />
            <Route path="/student/subject/:subjectId" element={<SubjectPage />} />
            
            {/* Mentor Routes */}
            <Route path="/mentor" element={<MentorDashboard />} />
            <Route path="/mentor/tasks" element={<MentorTaskManager />} />
            <Route path="/mentor/task-planner" element={<MentorTaskPlanner />} />
            <Route path="/mentor/subject/:subjectId" element={<SubjectPage isMentor={true} />} />
            <Route path="/mentor/curriculum" element={<MentorCurriculum />} />
            
            {/* Default and Not Found Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </UserProvider>
    </CurriculumProvider>
  );
}

export default App;