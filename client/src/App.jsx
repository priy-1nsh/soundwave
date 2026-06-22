import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }   from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';

import Sidebar    from './components/Layout/Sidebar';
import Topbar     from './components/Layout/Topbar';
import Player     from './components/Layout/Player';

import Home       from './pages/Home';
import Search     from './pages/Search';
import Library    from './pages/Library';
import Artist     from './pages/Artist';
import Album      from './pages/Album';
import Playlist   from './pages/Playlist';
import LikedSongs from './pages/LikedSongs';
import Login      from './pages/Login';
import Analytics  from './pages/Analytics';

import './App.css';

function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar />
        <div className="content">
          <Routes>
            <Route path="/"              element={<Home />} />
            <Route path="/search"        element={<Search />} />
            <Route path="/library"       element={<Library />} />
            <Route path="/artist/:id"    element={<Artist />} />
            <Route path="/album/:id"     element={<Album />} />
            <Route path="/playlist/:id"  element={<Playlist />} />
            <Route path="/liked"         element={<LikedSongs />} />
            <Route path="/analytics"     element={<Analytics />} />
            <Route path="/login"         element={<Login />} />
            <Route path="*"              element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
      <Player />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlayerProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*"     element={<AppLayout />} />
          </Routes>
        </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
