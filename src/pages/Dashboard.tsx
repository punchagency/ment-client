import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../services/api';
import Card from '../components/Card';

interface DashboardCounts {
  totalFiles: number;
  totalAlerts: number;
  totalTriggeredAlerts: number;
}

interface FileAssociation {
  id: number;
  algo: string;
  group?: string;
  interval: string;
}

interface Alert {
  id: number;
  name: string;
  field: string;
  condition: string;
  value: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [count, setCounts] = useState<DashboardCounts>({ totalFiles: 0, totalAlerts: 0, totalTriggeredAlerts: 0 });

  useEffect(() => {
  const fetchCounts = async () => {
    try {
      const [files, alerts, triggeredAlerts] = await Promise.all([
        apiGet<FileAssociation[]>("/ttscanner/file-associations/"),
        apiGet<Alert[]>("/ttscanner/global-alert/all/"),
        apiGet<Alert[]>("/ttscanner/alert-logs/admin/"),
      ]);
      setCounts({ totalFiles: files.length, totalAlerts: alerts.length, totalTriggeredAlerts: triggeredAlerts.length });
    } catch (err) {
      console.log(err);
    }
  };
  fetchCounts();
}, []);


  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card icon="📁" title="Total File Associations" value={count.totalFiles} buttonText="View Files" onClick={() => navigate("/dashboard/file-associations")}/>
        <Card icon="⚡" title="Total Alerts" value={count.totalAlerts} buttonText="View Alerts" onClick={() => navigate("/dashboard/global-alerts")}/>        
        <Card icon="💬" title="Make an Announcment" buttonText="Write a Message" onClick={() => navigate("/dashboard/send-message")}/>
        <Card icon="✔️" title="Total Triggered Alerts" value={count.totalTriggeredAlerts} buttonText="View Triggered Alerts" onClick={() => navigate("/dashboard/alert-logs")} />
      </div>
    </>
  );
};

export default Dashboard;