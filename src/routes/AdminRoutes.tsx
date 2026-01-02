import { Routes, Route } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import FileAssociations from '../pages/FileAssociations';
import CreateFileAssociation from '../pages/CreateFileAssociation';
import GlobalAlertsPage from '../pages/GlobalAlertsPage';
import SendMessage from '../components/SendMessage';
import AlgosPage from '../pages/AlgosPage';
import GroupsPage from '../pages/GroupsPage';
import IntervalsPage from '../pages/IntervalsPage';
import AdminTriggeredAlerts from '../pages/TriggeredAlertsAdminPage';

export default function AdminRoutes() {
  return (
    <div className="flex min-h-screen bg-[#020617]">
      
      <main className="flex-1 p-6 overflow-y-auto text-white">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard/file-associations" element={<FileAssociations />} />
          <Route path="/create-file-association" element={<CreateFileAssociation />} />
          <Route path="/algos" element={<AlgosPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/intervals" element={<IntervalsPage />} />
          <Route path="/dashboard/global-alerts" element={<GlobalAlertsPage />} />
          <Route path="/dashboard/send-message" element={<SendMessage />} />
          <Route path="/dashboard/alert-logs" element={<AdminTriggeredAlerts/>}/>
        </Routes>
      </main>
    </div>
  );
}
