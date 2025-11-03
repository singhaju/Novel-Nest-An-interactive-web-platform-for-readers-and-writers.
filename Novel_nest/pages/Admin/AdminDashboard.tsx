
import React from 'react';
import DashboardCard from '../../components/DashboardCard';
import { UserIcon, BookOpenIcon } from '../../components/icons';

const AdminDashboard: React.FC = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard title="Total Users" value="6,879" icon={<UserIcon className="w-8 h-8"/>} />
        <DashboardCard title="Total Novels" value="385" icon={<BookOpenIcon className="w-8 h-8"/>} />
        <DashboardCard title="Pending Reviews" value="9" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <DashboardCard title="Revenue" value="300k" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="w-full text-center bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-6 rounded-lg text-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">User Management</button>
            <button className="w-full text-center bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-6 rounded-lg text-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">Novel Management</button>
            <button className="w-full text-center bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-6 rounded-lg text-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">Reports</button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
