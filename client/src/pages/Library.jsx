import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ArtistCard from '../components/Cards/ArtistCard';
import styles from './Page.module.css';

export default function Library() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      api.get('/playlists/mine'),
      api.get('/users/following'),
    ]).then(([p, f]) => {
      setPlaylists(p.data);
      setFollowing(f.data);
    }).finally(() => setLoading(false));
  }, [user]);

  async function createPlaylist() {
    const r = await api.post('/playlists', { name: 'New Playlist' });
    navigate(`/playlist/${r.data.id}`);
  }

  if (!user) return (
    <div className={styles.page} style={{ paddingTop: 60 }}>
      <h1>Your Library</h1>
      <p className="text-secondary" style={{ marginTop: 12 }}>
        <Link to="/login" style={{ color: 'var(--accent)' }}>Log in</Link> to see your library.
      </p>
    </div>
  );

  if (loading) return <div className={styles.loading}>Loading…</div>;

  return (
    <div className={styles.page}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px 0 24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900 }}>Your Library</h1>
        <button
          onClick={createPlaylist}
          style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.9rem' }}
        >
          <PlusCircle size={20} /> New Playlist
        </button>
      </div>

      <section className={styles.section}>
        <h2>Playlists</h2>
        {playlists.length === 0
          ? <p className="text-secondary">You have no playlists yet.</p>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {playlists.map(p => (
                <Link
                  key={p.id}
                  to={`/playlist/${p.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '10px 12px', borderRadius: 6,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 4, flexShrink: 0,
                    background: 'linear-gradient(135deg,#1db954,#006a2e)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                  }}>🎵</div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }} className="truncate">{p.name}</p>
                    <p className="text-secondary text-sm">Playlist · {p.track_count} songs</p>
                  </div>
                </Link>
              ))}
            </div>
          )
        }
      </section>

      {following.length > 0 && (
        <section className={styles.section}>
          <h2>Following</h2>
          <div className={styles.grid}>
            {following.map(a => <ArtistCard key={a.id} artist={a} />)}
          </div>
        </section>
      )}
    </div>
  );
}
