import { SkipBack, SkipForward, Play, Pause, Volume2, Heart } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useState } from 'react';
import api from '../../services/api';
import styles from './Player.module.css';

function fmt(secs) {
  if (!secs) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Player() {
  const { currentTrack, isPlaying, progress, volume, togglePlay, seek, changeVolume, skipNext, skipPrev } = usePlayer();
  const [liked, setLiked] = useState(false);

  async function toggleLike() {
    if (!currentTrack) return;
    try {
      if (liked) {
        await api.delete(`/tracks/${currentTrack.id}/like`);
      } else {
        await api.post(`/tracks/${currentTrack.id}/like`);
      }
      setLiked(!liked);
    } catch {}
  }

  const elapsed = currentTrack ? Math.round((progress / 100) * currentTrack.duration_seconds) : 0;

  return (
    <div className={styles.player}>
      {/* Left — track info */}
      <div className={styles.trackInfo}>
        {currentTrack ? (
          <>
            <img
              src={currentTrack.album_cover || '/covers/default.svg'}
              alt={currentTrack.title}
              className={styles.cover}
            />
            <div className={styles.meta}>
              <span className={`${styles.title} truncate`}>{currentTrack.title}</span>
              <span className={`${styles.artist} truncate text-secondary text-sm`}>{currentTrack.artist_name}</span>
            </div>
            <button
              className={`${styles.likeBtn} ${liked ? styles.liked : ''}`}
              onClick={toggleLike}
              title={liked ? 'Unlike' : 'Like'}
            >
              <Heart size={16} fill={liked ? 'var(--accent)' : 'none'} />
            </button>
          </>
        ) : (
          <span className="text-muted text-sm">Nothing playing</span>
        )}
      </div>

      {/* Center — controls */}
      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button className={styles.ctrl} onClick={skipPrev}><SkipBack size={18} /></button>
          <button className={styles.playBtn} onClick={togglePlay}>
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
          <button className={styles.ctrl} onClick={skipNext}><SkipForward size={18} /></button>
        </div>
        <div className={styles.progress}>
          <span className="text-xs text-muted">{fmt(elapsed)}</span>
          <input
            type="range"
            min="0" max="100"
            value={progress}
            onChange={e => seek(Number(e.target.value))}
            className={styles.slider}
          />
          <span className="text-xs text-muted">{fmt(currentTrack?.duration_seconds)}</span>
        </div>
      </div>

      {/* Right — volume */}
      <div className={styles.volumeArea}>
        <Volume2 size={16} className="text-secondary" />
        <input
          type="range"
          min="0" max="1" step="0.05"
          value={volume}
          onChange={e => changeVolume(Number(e.target.value))}
          className={styles.slider}
        />
      </div>
    </div>
  );
}
