import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../services/api';
import Card from '../components/Card';

interface DashboardCounts {
  totalFiles: number;
  totalAlerts: number;
  totalTriggeredAlerts: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [count, setCounts] = useState<DashboardCounts>({
    totalFiles: 0,
    totalAlerts: 0,
    totalTriggeredAlerts: 0
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        //Needs Changes
        const [files, alerts, triggeredCount] = await Promise.all([
          apiGet<{ totalFiles: number }>("/ttscanner/file-count/admin/"),
          apiGet<{ totalAlerts: number }>("/ttscanner/global-alert-count/admin/"),
          apiGet<{ totalTriggeredAlerts: number }>("/ttscanner/alert-count/admin/"),
        ]);

        setCounts({
          totalFiles: files.totalFiles,
          totalAlerts: alerts.totalAlerts,
          totalTriggeredAlerts: triggeredCount.totalTriggeredAlerts,
        });
      } catch (err) {
        console.log("Error fetching dashboard counts:", err);
      }
    };

    fetchCounts();
  }, []);

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          icon="📁"
          title="Total File Associations"
          value={count.totalFiles}
          buttonText="View Files"
          onClick={() => navigate("/dashboard/file-associations")}
        />
        <Card
          icon="⚡"
          title="Total Alerts"
          value={count.totalAlerts}
          buttonText="View Alerts"
          onClick={() => navigate("/dashboard/global-alerts")}
        />        
        <Card
          icon="💬"
          title="Make an Announcment"
          buttonText="Write a Message"
          onClick={() => navigate("/dashboard/send-message")}
        />
        <Card
          icon="✔️"
          title="Total Triggered Alerts"
          value={count.totalTriggeredAlerts}
          buttonText="View Triggered Alerts"
          onClick={() => navigate("/dashboard/alert-logs")}
        />
      </div>
    </>
  );
};

export default Dashboard;
