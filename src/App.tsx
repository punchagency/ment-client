import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import AdminRoutes from "./routes/AdminRoutes";
import UserRoutes from "./routes/UserRoutes";
import { useTheme } from "./context/ThemeContext";
import Login from "./pages/Login";
import { getUserRole, setUserRole, clearUserRole } from "./services/auth";
import Toast from "./components/Toast"; 

interface AlertData {
  id: number;
  message: string;
  symbol?: string;
  source: "custom" | "global" | "system";
  triggered_at: string;
}

function App() {
  const [role, setRole] = useState<string | null>(null);
  // Changed to an array to support multiple toasts
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    const storedRole = getUserRole();
    if (storedRole === "admin" || storedRole === "regular") {
      setRole(storedRole);
    }
  }, []);

  // Global SSE Listener
  useEffect(() => {
    const externalUserId = localStorage.getItem("external_user_id");

    if (!role || !externalUserId) return;

    const sseUrl = `${import.meta.env.VITE_API_URL}/ttscanner/user-alert/sse/${externalUserId}/`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data: AlertData = JSON.parse(event.data);
        console.log("New Global Alert Received:", data);
        
        // Add new alert to the stack with a unique ID (timestamp)
        setAlerts((prev) => [...prev, { ...data, id: Date.now() }]);
      } catch (err) {
        console.error("Error parsing SSE data:", err);
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection lost. Reconnecting...");
    };

    return () => eventSource.close();
  }, [role]);

  const removeAlert = (id: number) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

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
    localStorage.removeItem("external_user_id");
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
    <div className={`relative flex min-h-screen ${theme === "light" ? "bg-[#F0F8FF] text-black" : "bg-[#020617] text-white"}`}>
      
      {/* Container for stacking toasts vertically */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3">
        {alerts.map((alert) => (
          <Toast
            key={alert.id}
            message={alert.message}
            type={alert.source === "global" ? "error" : "success"}
            onClose={() => removeAlert(alert.id)}
          />
        ))}
      </div>

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