import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Library, Heart, PlusCircle, Music2, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    if (!user) return;
    api.get('/playlists/mine').then(r => setPlaylists(r.data)).catch(() => {});
  }, [user]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  async function createPlaylist() {
    if (!user) { navigate('/login'); return; }
    try {
      const r = await api.post('/playlists', { name: 'New Playlist' });
      setPlaylists(prev => [r.data, ...prev]);
      navigate(`/playlist/${r.data.id}`);
    } catch {}
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Music2 size={28} color="var(--accent)" />
        <span>Soundwave</span>
      </div>

      <nav className={styles.nav}>
        <NavLink to="/"        className={({ isActive }) => isActive ? styles.active : ''}>
          <Home size={20} /> Home
        </NavLink>
        <NavLink to="/search"  className={({ isActive }) => isActive ? styles.active : ''}>
          <Search size={20} /> Search
        </NavLink>
        <NavLink to="/library" className={({ isActive }) => isActive ? styles.active : ''}>
          <Library size={20} /> Your Library
        </NavLink>
      </nav>

      <div className={styles.section}>
        <button className={styles.iconBtn} onClick={createPlaylist} title="Create playlist">
          <PlusCircle size={20} /> Create Playlist
        </button>
        {user && (
          <NavLink to="/liked" className={({ isActive }) => `${styles.iconBtn} ${isActive ? styles.active : ''}`}>
            <Heart size={20} color="var(--accent)" /> Liked Songs
          </NavLink>
        )}
      </div>

      <hr className={styles.divider} />

      <div className={styles.playlists}>
        {playlists.map(p => (
          <NavLink
            key={p.id}
            to={`/playlist/${p.id}`}
            className={({ isActive }) => `${styles.playlistItem} ${isActive ? styles.active : ''}`}
          >
            {p.name}
          </NavLink>
        ))}
      </div>

      {user && (
        <div className={styles.userArea}>
          <NavLink to="/profile" className={styles.userInfo}>
            <img
              src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
              alt={user.username}
              className={styles.avatar}
            />
            <span className="truncate">{user.display_name || user.username}</span>
          </NavLink>
          <button onClick={handleLogout} title="Log out" className={styles.logoutBtn}>
            <LogOut size={16} />
          </button>
        </div>
      )}

      {!user && (
        <div className={styles.authPrompt}>
          <p className="text-secondary text-sm">Sign in to create playlists</p>
          <button className={styles.signInBtn} onClick={() => navigate('/login')}>Log in</button>
        </div>
      )}
    </aside>
  );
}
