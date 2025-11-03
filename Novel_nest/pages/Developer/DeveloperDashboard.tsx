
import React from 'react';
import DashboardCard from '../../components/DashboardCard';
import { BookOpenIcon, SearchIcon } from '../../components/icons';

const MetricBar: React.FC<{ label: string; value: string; percentage: number; colorClass: string }> = ({ label, value, percentage, colorClass }) => (
    <div>
        <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{value}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
        </div>
    </div>
);

const DeveloperDashboard: React.FC = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Developer Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard title="Database Size" value="0.7TB" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7a8 4 0 0116 0" /></svg>} />
        <DashboardCard title="Total Records" value="585" icon={<BookOpenIcon className="w-8 h-8"/>} />
        <DashboardCard title="Transactions" value="36,447" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8.001 0 0115.357-2m0 0H15" /></svg>} />
        <DashboardCard title="User Content" value="6,749" icon={<SearchIcon className="w-8 h-8"/>} />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Server Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricBar label="CPU Usage" value="53.1%" percentage={53.1} colorClass="bg-green-500" />
            <MetricBar label="Memory Usage" value="75.6%" percentage={75.6} colorClass="bg-yellow-500" />
            <MetricBar label="Disk Usage" value="19.7%" percentage={19.7} colorClass="bg-blue-500" />
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div><p className="text-gray-500">Active Connections</p><p className="text-xl font-bold">570</p></div>
            <div><p className="text-gray-500">Request/Minute</p><p className="text-xl font-bold">1,277</p></div>
            <div><p className="text-gray-500">Uptime</p><p className="text-xl font-bold">15 days, 23 hours</p></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="font-bold mb-2">System Monitoring</h3>
            <button className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">System Logs</button>
            <button className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Audit Logs</button>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="font-bold mb-2">Database</h3>
            <button className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Database Explorer</button>
            <button className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Backup & Restore</button>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="font-bold mb-2">Security</h3>
            <button className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Security Settings</button>
            <button className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Audit Trails</button>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="font-bold mb-2">Features</h3>
            <button className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Feature Flags</button>
            <button className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Configuration</button>
          </div>
      </div>
    </div>
  );
};

export default DeveloperDashboard;
