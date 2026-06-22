import { useNavigate } from 'react-router-dom';
import styles from './Card.module.css';

export default function ArtistCard({ artist }) {
  const navigate = useNavigate();
  return (
    <div className={styles.card} onClick={() => navigate(`/artist/${artist.id}`)}>
      <div className={styles.imgWrap} style={{ borderRadius: '50%' }}>
        <img
          src={artist.image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.id}`}
          alt={artist.name}
          className={styles.img}
          style={{ borderRadius: '50%' }}
        />
        <div className={styles.overlay}>
          <div className={styles.playCircle}>▶</div>
        </div>
      </div>
      <p className={`${styles.title} truncate`}>{artist.name}</p>
      <p className={`${styles.sub} text-sm text-secondary truncate`}>{artist.genre || 'Artist'}</p>
    </div>
  );
}
