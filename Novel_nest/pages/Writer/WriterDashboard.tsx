
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';
import { Novel } from '../../types';
import DashboardCard from '../../components/DashboardCard';
import { BookOpenIcon, EyeIcon, HeartIcon } from '../../components/icons';

const WriterDashboard: React.FC = () => {
  const { user } = useAuth();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // FIX: Replaced call to non-existent getWriterNovels with a call to getNovels with an authorId filter.
      apiService.getNovels({ authorId: user.user_id })
        .then(setNovels)
        .finally(() => setLoading(false));
    }
  }, [user]);
  
  const stats = {
      totalNovels: novels.length,
      totalEpisodes: 47, // Mocked
      totalViews: novels.reduce((sum, n) => sum + n.views, 0),
      coinsEarned: 2010 // Mocked
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Author Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard title="Total Novels" value={stats.totalNovels} icon={<BookOpenIcon className="w-8 h-8"/>} />
        <DashboardCard title="Total Episodes" value={stats.totalEpisodes.toLocaleString()} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v11.494m-9-5.747h18" /></svg>} />
        <DashboardCard title="Total Views" value={stats.totalViews.toLocaleString()} icon={<EyeIcon className="w-8 h-8"/>} />
        <DashboardCard title="Coins Earned" value={stats.coinsEarned.toLocaleString()} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <button className="w-full text-center bg-blue-500 text-white font-bold py-6 rounded-lg text-xl hover:bg-blue-600 transition">Create New Novel</button>
        <button className="w-full text-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-6 rounded-lg text-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition">Manage Novels</button>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Novels</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Views</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Likes</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Updated</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-4">Loading novels...</td></tr>
                        ) : (
                            novels.map(novel => (
                                <tr key={novel.novel_id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{novel.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{novel.status}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{novel.views.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{novel.likes.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(novel.last_update).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
        <div className="mt-4 text-right">
            <button className="text-blue-500 hover:underline">View all</button>
        </div>
      </div>
    </div>
  );
};

export default WriterDashboard;