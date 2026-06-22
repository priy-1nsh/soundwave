import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Topbar.module.css';

export default function Topbar() {
  const navigate = useNavigate();
  return (
    <div className={styles.topbar}>
      <div className={styles.navBtns}>
        <button onClick={() => navigate(-1)} className={styles.navBtn}><ChevronLeft size={20} /></button>
        <button onClick={() => navigate(1)}  className={styles.navBtn}><ChevronRight size={20} /></button>
      </div>
    </div>
  );
}
