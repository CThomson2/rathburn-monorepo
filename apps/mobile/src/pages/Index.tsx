
import { useState, useEffect } from 'react';
import LoginForm from '../components/LoginForm';
import BarcodeScanner from '../components/BarcodeScanner';
import ActivityLog from '../components/ActivityLog';
import Navigation from '../components/Navigation';
import { toast } from '@/components/ui/use-toast';

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'scanner' | 'activity'>('scanner');
  
  // Handle successful login
  const handleLogin = (user: string) => {
    setIsLoggedIn(true);
    setUsername(user);
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    toast({
      description: "You have been logged out.",
    });
  };

  // Handle barcode scan
  const handleBarcodeScan = (data: string) => {
    console.log('Barcode scanned:', data);
    // In a real app, this would send data to your backend
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {!isLoggedIn ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
          <div className="mb-8">
            <svg viewBox="0 0 24 24" className="w-24 h-24 text-industrial-blue" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L3 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M20 12L3 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M20 18H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M14 3L14 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9 3L9 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <LoginForm onSuccessfulLogin={handleLogin} />
        </div>
      ) : (
        <div className="flex flex-col h-screen">
          {/* Main content area */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'scanner' ? (
              <BarcodeScanner onScan={handleBarcodeScan} />
            ) : (
              <ActivityLog />
            )}
          </div>
          
          {/* Bottom navigation */}
          <Navigation 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            onLogout={handleLogout}
          />
        </div>
      )}
    </div>
  );
};

export default Index;
