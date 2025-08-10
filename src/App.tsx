import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import TournamentPage from './pages/TournamentPage';
import TournamentDetailPage from './pages/TournamentDetailPage';

function App() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container mt-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/:groupId" element={<GroupDetailPage />} />
          <Route path="/groups/:groupId/tournaments/new" element={<TournamentPage />} />
          <Route path="/tournaments/:tournamentId" element={<TournamentDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;