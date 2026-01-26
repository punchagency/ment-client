import React, { useState, useEffect, useMemo } from "react";
import Toast from "../components/Toast";
import { getUserID } from "../services/auth";
import { fetchFavoriteRows } from "../services/favorites";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import { lightTheme, darkTheme, type TableTheme } from "../themes/tableTheme";


interface Props {
  rows: any[];
  updatedRowIds?: Set<number>;
  fileAssociationId: string | number;
  fileType?: string | null;
  visibleColumns?: string[];
}

type SortDirection = "asc" | "desc" | null;

interface ToastMessage {
  text: string;
  type: "success" | "error";
}

const normalizeKey = (s: any) =>
  String(s ?? "").replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();

const isValidColor = (value: any): boolean => {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (!v) return false;
  return (
    v.startsWith("#") ||
    v.startsWith("rgb(") ||
    v.startsWith("rgba(") ||
    v.startsWith("hsl(") ||
    v.startsWith("hsla(") ||
    /^[a-zA-Z]+$/.test(v)
  );
};

const bgFromColor = (color: string) => {
  const c = color.trim();
  if (c.startsWith("#")) {
    if (c.length === 4) {
      const r = c[1],
        g = c[2],
        b = c[3];
      return `#${r}${r}${g}${g}${b}${b}33`;
    }
    if (c.length === 7) return `${c}33`;
  }
  return `color-mix(in srgb, ${c} 20%, transparent)`;
};

const FileDataTable: React.FC<Props> = ({
  rows: data,
  updatedRowIds = new Set(),
  fileAssociationId,
  fileType,
  visibleColumns,
}) => {
  const { theme } = useTheme();
  const currentTheme: TableTheme = theme === "dark" ? darkTheme : lightTheme;

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection } | null>(null);
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const [favorites, setFavorites] = useState<Record<string, number | null>>({});

  const rowKeyMap = useMemo(() => {
    const wm = new WeakMap<any, Record<string, any>>();
    for (const row of data) {
      const m: Record<string, any> = {};
      for (const [k, v] of Object.entries(row ?? {})) {
        m[normalizeKey(k)] = v;
      }
      wm.set(row, m);
    }
    return wm;
  }, [data]);

  const headers = useMemo(() => {
    if (!data.length) return [];
    const keys = Object.keys(data[0] ?? {});
    const baseHeaders = keys.filter(k => !normalizeKey(k).endsWith(" Color") && !k.startsWith("_"));
    if (!visibleColumns?.length) return baseHeaders;
    const visibleSet = new Set(visibleColumns.map(normalizeKey));
    return baseHeaders.filter(h => visibleSet.has(normalizeKey(h)));
  }, [data, visibleColumns]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const id = getUserID();
        setExternalUserId(id ? id.toString() : null);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!externalUserId) return;
    const loadFavorites = async () => {
      try {
        const groups = await fetchFavoriteRows(externalUserId);
        const favoriteRows = groups.flatMap((group: any) => group.rows || []);
        const favMap: Record<string, number | null> = {};
        favoriteRows.forEach((fav: any) => {
          const matchingRow = data.find(r => String(r._row_hash).trim() === String(fav.row_hash).trim());
          if (matchingRow) {
            const symIntKey = Object.keys(matchingRow).find(
              (key) => key.toLowerCase().includes("sym") && key.toLowerCase().includes("int")
            );
            if (symIntKey) favMap[matchingRow[symIntKey]] = fav.favorite_id;
          }
        });
        setFavorites(favMap);
      } catch (err) {
        console.error("Failed to load favorite rows", err);
      }
    };
    loadFavorites();
  }, [externalUserId, data]);

  const toggleFavorite = async (row: any) => {
    if (!externalUserId) return;
    
    const symIntKey = Object.keys(row).find(
      (key) => key.toLowerCase().includes("sym") && key.toLowerCase().includes("int")
    );
    
    if (!symIntKey) {
      setToastMessage({ text: "Cannot favorite: Sym/Int missing", type: "error" });
      return;
    }

    const symInt = row[symIntKey];
    const favId = favorites[symInt];

    // --- OPTIMISTIC UPDATE START ---
    // Capture the old state in case we need to roll back
    const previousFavorites = { ...favorites };

    setFavorites(prev => {
      const newFavs = { ...prev };
      if (!favId) {
        // Optimistically add a temporary ID (e.g., -1) so the star turns yellow
        newFavs[symInt] = -1; 
      } else {
        // Optimistically remove it
        delete newFavs[symInt];
      }
      return newFavs;
    });
    // --- OPTIMISTIC UPDATE END ---

    try {
      if (!favId) {
        // Actual API Call
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/ttscanner/fav-row/create/${fileAssociationId}/`,
          { external_user_id: externalUserId, sym_int: symInt }
        );
        
        // Update with the REAL ID from the database
        setFavorites(prev => ({ 
          ...prev, 
          [symInt]: res.data.id ?? res.data.favorite_id 
        }));
        setToastMessage({ text: "Added to favorites!", type: "success" });
      } else {
        // Actual API Call
        await axios.delete(`${import.meta.env.VITE_API_URL}/ttscanner/fav-row/delete/${favId}/`);
        setToastMessage({ text: "Removed from favorites!", type: "error" });
        // No need to update state here, we already removed it optimistically
      }
    } catch (err) {
      console.error("Favorite action failed:", err);
      // ROLLBACK: If the server fails, revert to the previous state
      setFavorites(previousFavorites);
      setToastMessage({ text: "Server error: Action failed!", type: "error" });
    }
  };

  const getSemanticPriority = (val: any): number => {
    if (!val) return -Infinity;
    switch (String(val).trim()) {
      case "BULLISH": return 7;
      case "Bullish": return 6;
      case "LONG": return 5;
      case "SHORT": return 4;
      case "Neutral": return 3;
      case "FLAT": return 2;
      case "bearish": return 1;
      case "BEARISH": return 0;
      default: return -Infinity;
    }
  };

  const getRangePriority = (val: any): number => {
    switch (val) {
      case "Contraction": return 0;
      case "Normal Range": return 1;
      case "Expansion": return 2;
      default: return -Infinity;
    }
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    const { key, direction } = sortConfig;
    return [...data].sort((a, b) => {
      const valA = a[key], valB = b[key];
      if (valA == null || valA === "") return 1;
      if (valB == null || valB === "") return -1;
      const numA = parseFloat(valA), numB = parseFloat(valB);
      if (!isNaN(numA) && !isNaN(numB)) return direction === "asc" ? numA - numB : numB - numA;
      const priA = getSemanticPriority(valA), priB = getSemanticPriority(valB);
      if (priA !== -Infinity && priB !== -Infinity) return direction === "asc" ? priA - priB : priB - priA;
      const rangeA = getRangePriority(valA), rangeB = getRangePriority(valB);
      if (rangeA !== -Infinity && rangeB !== -Infinity) return direction === "asc" ? rangeA - rangeB : rangeB - rangeA;
      return direction === "asc" ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  }, [data, sortConfig]);

  const handleSort = (header: string) => {
    if (sortConfig?.key === header) {
      setSortConfig({ key: header, direction: sortConfig.direction === "asc" ? "desc" : "asc" });
    } else setSortConfig({ key: header, direction: "asc" });
  };

  const resetSort = () => setSortConfig(null);
  const getSortIcon = (header: string) =>
    sortConfig?.key !== header ? "⬍" : sortConfig.direction === "asc" ? "🔼" : "🔽";

  const isTTScanner = fileType === "TTScanner";
  const dateMap: Record<string, string> = {
    "Entry Price": "Entry DateTime",
    "Target #1": "Target #1 DateTime",
    "Target #2": "Target #2 DateTime",
    "Stop Price": "Stop DateTime",
  };
  const shouldSkipColumn = (header: string) => isTTScanner && normalizeKey(header).endsWith("DateTime");

  const renderMergedCell = (row: any, header: string) => {
    let value = row[header];
    if (value == null) value = "-";
    else if (typeof value === "object") value = JSON.stringify(value);
    if (!isTTScanner) return value;
    const dateKey = dateMap[normalizeKey(header)];
    if (!dateKey) return value;
    const dateValue = row[dateKey];
    const direction = row["Direction"] ?? row["Thrust"];
    const showDate = dateValue && direction !== "FLAT";
    return (
      <div className="flex flex-col items-center leading-tight">
        <span>{value}</span>
        {showDate && <span className="text-xs text-gray-400 mt-0.5">{dateValue}</span>}
      </div>
    );
  };

  const getCellStyle = (row: any, header: string) => {
    const m = rowKeyMap.get(row);
    if (!m) return {};

    const colorKey = normalizeKey(header + " Color");
    const color = m[colorKey];
    if (!isValidColor(color)) return {};

    const c = String(color).trim();
    let bgColor = bgFromColor(c);
    if (theme === "light") {
      bgColor = `color-mix(in srgb, ${c} 50%, black 50%)`;
    }

    return {
      color: c,
      backgroundColor: bgColor,
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
    };
  };

  if (!data.length)
    return <p style={{ color: currentTheme.rowText }} className="p-4 text-center text-lg">No data available</p>;

  return (
    <div className="w-full overflow-auto rounded-lg" style={{ border: `1px solid ${currentTheme.borderColor}` }}>
      <table className="min-w-full border-collapse">
        <thead
          style={theme === "light" ? { backgroundColor: currentTheme.headerBg, color: currentTheme.headerText } : undefined}
        >
          <tr>
            <th className="py-2 px-3 text-center text-sm font-semibold" style={{ borderBottom: `1px solid ${currentTheme.borderColor}` }}>
              <div className="flex items-center justify-center gap-2">
                {sortConfig && (
                  <button
                  onClick={e => { e.stopPropagation(); resetSort(); }}
                  title="Reset sorting"
                  className={`
                    transition-all duration-200 ease-in-out
                    hover:scale-110 active:scale-95
                    rounded-md px-2 py-1
                    ${theme === "light"
                      ? "text-gray-200 bg-[#164e63] hover:bg-gray-600"
                      : "text-gray-200 bg-gray-700 hover:bg-gray-600"}
                  `}
                >
                  ⟲
                </button>

                )}
              </div>
            </th>
            {headers.map(h => !shouldSkipColumn(h) && (
              <th
                key={h}
                onClick={() => handleSort(h)}
                style={theme === "light" ? {
                  backgroundColor: currentTheme.headerBg,
                  color: currentTheme.headerText,
                  borderBottom: `1px solid ${currentTheme.borderColor}`,
                } : undefined}
                className={`py-2 px-3 text-center text-sm font-semibold cursor-pointer whitespace-nowrap ${
                  theme === "dark" ? "hover:bg-gray-700/30" : "hover:bg-gray-200"
                }`}
              >
                {h} {getSortIcon(h)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
        {sortedData.map((row, idx) => {
          const symIntKey = Object.keys(row).find(
            k => k.toLowerCase().includes("sym") && k.toLowerCase().includes("int")
          );
          const isFavorite = symIntKey && favorites[row[symIntKey]];

          // Light theme: soft blue striping
          const lightRowBg =
            idx % 2 === 0 ? "#eef2ff" : "#e0e7ff";

          // Dark theme: deep blue / navy striping
          const darkRowBg =
            idx % 2 === 0 ? "#0b1220" : "#0f172a";

          const baseRowBg =
            theme === "dark" ? darkRowBg : lightRowBg;

          return (
            <tr
                key={idx}
                className="transition-all hover:brightness-110 dark:hover:brightness-125"
                style={{
                  backgroundColor: updatedRowIds.has(idx)
                    ? "#0D1222"
                    : baseRowBg,
                  color: currentTheme.rowText,
                  borderBottom: `1px solid ${currentTheme.borderColor}`,
                }}
              >
              <td
                className="py-2 px-3 text-center cursor-pointer transition-all duration-300"
                onClick={() => toggleFavorite(row)}
                style={{ color: isFavorite ? "#facc15" : "#9ca3af" }}
              >
                {isFavorite ? "★" : "☆"}
              </td>

              {headers.map(h =>
                !shouldSkipColumn(h) ? (
                  <td
                    key={h}
                    className={`py-2 px-3 text-sm text-center whitespace-nowrap transition-all duration-300 hover:scale-105 hover:shadow-lg font-${currentTheme.rowFontWeight ?? "normal"}`}
                    style={{
                      color: currentTheme.rowText,
                      backgroundColor: baseRowBg,
                      ...getCellStyle(row, h),
                    }}
                  >
                    {renderMergedCell(row, h)}
                  </td>
                ) : null
              )}
            </tr>
          );
        })}
      </tbody>
      </table>

      {toastMessage && (
        <Toast
          message={toastMessage.text}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};

export default FileDataTable;
