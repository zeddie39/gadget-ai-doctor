import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen glass p-6 flex items-center justify-center">
      <div className="text-center">
        <h1 className="hero-title">404</h1>
        <p className="subtle-muted mt-1">Oops! Page not found</p>
        <a
          href="/"
          className="nav-pill text-blue-500 hover:text-blue-700 underline"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
