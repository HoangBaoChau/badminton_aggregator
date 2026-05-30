import dynamic from 'next/dynamic';
import { Deal } from './DealCard';

// Vô hiệu hóa SSR cho Leaflet (vì nó cần `window`)
const DealMapClient = dynamic(() => import('./DealMapClient'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '500px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
      <p style={{ color: 'var(--text-secondary)' }}>Đang tải bản đồ...</p>
    </div>
  )
});

interface DealMapProps {
  deals: Deal[];
}

export default function DealMap({ deals }: DealMapProps) {
  return <DealMapClient deals={deals} />;
}
