import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import api from '../services/api';
import ArtistCard from '../components/Cards/ArtistCard';
import AlbumCard  from '../components/Cards/AlbumCard';
import TrackRow   from '../components/Cards/TrackRow';
import styles from './Page.module.css';
import sStyles from './Search.module.css';

export default function Search() {
  const [q, setQ]           = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounce = useRef(null);

  useEffect(() => {
    if (!q.trim()) { setResults(null); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      setLoading(true);
      api.get(`/search?q=${encodeURIComponent(q)}`)
        .then(r => setResults(r.data))
        .finally(() => setLoading(false));
    }, 300);
  }, [q]);

  const empty = results && !results.artists.length && !results.albums.length && !results.tracks.length;

  return (
    <div className={styles.page}>
      <div className={sStyles.searchBar}>
        <SearchIcon size={20} className={sStyles.icon} />
        <input
          type="text"
          placeholder="What do you want to listen to?"
          value={q}
          onChange={e => setQ(e.target.value)}
          className={sStyles.input}
          autoFocus
        />
      </div>

      {loading && <div className={styles.loading}>Searching…</div>}

      {!q && !results && (
        <div style={{ padding: '40px 0' }}>
          <h2 style={{ marginBottom: 8 }}>Search Soundwave</h2>
          <p className="text-secondary">Find artists, albums, and songs.</p>
        </div>
      )}

      {empty && <p className="text-secondary" style={{ marginTop: 24 }}>No results for "{q}"</p>}

      {results && !empty && (
        <>
          {results.artists.length > 0 && (
            <section className={styles.section} style={{ marginTop: 32 }}>
              <h2>Artists</h2>
              <div className={styles.grid}>
                {results.artists.map(a => <ArtistCard key={a.id} artist={a} />)}
              </div>
            </section>
          )}
          {results.albums.length > 0 && (
            <section className={styles.section}>
              <h2>Albums</h2>
              <div className={styles.grid}>
                {results.albums.map(a => <AlbumCard key={a.id} album={a} />)}
              </div>
            </section>
          )}
          {results.tracks.length > 0 && (
            <section className={styles.section}>
              <h2>Songs</h2>
              <div className={styles.trackList}>
                {results.tracks.map((t, i) => <TrackRow key={t.id} track={t} index={i + 1} queue={results.tracks} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
