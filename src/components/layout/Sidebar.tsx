import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user } = useAuth();

  const studentTabs = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: '📊' },
    { id: 'projects', label: 'โครงงานของฉัน', icon: '📁' },
    { id: 'appointments', label: 'การนัดหมาย', icon: '📅' },
    { id: 'schedule', label: 'ตารางเวลาอาจารย์', icon: '⏰' },
    { id: 'reports', label: 'รายงาน', icon: '📋' },
  ];

  const teacherTabs = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: '📊' },
    { id: 'projects', label: 'จัดการโครงงาน', icon: '📁' },
    { id: 'appointments', label: 'การนัดหมาย', icon: '📅' },
    { id: 'schedule', label: 'จัดการตารางเวลา', icon: '⏰' },
    { id: 'students', label: 'จัดการนักศึกษา', icon: '👥' },
    { id: 'reports', label: 'รายงาน', icon: '📋' },
  ];

  const tabs = user?.role === 'teacher' ? teacherTabs : studentTabs;

  return (
    <div className="w-64 bg-gray-50 border-r min-h-screen">
      <div className="p-4">
        <div className="space-y-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              className={`w-full justify-start ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="mr-3">{tab.icon}</span>
              {tab.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
