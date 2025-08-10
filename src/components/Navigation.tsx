import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Trophy, Home } from 'lucide-react';

const Navigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            <Link to="/" className="text-xl font-bold text-gray-900">
              테니스 대진표
            </Link>
          </div>
          
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') && location.pathname === '/'
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home className="h-4 w-4" />
              홈
            </Link>
            
            <Link
              to="/groups"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/groups')
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="h-4 w-4" />
              그룹 관리
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;