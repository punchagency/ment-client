import React from "react";

interface Props {
  alerts: any[];
  onEdit?: (alert: any) => void;   
  onDelete?: (alert: any) => void; 
}

const UserAlertTable: React.FC<Props> = ({ alerts, onEdit, onDelete }) => {
  if (alerts.length === 0)
    return <p className="text-gray-400 text-center py-6">No alerts found</p>;

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0B1220]">
      <table className="min-w-full divide-y divide-white/5">
        <thead>
          <tr className="bg-[#111827] border-b border-white/10">
            {["ID", "File", "Sym/Int", "Field", "Condition", "Compare", "Last Value", "Status", "Actions"].map((t) => (
              <th
                key={t}
                className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider sm:px-6"
              >
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {alerts.map((alert) => (
            <tr key={alert.id} className="hover:bg-white/5">
              <td className="px-3 py-4 text-sm text-white sm:px-6">{alert.id}</td>
              <td className="px-3 py-4 text-sm text-white sm:px-6">{alert.file_name || "-"}</td>
              <td className="px-3 py-4 text-sm text-white sm:px-6">{alert.symbol_interval || "-"}</td>
              <td className="px-3 py-4 text-sm text-white sm:px-6">{alert.field_name || "-"}</td>
              <td className="px-3 py-4 text-sm text-white sm:px-6">{alert.condition_type || "-"}</td>
              <td className="px-3 py-4 text-sm text-white sm:px-6">{alert.compare_value || "-"}</td>
              <td className="px-3 py-4 text-sm text-white sm:px-6">{alert.last_value || "-"}</td>
              <td className="px-3 py-4 text-sm text-white sm:px-6">
                {alert.is_active !== undefined ? (
                  <span className={`px-2 py-1 rounded-full ${alert.is_active ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"}`}>
                    {alert.is_active ? "Active" : "Inactive"}
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full bg-purple-600/20 text-purple-400">Triggered</span>
                )}
              </td>
              <td className="px-3 py-4 sm:px-6">
                {onEdit || onDelete ? (
                  <div className="flex justify-end space-x-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(alert)}
                        className="w-7 h-7 rounded flex items-center justify-center bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                      >
                        <span className="text-blue-400 text-sm">✏</span>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(alert)}
                        className="w-7 h-7 rounded flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 transition-colors"
                      >
                        <span className="text-red-400 text-sm">🗑</span>
                      </button>
                    )}
                  </div>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserAlertTable;
