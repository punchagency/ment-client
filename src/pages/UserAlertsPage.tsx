import React, { useState, useEffect } from "react";
import { getUserID } from "../services/auth";
import { apiGet, apiPatch, apiDelete } from "../services/api";
import TopBar from "../components/TopBar";
import Toast from "../components/Toast";
import UserAlertTable from "../components/UserAlertTable";
import EditUserAlertModal from "../components/EditUserAlertModal";
import { useTheme } from "../context/ThemeContext";
import { lightTheme, darkTheme, type TableTheme } from "../themes/tableTheme";
import type { UserAlert } from "../services/UserAlert";


interface FileAssociation {
  id: number;
  algo: string;
  group: string;
  interval: string;
}

interface TriggeredAlert {
  id: number;
  file_name: string;
  message: string;
  triggered_at: string;
  alert_type: string;
}

const UserAlertsPage: React.FC = () => {
  const [toastQueue, setToastQueue] = useState<{ message: string; type: "success" | "error"; }[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "logs">("active");
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [triggeredLogs, setTriggeredLogs] = useState<TriggeredAlert[]>([]);
  const [files, setFiles] = useState<FileAssociation[]>([]);
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentAlert, setCurrentAlert] = useState<UserAlert | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<UserAlert | null>(null);

  const { theme } = useTheme();
  const currentTheme: TableTheme = theme === "dark" ? darkTheme : lightTheme;

  // Fetch user ID
  useEffect(() => {
    const id = getUserID();
    setExternalUserId(id ? id.toString() : null);
  }, []);

  // Fetch initial alerts and files only
  useEffect(() => {
    if (!externalUserId) return;

    const fetchInitialData = async () => {
      try {
        // Check if files are cached
        let cachedFiles = sessionStorage.getItem("fileAssociations");
        let normalizedFiles: FileAssociation[];

        if (cachedFiles) {
          normalizedFiles = JSON.parse(cachedFiles);
        } else {
          const filesData = await apiGet<any[]>("/ttscanner/file-associations/");
          normalizedFiles = filesData.map(f => ({
            id: f.id,
            algo: f.algo_name,
            group: f.group_name === "-- No Group --" ? "" : f.group_name,
            interval: f.interval_name,
          }));
          sessionStorage.setItem("fileAssociations", JSON.stringify(normalizedFiles));
        }

        setFiles(normalizedFiles);

        const alertsData = await apiGet<any[]>(`/ttscanner/custom-alert/all/${externalUserId}/`);
        const fileMap = new Map(normalizedFiles.map(f => [f.id, f]));

        const alertsWithNames: UserAlert[] = alertsData.map(alert => {
          const file = fileMap.get(alert.file_association);
          return {
            id: alert.id,
            file_association_id: alert.file_association,
            file_name: file ? `${file.algo}${file.group}${file.interval}` : "Unknown",
            symbol_interval: alert.symbol_interval,
            field_name: alert.field_name,
            condition_type: alert.condition_type,
            compare_value: alert.compare_value,
            last_value: alert.last_value,
            is_active: alert.is_active,
          };
        });

        setAlerts(alertsWithNames);
      } catch (err) {
        console.error("Initial load failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [externalUserId]);


  // Fetch logs only when Logs tab is clicked
  useEffect(() => {
    if (activeTab !== "logs" || triggeredLogs.length > 0 || !externalUserId) return;

    const fetchLogs = async () => {
      try {
        const logsData = await apiGet<any[]>(`/ttscanner/alert-logs/${externalUserId}/`);
        const fileMap = new Map(files.map(f => [f.id, f]));
        const logsWithNames: TriggeredAlert[] = logsData.map(log => {
          const file = fileMap.get(log.file_association);
          const fileName = log.file_name || (file ? `${file.algo}${file.group ?? ""}${file.interval}` : "Unknown");
          return {
            id: log.id,
            file_name: fileName,
            message: log.message,
            triggered_at: log.triggered_at,
            alert_type: log.alert_source === "system" ? "System" : log.alert_source === "global" ? "Default" : "User",
          };
        });

        setTriggeredLogs(logsWithNames.reverse());
      } catch (err) {
        console.error("Failed to load logs:", err);
      }
    };

    fetchLogs();
  }, [activeTab, externalUserId, files]);

  // SSE for live alerts with debouncing
  useEffect(() => {
    if (!externalUserId) return;

    const sseUrl = `${import.meta.env.VITE_API_URL}/ttscanner/user-alert/sse/${externalUserId}/`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // trigger event
      if (data?.message && data?.triggered_at) {
        setToastQueue(prev => [...prev, { message: data.message, type: data.alert_type === "system" ? "error" : "success" }]);
        setTriggeredLogs(prev => [
          {
            id: data.id,
            file_name: data.file_name ?? "Live Alert",
            message: data.message,
            triggered_at: data.triggered_at,
            alert_type:
              data.alert_type === "system"
                ? "System"
                : data.alert_type === "global"
                ? "Default"
                : "User",
          },
          ...prev,
        ]);

        return;
      }

      // snapshot update
      if (!Array.isArray(data)) return;

      setAlerts(prevAlerts =>
        prevAlerts.map(alert => {
          const updated = data.find(a => a.alert_id === alert.id);
          return updated
            ? { ...alert, last_value: updated.last_value, is_active: updated.is_active }
            : alert;
        })
      );
    };

    eventSource.onerror = () => eventSource.close();

    return () => eventSource.close();
  }, [externalUserId]); 



  // Save alert
  const saveAlert = async (updatedAlert: UserAlert): Promise<Record<string, string[]> | null> => {
    try {
      await apiPatch(
        `${import.meta.env.VITE_API_URL}/ttscanner/custom-alert/update/${updatedAlert.id}/`,
        updatedAlert
      );
      setAlerts(prev => prev.map(a => a.id === updatedAlert.id ? { ...a, ...updatedAlert } : a));
      setModalOpen(false);
      return null;
    } catch (err: any) {
      console.error("Failed to update alert", err);
      return err?.data || { general: ["Failed to update alert."] };
    }
  };

  // Delete alert
  const deleteAlert = async (id: number) => {
    try {
      await apiDelete(`${import.meta.env.VITE_API_URL}/ttscanner/custom-alert/delete/${id}/`);
      setAlerts(prev => prev.filter(a => a.id !== id));
      setAlertToDelete(null);
    } catch (err) {
      console.error("Failed to delete alert", err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <>
      <TopBar
        files={files}
        onNewAlert={alert => setAlerts(prev => [...prev, alert])}
      />

      <div className="p-4 space-y-6">
        {/* Tabs */}
        <div className="flex space-x-4 border-b" style={{ borderColor: currentTheme.borderColor }}>
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 font-semibold ${activeTab === "active" ? "border-b-2 border-blue-600" : ""}`}
            style={{
              color: activeTab === "active" 
                ? (theme === "light" ? "#1e40af" : "#ffffff")
                : (theme === "light" ? "#6b7280" : "#9ca3af"),
              borderColor: activeTab === "active" ? "#2563eb" : "transparent",
            }}
          >
            Active Alerts
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 font-semibold ${activeTab === "logs" ? "border-b-2 border-blue-600" : ""}`}
            style={{
              color: activeTab === "logs" 
                ? (theme === "light" ? "#1e40af" : "#ffffff")
                : (theme === "light" ? "#6b7280" : "#9ca3af"),
              borderColor: activeTab === "logs" ? "#2563eb" : "transparent",
            }}
          >
            Alert Logs
          </button>
        </div>

        {/* Active Alerts */}
        {activeTab === "active" && (
          <UserAlertTable
            alerts={alerts.filter(a => a.is_active)}
            onEdit={(alert) => { setCurrentAlert(alert); setModalOpen(true); }}
            onDelete={(alert) => setAlertToDelete(alert)}
          />
        )}

        {/* Triggered Logs */}
        {activeTab === "logs" && (
          <div 
            className="w-full overflow-auto rounded-lg"
            style={{ border: `1px solid ${currentTheme.borderColor}` }}
          >
            <table className="min-w-full border-collapse">
              <thead
                style={theme === "light" ? { 
                  backgroundColor: currentTheme.headerBg, 
                  color: currentTheme.headerText 
                } : undefined}
              >
                <tr>
                  {["ID", "File", "Message", "Triggered At", "Alert Type"].map(t => (
                    <th
                      key={t}
                      style={theme === "light" ? {
                        backgroundColor: currentTheme.headerBg,
                        color: currentTheme.headerText,
                        borderBottom: `1px solid ${currentTheme.borderColor}`,
                      } : undefined}
                      className={`px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                        theme === "dark" ? "hover:bg-gray-700/30" : "hover:bg-gray-200"
                      }`}
                    >
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {triggeredLogs.map((log, idx) => {
                  const lightRowBg = idx % 2 === 0 ? "#eef2ff" : "#e0e7ff";
                  const darkRowBg = idx % 2 === 0 ? "#0b1220" : "#0f172a";
                  const rowBg = theme === "dark" ? darkRowBg : lightRowBg;

                  const isRecent = new Date().getTime() - new Date(log.triggered_at).getTime() < 5000;

                  return (
                    <tr
                      key={log.id + log.triggered_at}
                      className={`transition-all hover:brightness-110 dark:hover:brightness-125 ${isRecent ? 'animate-pulse' : ''}`}
                      style={{
                        backgroundColor: isRecent 
                          ? (theme === "light" ? "rgba(168, 85, 247, 0.2)" : "rgba(168, 85, 247, 0.3)")
                          : rowBg,
                        color: currentTheme.rowText,
                        borderBottom: `1px solid ${currentTheme.borderColor}`,
                        fontWeight: currentTheme.rowFontWeight,
                      }}
                    >
                      <td className="px-3 py-4 text-sm text-center">{log.id}</td>
                      <td className="px-3 py-4 text-sm text-center">{log.file_name}</td>
                      <td className="px-3 py-4 text-sm text-center">{log.message}</td>
                      <td className="px-3 py-4 text-sm text-center">{new Date(log.triggered_at).toLocaleString()}</td>
                      <td className="px-3 py-4 text-center">
                        <div className="flex justify-center items-center">
                          <span 
                            className="px-3 py-1 text-xs font-medium rounded-full"
                            style={{
                              backgroundColor: log.alert_type === "Default" 
                                ? (theme === "light" ? "rgba(168, 85, 247, 0.15)" : "rgba(168, 85, 247, 0.25)")
                                : (theme === "light" ? "rgba(34, 197, 94, 0.15)" : "rgba(34, 197, 94, 0.25)"),
                              color: log.alert_type === "Default" ? "#a855f7" : "#22c55e",
                            }}
                          >
                            {log.alert_type}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Modal */}
        {modalOpen && currentAlert && (
          <EditUserAlertModal
            alert={currentAlert}
            files={files}
            onClose={() => setModalOpen(false)}
            onSave={saveAlert}
          />
        )}

        {/* Delete Confirmation */}
        {alertToDelete && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 px-4">
            <div 
              className="p-6 rounded-lg shadow-lg w-full max-w-md"
              style={{
                backgroundColor: theme === "light" ? "#ffffff" : "#111827",
                color: theme === "light" ? "#111827" : "#f9fafb",
              }}
            >
              <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
              <p className="mb-4">Are you sure you want to delete alert ID "{alertToDelete.id}"?</p>
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => setAlertToDelete(null)}
                  style={{
                    backgroundColor: theme === "light" ? "#e5e7eb" : "#4b5563",
                    color: theme === "light" ? "#374151" : "#f9fafb",
                  }}
                  className="px-4 py-2 rounded hover:opacity-90"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteAlert(alertToDelete.id)}
                  style={{
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                  }}
                  className="px-4 py-2 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {toastQueue.length > 0 && (
        <Toast
          message={toastQueue[0].message}
          type={toastQueue[0].type}
          onClose={() => setToastQueue(prev => prev.slice(1))}
        />
      )}
    </>
  );
};

export type { FileAssociation, UserAlert };

export default UserAlertsPage;