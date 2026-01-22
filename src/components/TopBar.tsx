import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AlertConfigurationBar from "./AlertConfigurationBar";
import { apiPost } from "../services/api"; 
import { getUserID } from "../services/auth";
import type { FileAssociation, UserAlert } from "../pages/UserAlertsPage"; 
import { useTheme } from "../context/ThemeContext";

interface TopBarProps {
  files?: FileAssociation[];
  onNewAlert?: (alert: UserAlert) => void;
  onLogout?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ files, onNewAlert, onLogout }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const [showAlertBar, setShowAlertBar] = useState(false);

  useEffect(() => {
    const id = getUserID();
    setExternalUserId(id ? id.toString() : null);
  }, []);

  const getTitle = () => {
    switch (location.pathname) {
      case "/favorite": return "Favorites";
      case "/scan": return "Scan";
      case "/alerts": return "Alerts";
      case "/settings": return "MENT User Settings";
      default: return "MENT TTSCANNER ALGO WEB APP";
    }
  };

  const handleCreateAlert = async (alertData: any) => {
    if (!externalUserId) return;
    try {
      const res = await apiPost<{alert: number}>(`/ttscanner/custom-alert/create/${externalUserId}/`, alertData);
      const file = files?.find(f => f.id === alertData.file_association);
      const newAlert: UserAlert = {
        id: res.alert,
        file_association_id: alertData.file_association,
        file_name: file ? `${file.algo}${file.group}${file.interval}` : "Unknown",
        symbol_interval: alertData.symbol_interval,
        field_name: alertData.field_name,
        condition_type: alertData.condition_type,
        compare_value: alertData.compare_value,
        last_value: null,
        is_active: true,
      };
      onNewAlert?.(newAlert);
      setShowAlertBar(false);
    } catch (err: any) {
      console.error("Error saving alert:", err.data);
      const errorData = err.data || {};
      return errorData || { general: ["Something went wrong"] };
    }
  };

  const headerClasses = theme === "light"
    ? "bg-[#164e63] text-white p-4 rounded-t-lg flex flex-col"
    : "bg-gray-950 text-white p-4 rounded-t-lg flex flex-col";

  const navLinkClasses = (path: string) =>
    `font-bold cursor-pointer ${
      location.pathname === path ? "border-b-2 border-blue-500" : ""
    }`;

  const setAlertBtnClasses = "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded";
  const logoutBtnClasses = "bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded";

  return (
    <>
      <header className={headerClasses}>
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${theme === "light" ? "text-white" : ""}`}>
            {getTitle()}
          </h1>
          <div className="flex items-center space-x-6">
            <nav>
              <ul className="flex space-x-5">
                <li>
                  <a className={navLinkClasses("/")} onClick={() => navigate("/")}>
                    Scanner
                  </a>
                </li>
                <li>
                  <a className={navLinkClasses("/favorite")} onClick={() => navigate("/favorite")}>
                    Favorites
                  </a>
                </li>
                <li>
                  <a className={navLinkClasses("/alerts")} onClick={() => navigate("/alerts")}>
                    Alerts
                  </a>
                </li>
                <li>
                  <a className={navLinkClasses("/settings")} onClick={() => navigate("/settings")}>
                    Settings
                  </a>
                </li>
              </ul>
            </nav>

            <button onClick={() => setShowAlertBar(true)} className={setAlertBtnClasses}>
              Set New Alert +
            </button>

            {onLogout && (
              <button onClick={onLogout} className={logoutBtnClasses}>
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      {showAlertBar && (
        <AlertConfigurationBar
          isOpen={true}
          onClose={() => setShowAlertBar(false)}
          onSave={handleCreateAlert}
        />
      )}
    </>
  );
};

export default TopBar;
