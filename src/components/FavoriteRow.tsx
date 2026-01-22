import React from "react";
import { useTheme } from "../context/ThemeContext";
import { lightTheme, darkTheme, type TableTheme } from "../themes/tableTheme";

interface Props {
  row: any;
  headers: string[];
  onDelete: (row: any) => void;
  onView?: (row: any) => void;
  fileType?: "TTScanner" | null;
}

const dateMap: Record<string, string> = {
  "Entry Price": "Entry DateTime",
  "Target #1": "Target #1 DateTime",
  "Target #2": "Target #2 DateTime",
  "Stop Price": "Stop DateTime",
};

const isValidColor = (value: any) =>
  typeof value === "string" && value.trim().length > 0;

// ✅ Matches FileDataTable behavior
const bgFromColor = (color: string, themeMode: "light" | "dark") => {
  const c = color.trim();

  if (themeMode === "light") {
    return `color-mix(in srgb, ${c} 50%, black 50%)`;
  }

  if (c.startsWith("#") && c.length === 7) {
    return `${c}33`;
  }

  return `color-mix(in srgb, ${c} 15%, transparent)`;
};

const FavoriteRow: React.FC<Props & { idx: number }> = ({
  row,
  headers,
  onDelete,
  fileType,
  idx,
}) => {
  const { theme: themeMode } = useTheme();
  const currentTheme: TableTheme =
    themeMode === "dark" ? darkTheme : lightTheme;

  const isTTScanner = fileType === "TTScanner";

  const renderMergedCell = (header: string) => {
    if (!isTTScanner) return row[header] ?? "-";

    const dateKey = dateMap[header];
    if (!dateKey) return row[header] ?? "-";

    const value = row[header] ?? "-";
    const dateValue = row[dateKey];
    const direction = row["Direction"] ?? row["Thrust"];
    const showDate = dateValue && direction !== "FLAT";

    return (
      <div className="flex flex-col items-center leading-tight">
        <span>{value}</span>
        {showDate && (
          <span
            className="text-xs mt-0.5"
            style={{ color: currentTheme.rowText + "80" }}
          >
            {dateValue}
          </span>
        )}
      </div>
    );
  };

  const rowBg =
    themeMode === "dark"
      ? idx % 2 === 0
        ? "#0b1220"
        : "#0f172a"
      : idx % 2 === 0
      ? "#eef2ff"
      : "#e0e7ff";

  return (
    <tr
      className="transition-all hover:brightness-110 dark:hover:brightness-125"
      style={{
        backgroundColor: rowBg,
        color: currentTheme.rowText,
        borderBottom: `1px solid ${currentTheme.borderColor}`,
        fontWeight: currentTheme.rowFontWeight,
      }}
    >
      <td
        className="py-2 px-3 flex justify-center gap-2 sticky left-0 z-10"
        style={{ backgroundColor: rowBg }}
      >
        <button
          onClick={() => onDelete(row)}
          className="text-sm px-3 py-1 rounded-md transition-all hover:scale-105"
          style={{
            backgroundColor: themeMode === "light" ? "#FEE2E2" : "#DC2626",
            color: themeMode === "light" ? "#991B1B" : "#FFFFFF",
          }}
        >
          Delete
        </button>
      </td>

      {headers.map((h, idx2) => {
        const colorCode = row[`${h} Color`];

        return (
          <td
            key={idx2}
            className="py-2 px-3 text-sm text-center whitespace-nowrap transition-all duration-300"
            style={
              isTTScanner && isValidColor(colorCode)
                ? {
                    color: colorCode,
                    backgroundColor: bgFromColor(
                      colorCode,
                      themeMode === "dark" ? "dark" : "light"
                    ),
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                  }
                : {
                    color: currentTheme.rowText,
                    backgroundColor: rowBg,
                  }
            }
          >
            {renderMergedCell(h)}
          </td>
        );
      })}
    </tr>
  );
};

export default FavoriteRow;