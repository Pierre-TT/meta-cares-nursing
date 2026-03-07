import { motion } from 'framer-motion';
import { Card, Avatar } from '@/design-system';

interface Props {
  nurseName: string;
  etaMinutes: number;
  status: 'preparing' | 'en_route' | 'arriving' | 'on_site';
}

const statusLabels = { preparing: 'Préparation', en_route: 'En route', arriving: 'Arrivée imminente', on_site: 'Sur place' };
const statusColors = { preparing: 'text-[var(--text-muted)]', en_route: 'text-mc-blue-500', arriving: 'text-mc-green-500', on_site: 'text-mc-green-500' };

export function NurseTrackerLive({ nurseName, etaMinutes, status }: Props) {
  return (
    <Card gradient className="relative overflow-hidden">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar name={nurseName} size="md" />
          <motion.span
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-mc-green-500 border-2 border-white"
          />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">{nurseName}</p>
          <p className={`text-xs font-medium ${statusColors[status]}`}>{statusLabels[status]}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-mc-blue-500">{etaMinutes}'</p>
          <p className="text-[9px] text-[var(--text-muted)]">ETA</p>
        </div>
      </div>

      {/* Animated route line */}
      <div className="mt-3 h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-mc-blue-500 to-mc-green-500"
          animate={{ width: ['20%', '60%', '40%', '70%'] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        />
      </div>
    </Card>
  );
}
