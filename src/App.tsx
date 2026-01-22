import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import AdminRoutes from "./routes/AdminRoutes";
import UserRoutes from "./routes/UserRoutes";
import {useTheme} from "./context/ThemeContext";
import Login from "./pages/Login";
import { getUserRole, setUserRole, clearUserRole } from "./services/auth";

function App() {
  const [role, setRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Check localStorage on app load
  useEffect(() => {
    const storedRole = getUserRole();
    if (storedRole === "admin" || storedRole === "regular") {
      setRole(storedRole);
    }
  }, []);

  const handleLogin = (roleFromLogin: string) => {
    const normalizedRole = roleFromLogin.toLowerCase();
    if (normalizedRole === "admin" || normalizedRole === "regular") {
      setRole(normalizedRole);
      setUserRole(normalizedRole);

      navigate("/");
    }
  };

  const handleLogout = () => {
    setRole(null);
    clearUserRole();
    navigate("/"); 
  };

  if (!role) {
    return (
      <Routes>
        <Route path="*" element={<Login onLogin={handleLogin} />} />
      </Routes>
    );
  }

  const ProtectedRoutes = () => {
    if (role === "admin") return <AdminRoutes />;
    if (role === "regular") return <UserRoutes onLogout={handleLogout} />;
    return <Navigate to="/" />;
  };

  return (
    <div className={`flex min-h-screen ${theme === "light" ? "bg-[#F0F8FF] text-black" : "bg-[#020617] text-white"}`}>
      {role === "admin" && <Sidebar onLogout={handleLogout} />}
      <main className="flex-1 p-6 overflow-y-auto text-white">
        <Routes>
          <Route path="*" element={<ProtectedRoutes />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
