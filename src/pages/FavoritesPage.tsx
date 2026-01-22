import React, { useEffect, useState } from "react";
import { getUserID } from "../services/auth";
import { fetchFavoriteRows, deleteFavorite } from "../services/favorites";
import FavoritesTable from "../components/FavoritesTable";
import TopBar from "../components/TopBar";
import Toast from "../components/Toast";
import { useTheme } from "../context/ThemeContext";

interface FavoriteRowType {
  row_hash: string;
  favorite_id: string;
  [key: string]: any;
}

interface FavoriteBatch {
  file_association_id: string;
  file_association_name: string;
  headers: string[];
  rows: FavoriteRowType[];
}

const FavoritesPage: React.FC = () => {
  const { theme } = useTheme();

  const [userId, setUserId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteBatch[] | null>(null); 
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load user ID
  useEffect(() => {
    const id = getUserID();
    setUserId(id ? id.toString() : null);
  }, []);

  // Load favorites for the user
  useEffect(() => {
    if (!userId) return;

    setFavorites(null); 
    setError(null);

    fetchFavoriteRows(userId)
      .then((data) => setFavorites(data))
      .catch(() => {
        setFavorites([]);
        setError("Failed to load favorites.");
      });
  }, [userId]);

  const handleDelete = async (row: FavoriteRowType) => {
    if (!row.favorite_id) return;

    try {
      await deleteFavorite(row.favorite_id);

      setFavorites((prev) =>
        prev
          ? prev
              .map((batch) => ({
                ...batch,
                rows: batch.rows.filter((r) => r.favorite_id !== row.favorite_id),
              }))
              .filter((batch) => batch.rows.length > 0)
          : prev
      );

      setToastMessage({ text: "Favorite deleted!", type: "success" });
    } catch {
      setToastMessage({ text: "Failed to delete favorite!", type: "error" });
    }
  };

  const handleView = (row: FavoriteRowType) => {
    window.dispatchEvent(
      new CustomEvent("view-favorite-row", { detail: row.row_hash })
    );
  };

  return (
    <>
      <TopBar />

      <div className="p-4">
        {/* Loading state */}
        {favorites === null && (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mb-4"></div>
            <span className="text-gray-400">Loading favorites...</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center p-8 border-2 border-red-400 rounded-lg text-red-500">
            {error}
          </div>
        )}

        {/* Empty state */}
        {favorites !== null && favorites.length === 0 && !error && (
          <div className="text-center p-8 border-2 border-dashed border-gray-600 rounded-lg">
            <p className="text-gray-400 mb-2 text-lg">No favorite rows yet</p>
            <p className="text-gray-500 text-sm">Add favorites to see them here.</p>
          </div>
        )}

        {/* Favorites present */}
        {favorites !== null && favorites.length > 0 &&
          favorites.map((batch) => (
            <div key={batch.file_association_id} className="mb-8">
              <h2
                className="text-lg font-semibold mb-2"
                style={{
                  color: theme === "light" ? "#164e63" : "#e5e7eb", // Light blue shade for light theme
                }}
              >
                Table: {batch.file_association_name}
              </h2>
              <FavoritesTable
                headers={batch.headers}
                rows={batch.rows}
                onDelete={handleDelete}
                onView={handleView}
                fileType="TTScanner"
              />
            </div>
          ))
        }

        {/* Toast messages */}
        {toastMessage && (
          <Toast
            message={toastMessage.text}
            type={toastMessage.type}
            onClose={() => setToastMessage(null)}
          />
        )}
      </div>
    </>
  );
};

export default FavoritesPage;
