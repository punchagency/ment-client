import React from "react";
import { useTheme } from "../context/ThemeContext";
import { lightTheme, darkTheme, type TableTheme } from "../themes/tableTheme";

interface Props {
  alerts: any[];
  onEdit?: (alert: any) => void;
  onDelete?: (alert: any) => void;
}

const UserAlertTable: React.FC<Props> = ({ alerts, onEdit, onDelete }) => {
  const { theme } = useTheme();
  const currentTheme: TableTheme = theme === "dark" ? darkTheme : lightTheme;

  if (alerts.length === 0)
    return (
      <p
        className="text-center py-6"
        style={{ color: currentTheme.rowText + "80" }}
      >
        No alerts found
      </p>
    );

  return (
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
            {[
              "ID",
              "File",
              "Sym/Int",
              "Field",
              "Condition",
              "Compare",
              "Last Value",
              "Status",
              "Actions",
            ].map((t) => (
              <th
                key={t}
                style={theme === "light" ? {
                  backgroundColor: currentTheme.headerBg,
                  color: currentTheme.headerText,
                  borderBottom: `1px solid ${currentTheme.borderColor}`,
                } : undefined}
                className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                  theme === "dark" ? "hover:bg-gray-700/30" : "hover:bg-gray-200"
                }`}
              >
                {t}
              </th>
            ))}
          </tr>
        </thead>

        {/* BODY */}
        <tbody>
          {alerts.map((alert, idx) => {
            const lightRowBg = idx % 2 === 0 ? "#eef2ff" : "#e0e7ff";
            const darkRowBg = idx % 2 === 0 ? "#0b1220" : "#0f172a";
            const rowBg = theme === "dark" ? darkRowBg : lightRowBg;

            return (
              <tr
                key={alert.id}
                className="transition-all hover:brightness-110 dark:hover:brightness-125"
                style={{
                  backgroundColor: rowBg,
                  color: currentTheme.rowText,
                  borderBottom: `1px solid ${currentTheme.borderColor}`,
                  fontWeight: currentTheme.rowFontWeight,
                }}
              >
                <td className="px-3 py-4 text-sm">{alert.id}</td>
                <td className="px-3 py-4 text-sm">{alert.file_name || "-"}</td>
                <td className="px-3 py-4 text-sm">{alert.symbol_interval || "-"}</td>
                <td className="px-3 py-4 text-sm">{alert.field_name || "-"}</td>
                <td className="px-3 py-4 text-sm">{alert.condition_type || "-"}</td>
                <td className="px-3 py-4 text-sm">{alert.compare_value || "-"}</td>
                <td className="px-3 py-4 text-sm">{alert.last_value || "-"}</td>

                {/* STATUS */}
                <td className="px-3 py-4 text-sm">
                  {alert.is_active !== undefined ? (
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: alert.is_active
                          ? "rgba(34,197,94,0.15)"
                          : "rgba(239,68,68,0.15)",
                        color: alert.is_active ? "#22c55e" : "#ef4444",
                      }}
                    >
                      {alert.is_active ? "Active" : "Inactive"}
                    </span>
                  ) : (
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: "rgba(168,85,247,0.15)",
                        color: "#a855f7",
                      }}
                    >
                      Triggered
                    </span>
                  )}
                </td>

                {/* ACTIONS */}
                <td className="px-3 py-4">
                  {onEdit || onDelete ? (
                    <div className="flex justify-end gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(alert)}
                          className="w-7 h-7 rounded flex items-center justify-center transition-all hover:scale-105"
                          style={{
                            backgroundColor: theme === "light" 
                              ? "rgba(59,130,246,0.2)" 
                              : "rgba(59,130,246,0.15)",
                            color: "#3b82f6",
                          }}
                        >
                          ✏
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(alert)}
                          className="w-7 h-7 rounded flex items-center justify-center transition-all hover:scale-105"
                          style={{
                            backgroundColor: theme === "light" 
                              ? "rgba(239,68,68,0.2)" 
                              : "rgba(239,68,68,0.15)",
                            color: "#ef4444",
                          }}
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserAlertTable;