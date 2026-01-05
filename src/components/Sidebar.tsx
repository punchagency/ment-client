import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  onLogout: () => void; 
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', path: '/' },
  { id: 'files', label: 'File Associations', path: '/dashboard/file-associations' },
  { id: 'algos', label: 'Algos', path: '/algos' },
  { id: 'groups', label: 'Groups', path: '/groups' },
  { id: 'intervals', label: 'Intervals', path: '/intervals' },
  { id: 'alerts', label: 'Global Alerts', path: '/dashboard/global-alerts' },
];

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.path === location.pathname)?.id || 'dashboard',
    [location.pathname]
  );

  return (
    <>
      <button
        className="sm:hidden fixed top-4 left-4 z-[100] bg-[#6b5bff] text-white px-3 py-2 rounded-md shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        ☰
      </button>

      <aside
        className={`fixed top-0 left-0 h-screen bg-[#020617] border-r border-white/10 p-6 overflow-y-auto transition-transform duration-300 z-50 w-56 flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          sm:translate-x-0 sm:relative sm:z-0 sm:h-full
        `}
      >
        <div className="text-white text-2xl font-bold text-center mb-8">
          MENT Admin
        </div>

        <ul className="flex-1">
          {tabs.map((tab) => (
            <li
              key={tab.id}
              onClick={() => {
                navigate(tab.path);
                setIsOpen(false);
              }}
              className={`p-4 mb-2 rounded cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#6b5bff]/90 to-[#8b65ff]/90 shadow-md text-white ring-2 ring-[#6b5bff]/50'
                  : 'text-gray-300 hover:bg-gradient-to-r hover:from-[#6b5bff]/20 hover:to-[#8b65ff]/20'
              }`}
            >
              {tab.label}
            </li>
          ))}
        </ul>

        {/* Logout button at the bottom */}
        <button
          onClick={onLogout}
          className="mt-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded w-full transition-all"
        >
          Logout
        </button>
      </aside>

      {isOpen && (
        <div
          className="sm:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
