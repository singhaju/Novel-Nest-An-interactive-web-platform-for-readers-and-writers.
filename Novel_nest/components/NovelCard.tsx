
import React from 'react';
import { Novel } from '../types';
import { BookOpenIcon, EyeIcon, HeartIcon } from './icons';

interface NovelCardProps {
  novel: Novel;
}

const NovelCard: React.FC<NovelCardProps> = ({ novel }) => {
  return (
    <a href={`#/novel/${novel.novel_id}`} className="block group">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
        <div className="relative">
          <img className="w-full h-64 object-cover" src={novel.cover_image} alt={novel.title} />
          <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-40 transition-all duration-300"></div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-500 dark:group-hover:text-blue-400">{novel.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{novel.author.username}</p>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-3">
            <div className="flex items-center space-x-1">
              <BookOpenIcon className="w-4 h-4" />
              <span>47 Ch.</span>
            </div>
            <div className="flex items-center space-x-1">
              <EyeIcon className="w-4 h-4" />
              <span>{novel.views.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <HeartIcon className="w-4 h-4" />
              <span>{novel.likes.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
};

export default NovelCard;
