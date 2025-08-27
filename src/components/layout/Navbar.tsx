import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              ระบบจัดการการนัดหมาย
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="text-sm text-gray-700">
                  สวัสดี, {user.first_name} {user.last_name}
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {user.role === 'teacher' ? 'อาจารย์' : 'นักศึกษา'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="text-sm"
                >
                  ออกจากระบบ
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
