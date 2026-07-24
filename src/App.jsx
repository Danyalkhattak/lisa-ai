import { Suspense, lazy } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@clerk/clerk-react";
import { ROUTES } from "@constants/routes";

// Lazy loaded pages
const LandingPage = lazy(() => import("@pages/LandingPage"));
const SignInPage = lazy(() => import("@pages/SignInPage"));
const SignUpPage = lazy(() => import("@pages/SignUpPage"));
const CallPage = lazy(() => import("@pages/CallPage"));
const SettingsPage = lazy(() => import("@pages/SettingsPage"));
const NotFoundPage = lazy(() => import("@pages/NotFoundPage"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );
}

function PublicRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <PageLoader />;
  if (isSignedIn) return <Navigate to={ROUTES.CALL} replace />;
  return children;
}

function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <PageLoader />;
  if (!isSignedIn) return <Navigate to={ROUTES.SIGN_IN} replace />;
  return children;
}

export default function App() {
  const location = useLocation();

  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public */}
          <Route path={ROUTES.HOME} element={<LandingPage />} />
          <Route path={ROUTES.SIGN_IN} element={<PublicRoute><SignInPage /></PublicRoute>} />
          <Route path={ROUTES.SIGN_UP} element={<PublicRoute><SignUpPage /></PublicRoute>} />
          
          {/* Protected - Main */}
          <Route path={ROUTES.CALL} element={<ProtectedRoute><CallPage /></ProtectedRoute>} />
          <Route path={ROUTES.SETTINGS} element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          
          {/* 404 */}
          <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
