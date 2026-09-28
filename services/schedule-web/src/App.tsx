import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { ProtectedShell } from './components/Shell';
import { CreateAccountPage, LoginPage } from './pages/AuthPages';
import { CommitmentsPage } from './pages/Commitments';
import { GoalsPage } from './pages/Goals';
import { WeeklyPlanPage } from './pages/WeeklyPlan';

export function App() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const { user } = useAuth();
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={`${location.pathname}:${user ? 'signed-in' : 'signed-out'}`}
        className="route-stage"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
        transition={transition}
      >
        <Routes location={location}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/create-account" element={<CreateAccountPage />} />
          <Route element={<ProtectedShell />}>
            <Route path="/" element={<WeeklyPlanPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/commitments" element={<CommitmentsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}