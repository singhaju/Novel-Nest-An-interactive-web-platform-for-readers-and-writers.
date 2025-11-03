
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { Novel } from '../../types';
import NovelCard from '../../components/NovelCard';

const HomePage: React.FC = () => {
  const [recommendedNovels, setRecommendedNovels] = useState<Novel[]>([]);
  const [fantasyNovels, setFantasyNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        setLoading(true);
        // FIX: Replaced calls to non-existent getRecommendedNovels and getFantasyNovels with calls to getNovels with appropriate filters.
        const [reco, fant] = await Promise.all([
          apiService.getNovels({ orderBy: 'rating' }),
          apiService.getNovels({ genre: 'Fantasy' }),
        ]);
        setRecommendedNovels(reco);
        setFantasyNovels(fant);
      } catch (error) {
        console.error("Failed to fetch novels:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNovels();
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-8 md:p-12 mb-10 text-center md:text-left md:flex md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Discover Your Next Favorite Story</h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-300 max-w-2xl">Dive into thousands of user-written novels across every genre imaginable.</p>
        </div>
        <button className="mt-6 md:mt-0 md:ml-6 shrink-0 bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-transform transform hover:scale-105">
          Browse All Novels
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 dark:text-gray-400">Loading novels...</div>
      ) : (
        <>
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recommended</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {recommendedNovels.map(novel => <NovelCard key={novel.novel_id} novel={novel} />)}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Fantasy</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {fantasyNovels.map(novel => <NovelCard key={novel.novel_id} novel={novel} />)}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default HomePage;