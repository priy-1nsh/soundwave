import { createContext, useContext, useState, useRef, useCallback } from 'react';
import api from '../services/api';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue]               = useState([]);
  const [queueIndex, setQueueIndex]     = useState(0);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [progress, setProgress]         = useState(0);   // 0–100
  const [volume, setVolume]             = useState(0.8);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  const clearProgressTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const startProgressTimer = (audio) => {
    clearProgressTimer();
    intervalRef.current = setInterval(() => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    }, 500);
  };

  const playTrack = useCallback((track, trackQueue = []) => {
    if (!track) return;

    // Record play in backend (best-effort)
    api.post(`/tracks/${track.id}/play`).catch(() => {});

    if (audioRef.current) {
      audioRef.current.pause();
      clearProgressTimer();
    }

    const audio = new Audio(track.audio_url);
    audio.volume = volume;
    audioRef.current = audio;

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
      clearProgressTimer();
      // Auto-advance queue
      setQueueIndex(prev => {
        const next = prev + 1;
        if (next < trackQueue.length) {
          playTrack(trackQueue[next], trackQueue);
          return next;
        }
        return prev;
      });
    });

    audio.play().then(() => {
      setIsPlaying(true);
      startProgressTimer(audio);
    }).catch(() => {
      // Audio src might fail — still show "playing" state visually
      setIsPlaying(true);
    });

    setCurrentTrack(track);
    setQueue(trackQueue);
    const idx = trackQueue.findIndex(t => t.id === track.id);
    setQueueIndex(idx >= 0 ? idx : 0);
  }, [volume]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      clearProgressTimer();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        startProgressTimer(audioRef.current);
      }).catch(() => setIsPlaying(true));
    }
  }, [isPlaying]);

  const seek = useCallback((pct) => {
    if (!audioRef.current || !audioRef.current.duration) return;
    audioRef.current.currentTime = (pct / 100) * audioRef.current.duration;
    setProgress(pct);
  }, []);

  const changeVolume = useCallback((v) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const skipNext = useCallback(() => {
    if (queue.length === 0) return;
    const next = (queueIndex + 1) % queue.length;
    playTrack(queue[next], queue);
  }, [queue, queueIndex, playTrack]);

  const skipPrev = useCallback(() => {
    if (queue.length === 0) return;
    const prev = (queueIndex - 1 + queue.length) % queue.length;
    playTrack(queue[prev], queue);
  }, [queue, queueIndex, playTrack]);

  return (
    <PlayerContext.Provider value={{
      currentTrack, isPlaying, progress, volume, queue,
      playTrack, togglePlay, seek, changeVolume, skipNext, skipPrev,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
