import React from "react";
import FavoriteRow from "./FavoriteRow";
import { useTheme } from "../context/ThemeContext";
import { lightTheme, darkTheme, type TableTheme } from "../themes/tableTheme";

interface Props {
  headers: string[];
  rows: any[];
  onDelete: (row: any) => void;
  onView?: (row: any) => void;
  fileType?: "TTScanner" | null;
}

const FavoritesTable: React.FC<Props> = ({ headers, rows, onDelete, onView, fileType }) => {
  const { theme } = useTheme();
  const currentTheme: TableTheme = theme === "dark" ? darkTheme : lightTheme;

  if (!rows?.length) {
    return (
      <p className="p-4 text-center" style={{ color: currentTheme.rowText }}>
        No favorite rows yet.
      </p>
    );
  }

  const filteredHeaders = headers.filter(
    h => !h.endsWith("Color") && !h.endsWith("DateTime") && !h.startsWith("_")
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
            <th 
              className="py-2 px-3 text-center text-sm font-semibold"
              style={theme === "light" ? { 
              backgroundColor: currentTheme.headerBg, 
              color: currentTheme.headerText 
            } : undefined}
            >
              Actions
            </th>
            {filteredHeaders.map(h => (
              <th
                key={h}
                style={theme === "light" ? {
                  backgroundColor: currentTheme.headerBg,
                  color: currentTheme.headerText,
                  borderBottom: `1px solid ${currentTheme.borderColor}`,
                } : undefined}
                className={`py-2 px-3 text-center text-sm font-semibold whitespace-nowrap ${
                  theme === "dark" ? "hover:bg-gray-700/30" : "hover:bg-gray-200"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, idx) => (
            <FavoriteRow
              key={row.row_hash ?? idx}
              row={row}
              headers={filteredHeaders}
              onDelete={onDelete}
              onView={onView}
              fileType={fileType}
              idx={idx}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FavoritesTable;