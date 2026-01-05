import axios from "axios";

export const fetchFavoriteRows = async (external_user_id: string) => {
  const res = await axios.get(`${import.meta.env.VITE_API_URL}/ttscanner/fav-row-list/${external_user_id}/`);
  console.log(res);
  return res.data;
};

export const deleteFavorite = async (favoriteId: string) => {
  await axios.delete(`${import.meta.env.VITE_API_URL}/ttscanner/fav-row/delete/${favoriteId}/`);
};

export const fetchFavoriteRowDetail = async (rowhash: string) => {
  const res = await axios.get(`${import.meta.env.VITE_API_URL}/ttscanner/fav-row-detail/${rowhash}/`)
  return res.data;
};
