import React, { useState, useEffect } from "react";
import { apiGet, apiPatch, apiDelete } from "../services/api";
import UserAlertTable from "../components/UserAlertTable";
import EditUserAlertModal from "../components/EditUserAlertModal";
import TopBar from "../components/TopBar";
import { getUserID } from "../services/auth";

export interface FileAssociation {
  id: number;
  algo: string;
  group?: string;
  interval: string;
}

export interface UserAlert {
  file_association_id: number;
  id: number;
  file_name: string;
  symbol_interval: string;
  field_name: string;
  condition_type: string;
  compare_value: string;
  last_value: string | null;
  is_active: boolean;
}

interface TriggeredAlert {
  id: number;
  message: string;
  file_name: string;
  triggered_at: string;
  alert_type: "System" | "Default" | "User";
}

const UserAlertsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"active" | "logs">("active");
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [triggeredLogs, setTriggeredLogs] = useState<TriggeredAlert[]>([]);
  const [files, setFiles] = useState<FileAssociation[]>([]);
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentAlert, setCurrentAlert] = useState<UserAlert | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<UserAlert | null>(null);

  // Fetch user ID
  useEffect(() => {
    const id = getUserID();
    setExternalUserId(id ? id.toString() : null);
  }, []);
  useEffect(() => {
    if (!externalUserId) return;

    const fetchInitialData = async () => {
      try {
        const [alertsData, filesData, triggeredData] = await Promise.all([
          apiGet<any[]>(`/ttscanner/custom-alert/all/${externalUserId}/`),
          apiGet<any[]>("/ttscanner/file-associations/"),
          apiGet<any[]>(`/ttscanner/alert-logs/${externalUserId}/`)
        ]);
        console.log(triggeredData);

        const normalizedFiles: FileAssociation[] = filesData.map((f) => ({
          id: f.id,
          algo: f.algo_name,
          group: f.group_name === "-- No Group --" ? "" : f.group_name,
          interval: f.interval_name,
        }));
        setFiles(normalizedFiles);

        const alertsWithNames: UserAlert[] = alertsData.map((alert) => {
          const file = normalizedFiles.find((f) => f.id === alert.file_association);
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

        // Map triggered logs
        const logsWithNames: TriggeredAlert[] = triggeredData.map((log) => {
        const file = normalizedFiles.find((f) => f.id === log.file_association);

        const fileName =
          log.file_name ||
          (file
            ? `${file.algo}${file.group ?? ""}${file.interval}`
            : "Unknown");

        return {
          id: log.id,
          file_name: fileName,
          message: log.message,
          triggered_at: log.triggered_at,
          alert_type:
            log.alert_source === "system"
              ? "System"
              : log.alert_source === "global"
              ? "Default"
              : "User",
        };
      });


        setTriggeredLogs(logsWithNames.reverse()); 
      } catch (err) {
        console.error("Initial load failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [externalUserId]);

  // SSE for live alerts
  useEffect(() => {
    if (!externalUserId) return;

    const sseUrl = `${import.meta.env.VITE_API_URL}/ttscanner/user-alert/sse/${externalUserId}/`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) return;

      // Update active alerts
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === data.alert_id
            ? { ...alert, last_value: data.last_value, is_active: data.is_active }
            : alert
        )
      );

      // Update triggered logs if alert triggered
      if (!data.is_active) {
        const fileName = data.file_name || alerts.find((a) => a.id === data.alert_id)?.file_name || "Unknown";
        setTriggeredLogs((prev) => [
          {
            id: data.alert_id,
            file_name: fileName,
            message: data.message || `Alert triggered: ${data.last_value}`,
            triggered_at: new Date().toISOString(),
            alert_type: data.global_alert ? "Default" : "User",
          },
          ...prev,
        ]);
      }
    };

    eventSource.onerror = () => eventSource.close();
    return () => eventSource.close();
  }, [externalUserId, alerts]);

  // Save alert
  const saveAlert = async (updatedAlert: UserAlert): Promise<Record<string, string[]> | null> => {
    try {
      await apiPatch(
        `${import.meta.env.VITE_API_URL}/ttscanner/custom-alert/update/${updatedAlert.id}/`,
        updatedAlert
      );

      setAlerts((prev) =>
        prev.map((a) => (a.id === updatedAlert.id ? { ...a, ...updatedAlert } : a))
      );
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
      setAlerts((prev) => prev.filter(a => a.id !== id));
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
        onNewAlert={(alert) => setAlerts(prev => [...prev, alert])}
      />

      <div className="p-4 space-y-6">

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-white/20">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 font-semibold ${activeTab === "active" ? "border-b-2 border-blue-600 text-white" : "text-gray-400"}`}
          >
            Active Alerts
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 font-semibold ${activeTab === "logs" ? "border-b-2 border-blue-600 text-white" : "text-gray-400"}`}
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
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0B1220]">
            <table className="min-w-full divide-y divide-white/5">
              <thead>
                <tr className="bg-[#111827] border-b border-white/10">
                  {["ID", "File", "Message", "Triggered At", "Alert Type"].map((t) => (
                    <th 
                      key={t} 
                      className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider"
                    >
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {triggeredLogs.map(log => (
                  <tr
                    key={log.id + log.triggered_at}
                    className={`hover:bg-white/5 ${
                      new Date().getTime() - new Date(log.triggered_at).getTime() < 5000 
                        ? 'bg-purple-800/50 animate-pulse' 
                        : ''
                    }`}
                  >
                    <td className="px-3 py-4 text-white text-center">{log.id}</td>
                    <td className="px-3 py-4 text-white text-center">{log.file_name}</td>
                    <td className="px-3 py-4 text-white text-center">{log.message}</td>
                    <td className="px-3 py-4 text-white text-center">
                      {new Date(log.triggered_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            log.alert_type === "Default"
                              ? "bg-purple-700/20 text-purple-400"
                              : "bg-green-700/20 text-green-400"
                          }`}
                        >
                          {log.alert_type}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
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
            <div className="bg-[#111827] p-6 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-white">Confirm Deletion</h2>
              <p className="mb-4 text-white">Are you sure you want to delete alert ID "{alertToDelete.id}"?</p>
              <div className="flex justify-end space-x-2">
                <button onClick={() => setAlertToDelete(null)} className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
                <button onClick={() => deleteAlert(alertToDelete.id)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserAlertsPage;
