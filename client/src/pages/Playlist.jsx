import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import TrackRow from '../components/Cards/TrackRow';
import styles from './Page.module.css';

export default function Playlist() {
  const { id } = useParams();
  const { user } = useAuth();
  const { playTrack } = usePlayer();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [name, setName]         = useState('');

  useEffect(() => {
    api.get(`/playlists/${id}`)
      .then(r => { setPlaylist(r.data); setName(r.data.name); })
      .finally(() => setLoading(false));
  }, [id]);

  const isOwner = user && playlist && user.id === playlist.user_id;

  async function saveEdit() {
    try {
      const r = await api.put(`/playlists/${id}`, { name });
      setPlaylist(prev => ({ ...prev, name: r.data.name }));
      setEditing(false);
    } catch {}
  }

  async function deletePlaylist() {
    if (!confirm('Delete this playlist?')) return;
    await api.delete(`/playlists/${id}`);
    navigate('/library');
  }

  async function removeTrack(trackId) {
    await api.delete(`/playlists/${id}/tracks/${trackId}`);
    setPlaylist(prev => ({ ...prev, tracks: prev.tracks.filter(t => t.id !== trackId) }));
  }

  if (loading)  return <div className={styles.loading}>Loading…</div>;
  if (!playlist) return <div className={styles.loading}>Playlist not found.</div>;

  return (
    <div className={styles.page}>
      <div className={styles.entityHero}>
        <div
          style={{
            width: 200, height: 200, borderRadius: 6, flexShrink: 0,
            background: 'linear-gradient(135deg,#1db954,#006a2e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 64, boxShadow: '0 16px 48px rgba(0,0,0,0.6)'
          }}
        >🎵</div>
        <div className={styles.entityMeta}>
          <small>Playlist</small>
          {editing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', padding: '8px 12px',
                  borderRadius: 6, fontSize: '1.4rem', fontWeight: 900, width: '100%'
                }}
                autoFocus
              />
              <button onClick={saveEdit}  style={{ color: 'var(--accent)' }}><Check size={20} /></button>
              <button onClick={() => setEditing(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
          ) : (
            <h1>{playlist.name}</h1>
          )}
          <p>
            By <strong>{playlist.display_name || playlist.username}</strong>
            {' '}· {playlist.track_count} songs
            {playlist.description && <> · <em style={{ color: 'var(--text-muted)' }}>{playlist.description}</em></>}
          </p>
        </div>
      </div>

      <div className={styles.actionRow}>
        <button
          className={styles.playBtn}
          onClick={() => playlist.tracks?.[0] && playTrack(playlist.tracks[0], playlist.tracks)}
        >▶</button>
        {isOwner && (
          <>
            <button className={styles.followBtn} onClick={() => setEditing(true)} title="Edit name">
              <Edit2 size={14} style={{ marginRight: 6 }} />Edit
            </button>
            <button className={styles.followBtn} onClick={deletePlaylist} title="Delete playlist"
              style={{ borderColor: '#e22', color: '#e22' }}>
              <Trash2 size={14} style={{ marginRight: 6 }} />Delete
            </button>
          </>
        )}
      </div>

      <div className={styles.trackList}>
        {playlist.tracks?.length === 0 && (
          <p className="text-secondary" style={{ padding: '24px 12px' }}>This playlist is empty.</p>
        )}
        {playlist.tracks?.map((t, i) => (
          <div key={t.id} style={{ position: 'relative' }}>
            <TrackRow track={t} index={i + 1} queue={playlist.tracks} />
            {isOwner && (
              <button
                onClick={() => removeTrack(t.id)}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', padding: 4,
                }}
                title="Remove from playlist"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
