import React from "react";
import FavoriteRow from "./FavoriteRow";

interface Props {
  headers: string[];
  rows: any[];
  onDelete: (row: any) => void;
  onView: (row: any) => void;
  fileType?: "TTScanner" | null;
}

const FavoritesTable: React.FC<Props> = ({ headers, rows, onDelete, onView, fileType }) => {
  if (!rows || rows.length === 0) {
    return <p className="text-gray-400 p-4 text-center">No favorite rows yet.</p>;
  }

  const filteredHeaders = headers.filter(h => !h.endsWith("Color") && !h.endsWith("DateTime") && !h.startsWith("_"));

  return (
    <div className="overflow-x-auto rounded-md border border-gray-700">
      <table className="min-w-full border-collapse text-center">
        <thead className="bg-gray-800 sticky top-0 z-10">
          <tr>
            <th className="py-2 px-3 text-gray-300 text-sm text-center font-semibold border-b border-gray-700">
              Actions
            </th>
            {filteredHeaders.map((h, idx) => (
              <th
                key={idx}
                className="py-2 px-3 text-gray-300 text-sm font-semibold border-b border-gray-700 whitespace-nowrap"
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
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FavoritesTable;
