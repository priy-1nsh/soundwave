import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import TrackRow from '../components/Cards/TrackRow';
import styles from './Page.module.css';

function fmtDuration(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h} hr ${m} min` : `${m} min`;
}

export default function Album() {
  const { id } = useParams();
  const { playTrack } = usePlayer();
  const [album, setAlbum]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/albums/${id}`)
      .then(r => setAlbum(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className={styles.loading}>Loading…</div>;
  if (!album)  return <div className={styles.loading}>Album not found.</div>;

  return (
    <div className={styles.page}>
      <div className={styles.entityHero}>
        <img
          src={album.cover_url || '/covers/default.svg'}
          alt={album.title}
          className={styles.entityImg}
        />
        <div className={styles.entityMeta}>
          <small>{album.album_type?.toUpperCase()}</small>
          <h1>{album.title}</h1>
          <p>
            <Link to={`/artist/${album.artist_id}`} style={{ fontWeight: 700 }}>{album.artist_name}</Link>
            {album.release_date && ` · ${new Date(album.release_date).getFullYear()}`}
            {album.track_count  && ` · ${album.track_count} songs`}
            {album.total_duration && `, ${fmtDuration(album.total_duration)}`}
          </p>
        </div>
      </div>

      <div className={styles.actionRow}>
        <button
          className={styles.playBtn}
          onClick={() => album.tracks?.[0] && playTrack(album.tracks[0], album.tracks)}
        >▶</button>
      </div>

      <div className={styles.trackHeader}>
        <span>#</span>
        <span></span>
        <span>Title</span>
        <span>Plays</span>
        <span></span>
        <span style={{ textAlign: 'right' }}>⏱</span>
      </div>
      <div className={styles.trackList}>
        {album.tracks?.map((t, i) => (
          <TrackRow key={t.id} track={t} index={i + 1} queue={album.tracks} />
        ))}
      </div>
    </div>
  );
}
