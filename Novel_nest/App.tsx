import React, { useState, useEffect } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/Reader/HomePage';
import WriterDashboard from './pages/Writer/WriterDashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';
import DeveloperDashboard from './pages/Developer/DeveloperDashboard';
import { UserRole } from './types';
import Header from './components/Header';
import NovelDetailPage from './pages/Reader/NovelDetailPage';
import ReadNovelPage from './pages/Reader/ReadNovelPage';

// A simple hash-based router
const Router: React.FC = () => {
  const [hash, setHash] = React.useState(window.location.hash);

  React.useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center"><div>Loading session...</div></div>;
  }

  if (!session) {
    return <LoginPage />;
  }
  
  const user = session.user as any;

  // A more robust app would use a library like react-router-dom with HashRouter
  // but for this example, we'll use a simple hash parser.
  if (hash.startsWith('#/novel/')) {
      const id = parseInt(hash.replace('#/novel/', ''), 10);
      if(!isNaN(id)) return <NovelDetailPage novelId={id} />;
  }
  
  if (hash.startsWith('#/read/')) {
    const ids = hash.replace('#/read/', '').split('/');
    const novelId = parseInt(ids[0], 10);
    const episodeId = parseInt(ids[1], 10);
    if(!isNaN(novelId) && !isNaN(episodeId)) return <ReadNovelPage novelId={novelId} episodeId={episodeId} />;
  }

  switch (user.role) {
    case UserRole.READER:
      return <HomePage />;
    case UserRole.WRITER:
      return <WriterDashboard />;
    case UserRole.ADMIN:
      return <AdminDashboard />;
    case UserRole.DEVELOPER:
      return <DeveloperDashboard />;
    default:
      return <HomePage />;
  }
};

const AppContent: React.FC = () => {
  const { data: session } = useSession();
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {session && <Header />}
      <main>
        <Router />
      </main>
    </div>
  );
}

const App: React.FC = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <SessionProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SessionProvider>
  );
};

export default App;
