import { Routes, Route } from "react-router-dom";
import UserScannerPage from "../pages/UserScannerPage";
import FavoritesPage from "../pages/FavoritesPage";
import SettingsPage from "../pages/Settings";
import UserAlertsPage from "../pages/UserAlertsPage";

interface UserRoutesProps {
  onLogout: () => void; 
}

const UserRoutes = ({ onLogout }: UserRoutesProps) => {
  return (
    <Routes>
      <Route path="/" element={<UserScannerPage onLogout={onLogout} />} />
      <Route path="/favorite" element={<FavoritesPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/alerts" element={<UserAlertsPage />} />
    </Routes>
  );
};

export default UserRoutes;
