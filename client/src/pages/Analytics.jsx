import { useEffect, useState } from 'react';
import api from '../services/api';
import TrackRow from '../components/Cards/TrackRow';
import styles from './Page.module.css';

export default function Analytics() {
  const [topTracks, setTopTracks]   = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [genres, setGenres]         = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/top-tracks?limit=10'),
      api.get('/analytics/top-artists?limit=6'),
      api.get('/analytics/genre-breakdown'),
    ]).then(([t, a, g]) => {
      setTopTracks(t.data);
      setTopArtists(a.data);
      setGenres(g.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Loading…</div>;

  const maxPlays = topArtists[0]?.total_plays || 1;

  return (
    <div className={styles.page}>
      <div style={{ padding: '40px 0 24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>📊 Analytics</h1>
        <p className="text-secondary" style={{ marginTop: 6 }}>Platform-wide listening insights</p>
      </div>

      <section className={styles.section}>
        <h2>Top 10 Most Played</h2>
        <div className={styles.trackList}>
          {topTracks.map((t, i) => <TrackRow key={t.id} track={t} index={i + 1} queue={topTracks} />)}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Top Artists by Plays</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {topArtists.map((a, i) => (
            <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '24px 36px 1fr auto', alignItems: 'center', gap: 12 }}>
              <span className="text-muted text-sm" style={{ textAlign: 'right' }}>{i + 1}</span>
              <img
                src={a.image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${a.id}`}
                alt={a.name}
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.name}</p>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-hover)', marginTop: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(a.total_plays / maxPlays) * 100}%`,
                    background: 'var(--accent)',
                    borderRadius: 2,
                  }} />
                </div>
              </div>
              <span className="text-secondary text-sm">{Number(a.total_plays).toLocaleString()} plays</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Genre Breakdown</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {genres.map(g => (
            <div key={g.genre} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{g.genre}</span>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-hover)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(g.total_plays / (genres[0]?.total_plays || 1)) * 100}%`,
                  background: 'linear-gradient(90deg, var(--accent), #158a3e)',
                  borderRadius: 3,
                }} />
              </div>
              <span className="text-secondary text-sm">
                {Number(g.total_plays).toLocaleString()} plays · {g.artist_count} artists
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
