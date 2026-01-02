import React from "react";

interface Props {
  row: any;
  headers: string[];
  onDelete: (row: any) => void;
  onView: (row: any) => void;
  fileType?: "TTScanner" | null;
}

const dateMap: Record<string, string> = {
  "Entry Price": "Entry DateTime",
  "Target #1": "Target #1 DateTime",
  "Target #2": "Target #2 DateTime",
  "Stop Price": "Stop DateTime",
};

const FavoriteRow: React.FC<Props> = ({ row, headers, onDelete, fileType }) => {
  const isTTScanner = fileType === "TTScanner";

  const renderMergedCell = (header: string) => {
    if (!isTTScanner) return row[header] ?? "-";

    const dateKey = dateMap[header];
    if (!dateKey) return row[header] ?? "-";

    const value = row[header] ?? "-";
    const dateValue = row[dateKey];
    const direction = row["Direction"] ?? row["Thrust"];
    const showDate = dateValue && direction !== "FLAT";   //Needs Changes

    return (
      <div className="flex flex-col items-center leading-tight">
        <span>{value}</span>
        {showDate && (
          <span className="text-xs text-gray-400 mt-0.5">{dateValue}</span>
        )}
      </div>
    );
  };

  return (
    <tr className="hover:bg-gray-800/30 border-b border-gray-800">
      <td className="py-2 px-3 flex justify-center gap-2 sticky left-0 z-10 bg-gray-900">
        <button
          onClick={() => onDelete(row)}
          className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-md text-sm transition-all hover:scale-105"
        >
          Delete
        </button>
      </td>

      {headers.map((h, idx) => {
        const colorCode = row[`${h} Color`];
        return (
          <td
            key={idx}
            className="py-2 px-3 text-sm text-center whitespace-nowrap transition-all duration-300 hover:scale-105 hover:shadow-lg"
            style={
              isTTScanner && colorCode
                ? {
                    color: colorCode,
                    background: `${colorCode}33`, 
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                    boxShadow: `0 4px 10px ${colorCode}33`,
                  }
                : { color: "#D1D5DB" }
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
