
import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/apiService';
import { Novel, Episode, Review } from '../../types';
import { StarIcon, EyeIcon, HeartIcon } from '../../components/icons';

interface NovelDetailPageProps {
  novelId: number;
}

const NovelDetailPage: React.FC<NovelDetailPageProps> = ({ novelId }) => {
  const [novel, setNovel] = useState<Novel | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const novelData = await apiService.getNovelById(novelId);
        if (novelData) {
          setNovel(novelData);
          const [episodesData, reviewsData] = await Promise.all([
            apiService.getEpisodesByNovelId(novelId),
            apiService.getReviewsByNovelId(novelId),
          ]);
          setEpisodes(episodesData);
          setReviews(reviewsData);
        }
      } catch (error) {
        console.error('Failed to fetch novel details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [novelId]);

  if (loading) {
    return <div className="text-center p-10">Loading novel details...</div>;
  }

  if (!novel) {
    return <div className="text-center p-10">Novel not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {/* Left Column */}
        <div className="md:col-span-1 lg:col-span-1">
          <img src={novel.cover_image} alt={novel.title} className="w-full rounded-lg shadow-lg aspect-[2/3] object-cover" />
          <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center text-sm mb-3">
              <span className="font-semibold text-gray-600 dark:text-gray-300">Status:</span>
              <span className="font-bold text-green-500">{novel.status}</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-3">
              <span className="font-semibold text-gray-600 dark:text-gray-300">Episodes:</span>
              <span className="font-bold text-gray-800 dark:text-gray-100">{episodes.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-3">
              <span className="font-semibold text-gray-600 dark:text-gray-300">Views:</span>
              <span className="font-bold text-gray-800 dark:text-gray-100">{novel.views.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-gray-600 dark:text-gray-300">Rating:</span>
              <div className="flex items-center space-x-1">
                <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="font-bold text-gray-800 dark:text-gray-100">{novel.rating}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button className="w-full bg-blue-500 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-600 transition">Like</button>
            <button className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">Wishlist</button>
            <button className="col-span-2 w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">Follow Author</button>
            <button className="col-span-2 w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">Share</button>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-2 lg:col-span-3">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{novel.title}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-1">by {novel.author.username}</p>
          
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-2">Summary</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{novel.description}</p>
          </div>
          
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Episodes</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {episodes.map(ep => (
                <a href={`#/read/${novel.novel_id}/${ep.episode_id}`} key={ep.episode_id} className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{ep.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Released: {new Date(ep.release_date).toLocaleDateString()}</p>
                </a>
              ))}
            </div>
          </div>
          
          <div className="mt-8">
             <h2 className="text-xl font-bold mb-4">Reviews ({reviews.length})</h2>
             <div className="space-y-4">
                 {reviews.map(review => (
                     <div key={review.review_id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                         <div className="flex items-start space-x-4">
                             <img src={review.user.profile_picture} alt={review.user.username} className="w-10 h-10 rounded-full"/>
                             <div>
                                <div className="flex items-center justify-between w-full">
                                  <p className="font-semibold">{review.user.username}</p>
                                  <div className="flex items-center">
                                      {[...Array(5)].map((_, i) => (
                                          <StarIcon key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                                      ))}
                                  </div>
                                </div>
                                 <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(review.created_at).toLocaleDateString()}</p>
                                 <p className="mt-2 text-gray-700 dark:text-gray-300">{review.comment}</p>
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NovelDetailPage;
