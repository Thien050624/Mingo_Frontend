import { Navigate, useLocation } from "react-router-dom";
import { useCurrentUser } from "../../context/UserContext";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-zm-bg flex items-center justify-center">
      <span className="text-sm text-zm-muted">Đang tải...</span>
    </div>
  );
}

export function RequireAuth({ children, requireOnboarded = true }) {
  const { currentUser, loading } = useCurrentUser();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!currentUser) return <Navigate to="/login" replace state={{ from: location }} />;
  if (requireOnboarded && !currentUser.onboarded) return <Navigate to="/onboarding" replace />;
  return children;
}

export function RedirectIfAuthed({ children }) {
  const { currentUser, loading } = useCurrentUser();

  if (loading) return <LoadingScreen />;
  if (currentUser) return <Navigate to={currentUser.onboarded ? "/" : "/onboarding"} replace />;
  return children;
}
