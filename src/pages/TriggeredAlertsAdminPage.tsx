import React, { useEffect, useState } from "react";
import { apiGet } from "../services/api";

interface TriggeredAlert {
  id: number;
  file_association: number; 
  message: string;
  triggered_at: string;
  alert_source: string;
}

const TriggeredAlertsAdmin: React.FC = () => {
  const [alerts, setAlerts] = useState<TriggeredAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res: any = await apiGet(
          `${import.meta.env.VITE_API_URL}/ttscanner/alert-logs/admin/`
        );
        console.log("API response:", res);

        setAlerts(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Failed to fetch triggered alerts:", err);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  if (loading)
    return (
      <p className="text-gray-400 p-4 text-center">Loading triggered alerts...</p>
    );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4 text-gray-100">
        Triggered Alerts
      </h1>

      <div className="overflow-auto border border-gray-700 rounded-lg">
        <table className="min-w-full text-center border-collapse">
          <thead className="bg-gray-800 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">
                ID
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">
                File ID
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">
                Message
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">
                Triggered At
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">
                Alert Source
              </th>
            </tr>
          </thead>

          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-gray-400"
                >
                  No triggered alerts found.
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr
                  key={alert.id}
                  className="hover:bg-gray-800/30 border-b border-gray-700"
                >
                  <td className="px-4 py-2 text-sm text-gray-100">{alert.id}</td>
                  <td className="px-4 py-2 text-sm text-gray-100">
                    {alert.file_association}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-100">{alert.message}</td>
                  <td className="px-4 py-2 text-sm text-gray-100">
                    {new Date(alert.triggered_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-100">{alert.alert_source}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TriggeredAlertsAdmin;
