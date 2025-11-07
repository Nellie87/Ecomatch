import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, BarChart3, FolderKanban, Brain } from 'lucide-react';

export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'admin', path: '/admin', label: 'Admin', icon: Home },
    { id: 'review', path: '/review', label: 'Review', icon: Users },
    { id: 'analytics', path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'management', path: '/management', label: 'Management', icon: FolderKanban },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl bg-white/70 dark:bg-gray-900/70">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="tracking-tight text-gray-900 dark:text-white">ECO Match</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Human-in-the-Loop AI</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
