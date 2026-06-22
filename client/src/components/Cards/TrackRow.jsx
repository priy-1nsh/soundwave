import { Play, Pause } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import styles from './TrackRow.module.css';

function fmt(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TrackRow({ track, index, queue = [] }) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const isActive = currentTrack?.id === track.id;

  function handleClick() {
    if (isActive) { togglePlay(); return; }
    playTrack(track, queue.length > 0 ? queue : [track]);
  }

  return (
    <div className={`${styles.row} ${isActive ? styles.active : ''}`} onClick={handleClick}>
      <div className={styles.index}>
        {isActive
          ? (isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />)
          : <span>{index}</span>
        }
      </div>
      <img
        src={track.album_cover || '/covers/default.svg'}
        alt=""
        className={styles.thumb}
      />
      <div className={styles.meta}>
        <span className={`${styles.title} truncate`}>{track.title}</span>
        <span className="truncate text-secondary text-sm">{track.artist_name}</span>
      </div>
      {track.album_title && (
        <span className={`${styles.album} truncate text-secondary text-sm`}>{track.album_title}</span>
      )}
      {track.play_count !== undefined && (
        <span className="text-muted text-sm" style={{ textAlign: 'right' }}>
          {Number(track.play_count).toLocaleString()}
        </span>
      )}
      <span className="text-muted text-sm" style={{ textAlign: 'right' }}>
        {fmt(track.duration_seconds)}
      </span>
    </div>
  );
}
