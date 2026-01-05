import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AlertConfigurationBar from "./AlertConfigurationBar";
import { apiPost } from "../services/api"; 
import { getUserID } from "../services/auth";
import type { FileAssociation } from "../pages/UserAlertsPage";
import type { UserAlert } from "../pages/UserAlertsPage"; 

interface TopBarProps {
  files?: FileAssociation[];
  onNewAlert?: (alert: UserAlert) => void;
  onLogout?: () => void; // <- added
}

const TopBar: React.FC<TopBarProps> = ({ files, onNewAlert, onLogout }) => {
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
      console.error("Error saving alert:", err);
      const errorData = err.response?.data || {};
      return errorData || { general: ["Something went wrong"] };
    }
  };

  return (
    <>
      <header className="bg-gray-950 p-4 rounded-t-lg flex flex-col">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{getTitle()}</h1>
          <div className="flex items-center space-x-6">
            <nav>
              <ul className="flex space-x-5">
                <li>
                  <a
                    className={`font-bold cursor-pointer ${location.pathname === "/" ? "border-b-2 border-blue-500" : ""}`}
                    onClick={() => navigate("/")}
                  >Scanner</a>
                </li>
                <li>
                  <a
                    className={`font-bold cursor-pointer ${location.pathname === "/favorite" ? "border-b-2 border-blue-500" : ""}`}
                    onClick={() => navigate("/favorite")}
                  >Favorites</a>
                </li>
                <li>
                  <a
                    className={`font-bold cursor-pointer ${location.pathname === "/alerts" ? "border-b-2 border-blue-500" : ""}`}
                    onClick={() => navigate("/alerts")}
                  >Alerts</a>
                </li>
                <li>
                  <a
                    className={`font-bold cursor-pointer ${location.pathname === "/settings" ? "border-b-2 border-blue-500" : ""}`}
                    onClick={() => navigate("/settings")}
                  >Settings</a>
                </li>
              </ul>
            </nav>

            <button
              onClick={() => setShowAlertBar(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Set New Alert +
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
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
