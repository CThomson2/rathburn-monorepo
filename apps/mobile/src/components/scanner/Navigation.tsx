
import { useEffect, useState } from 'react';

interface NavigationProps {
  activeTab: 'scanner' | 'activity';
  onTabChange: (tab: 'scanner' | 'activity') => void;
  onLogout: () => void;
}

const Navigation = ({ activeTab, onTabChange, onLogout }: NavigationProps) => {
  const [time, setTime] = useState<string>('');
  
  useEffect(() => {
    // Update time every minute
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-industrial-darkGray text-white">
      {/* Top bar with time and logout */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700">
        <div className="text-sm font-medium">{time}</div>
        <button
          onClick={onLogout}
          className="text-sm text-industrial-lightGray hover:text-white"
        >
          Logout
        </button>
      </div>
      
      {/* Bottom tabs */}
      <div className="flex border-t border-gray-700">
        <button
          onClick={() => onTabChange('scanner')}
          className={`flex-1 py-3 text-center ${
            activeTab === 'scanner' 
            ? 'text-white bg-industrial-blue' 
            : 'text-industrial-lightGray hover:bg-gray-800'
          }`}
        >
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h2m8-4v4m4-2h2m-6-4v4m-6 8v-4m12 4v-4M7 6h10a1 1 0 011 1v10a1 1 0 01-1 1H7a1 1 0 01-1-1V7a1 1 0 011-1z" />
            </svg>
            <span className="text-xs">Scanner</span>
          </div>
        </button>
        <button
          onClick={() => onTabChange('activity')}
          className={`flex-1 py-3 text-center ${
            activeTab === 'activity' 
            ? 'text-white bg-industrial-blue' 
            : 'text-industrial-lightGray hover:bg-gray-800'
          }`}
        >
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs">Activity</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Navigation;
