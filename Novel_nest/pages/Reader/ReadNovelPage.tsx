
import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/apiService';
import { Episode, Comment as CommentType, Novel } from '../../types';

interface ReadNovelPageProps {
  novelId: number;
  episodeId: number;
}

const Comment: React.FC<{ comment: CommentType }> = ({ comment }) => (
    <div className="flex items-start space-x-3">
        <img src={comment.user.profile_picture} alt={comment.user.username} className="w-10 h-10 rounded-full" />
        <div className="flex-1 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <div className="flex items-baseline justify-between">
                <p className="font-semibold text-sm">{comment.user.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</p>
            </div>
            <p className="text-sm mt-1">{comment.content}</p>
            {comment.replies && comment.replies.map(reply => (
                <div key={reply.comment_id} className="mt-3 ml-4 border-l-2 border-gray-200 dark:border-gray-600 pl-3">
                    <Comment comment={reply} />
                </div>
            ))}
        </div>
    </div>
);

const ReadNovelPage: React.FC<ReadNovelPageProps> = ({ novelId, episodeId }) => {
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [novel, setNovel] = useState<Novel | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // FIX: Corrected the call to fetch episode data. It was calling a non-existent `getEpisode` with wrong arguments.
        const [episodeData, novelData, commentsData] = await Promise.all([
            apiService.getEpisode(episodeId),
            apiService.getNovelById(novelId),
            apiService.getCommentsByEpisodeId(episodeId)
        ]);
        setEpisode(episodeData || null);
        setNovel(novelData || null);
        setComments(commentsData);
      } catch (error) {
        console.error('Failed to fetch episode:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [novelId, episodeId]);

  if (loading) return <div className="text-center p-10">Loading chapter...</div>;
  if (!episode || !novel) return <div className="text-center p-10">Chapter not found.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">Story: {novel.title}</p>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mt-1">{episode.title}</h1>
        <p className="mt-2 text-md text-gray-500 dark:text-gray-300">by {novel.author.username}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 md:p-10 rounded-lg shadow-lg">
        <div className="prose prose-lg dark:prose-invert max-w-none text-justify leading-relaxed" style={{fontFamily: 'serif'}}>
          {episode.content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between mt-8">
        <button className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">Previous Episode</button>
        <button className="bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-600 transition">Next Episode</button>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Comments ({comments.length})</h2>
        <div className="space-y-6">
            {comments.map(comment => <Comment key={comment.comment_id} comment={comment} />)}
        </div>
      </div>
    </div>
  );
};

export default ReadNovelPage;