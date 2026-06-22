import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import TrackRow  from '../components/Cards/TrackRow';
import AlbumCard from '../components/Cards/AlbumCard';
import { usePlayer } from '../context/PlayerContext';
import styles from './Page.module.css';

export default function Artist() {
  const { id } = useParams();
  const { user } = useAuth();
  const { playTrack } = usePlayer();
  const [artist, setArtist]       = useState(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.get(`/artists/${id}`)
      .then(r => {
        setArtist(r.data);
        setFollowing(r.data.is_following);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleFollow() {
    if (!user) return;
    if (following) {
      await api.delete(`/artists/${id}/follow`);
    } else {
      await api.post(`/artists/${id}/follow`);
    }
    setFollowing(!following);
  }

  if (loading) return <div className={styles.loading}>Loading…</div>;
  if (!artist)  return <div className={styles.loading}>Artist not found.</div>;

  return (
    <div className={styles.page}>
      <div className={styles.entityHero}>
        <img
          src={artist.image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.id}`}
          alt={artist.name}
          className={`${styles.entityImg} ${styles.round}`}
        />
        <div className={styles.entityMeta}>
          <small>Artist</small>
          <h1>{artist.name}</h1>
          <div className={styles.chips}>
            {artist.genre  && <span className={styles.chip}>{artist.genre}</span>}
            {artist.country && <span className={styles.chip}>{artist.country}</span>}
          </div>
          <p>
            {Number(artist.follower_count).toLocaleString()} followers ·{' '}
            {Number(artist.track_count).toLocaleString()} tracks
          </p>
        </div>
      </div>

      <div className={styles.actionRow}>
        <button
          className={styles.playBtn}
          onClick={() => artist.top_tracks?.[0] && playTrack(artist.top_tracks[0], artist.top_tracks)}
        >▶</button>
        {user && (
          <button
            className={`${styles.followBtn} ${following ? styles.following : ''}`}
            onClick={toggleFollow}
          >
            {following ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {artist.bio && (
        <section className={styles.section}>
          <h2>About</h2>
          <p className="text-secondary">{artist.bio}</p>
        </section>
      )}

      <section className={styles.section}>
        <h2>Popular</h2>
        <div className={styles.trackList}>
          {artist.top_tracks?.map((t, i) => (
            <TrackRow key={t.id} track={t} index={i + 1} queue={artist.top_tracks} />
          ))}
        </div>
      </section>

      {artist.albums?.length > 0 && (
        <section className={styles.section}>
          <h2>Discography</h2>
          <div className={styles.grid}>
            {artist.albums.map(a => <AlbumCard key={a.id} album={{ ...a, artist_name: artist.name }} />)}
          </div>
        </section>
      )}
    </div>
  );
}
