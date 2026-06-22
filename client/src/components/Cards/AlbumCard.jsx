import { useNavigate } from 'react-router-dom';
import styles from './Card.module.css';

export default function AlbumCard({ album }) {
  const navigate = useNavigate();
  return (
    <div className={styles.card} onClick={() => navigate(`/album/${album.id}`)}>
      <div className={styles.imgWrap}>
        <img
          src={album.cover_url || '/covers/default.svg'}
          alt={album.title}
          className={styles.img}
        />
        <div className={styles.overlay}>
          <div className={styles.playCircle}>▶</div>
        </div>
      </div>
      <p className={`${styles.title} truncate`}>{album.title}</p>
      <p className={`${styles.sub} text-sm text-secondary truncate`}>
        {album.release_date ? new Date(album.release_date).getFullYear() : ''} · {album.artist_name}
      </p>
    </div>
  );
}
