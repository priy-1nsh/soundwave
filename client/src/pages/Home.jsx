import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ArtistCard from '../components/Cards/ArtistCard';
import AlbumCard  from '../components/Cards/AlbumCard';
import TrackRow   from '../components/Cards/TrackRow';
import styles from './Page.module.css';

export default function Home() {
  const [topTracks, setTopTracks]   = useState([]);
  const [artists,   setArtists]     = useState([]);
  const [albums,    setAlbums]      = useState([]);
  const [loading,   setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/top-tracks?limit=5'),
      api.get('/artists'),
      api.get('/albums'),
    ]).then(([t, ar, al]) => {
      setTopTracks(t.data);
      setArtists(ar.data.slice(0, 6));
      setAlbums(al.data.slice(0, 6));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Loading…</div>;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1>Good evening</h1>
        <p className="text-secondary">Your personalised music experience</p>
      </section>

      <section className={styles.section}>
        <h2>Top Tracks Right Now</h2>
        <div className={styles.trackList}>
          {topTracks.map((t, i) => (
            <TrackRow key={t.id} track={t} index={i + 1} queue={topTracks} />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Featured Artists</h2>
        <div className={styles.grid}>
          {artists.map(a => <ArtistCard key={a.id} artist={a} />)}
        </div>
      </section>

      <section className={styles.section}>
        <h2>New Releases</h2>
        <div className={styles.grid}>
          {albums.map(a => <AlbumCard key={a.id} album={a} />)}
        </div>
      </section>
    </div>
  );
}
