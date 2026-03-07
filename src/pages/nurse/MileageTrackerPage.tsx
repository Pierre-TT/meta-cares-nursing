import { Car, Navigation, Download, Euro, MapPin } from 'lucide-react';
import { Card, Badge, Button, AnimatedPage, GradientHeader, ContentTabs } from '@/design-system';

const RATE_PER_KM = 0.4259; // Belgian 2025 rate

const todayTrips = [
  { from: 'Domicile', to: 'Van Damme Pierre', km: 4.2, time: '07:45' },
  { from: 'Van Damme Pierre', to: 'Dubois Françoise', km: 6.8, time: '08:50' },
  { from: 'Dubois Françoise', to: 'Janssens Maria', km: 3.1, time: '10:20' },
  { from: 'Janssens Maria', to: 'Peeters Jan', km: 8.5, time: '11:35' },
  { from: 'Peeters Jan', to: 'Claes Anne', km: 5.3, time: '13:10' },
];

const weekDays = [
  { date: 'Lun 03/03', trips: 8, km: 47.2, amount: 20.10 },
  { date: 'Mar 04/03', trips: 7, km: 38.5, amount: 16.40 },
  { date: 'Mer 05/03', trips: 9, km: 52.1, amount: 22.18 },
  { date: 'Jeu 06/03', trips: 6, km: 27.9, amount: 11.88 },
  { date: 'Ven 07/03', trips: 8, km: 44.8, amount: 19.08 },
  { date: 'Sam 08/03', trips: 3, km: 15.2, amount: 6.47 },
];

const monthlyStats = { totalKm: 892, totalAmount: 379.91, avgPerDay: 40.5, workDays: 22 };

export function MileageTrackerPage() {
  const todayKm = todayTrips.reduce((s, t) => s + t.km, 0);
  const todayAmount = todayKm * RATE_PER_KM;

  const dailyTab = (
    <div className="space-y-3">
      <Card glass>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Aujourd'hui — {todayTrips.length} trajets</p>
            <p className="text-xs text-[var(--text-muted)]">{todayKm.toFixed(1)} km · €{todayAmount.toFixed(2)}</p>
          </div>
          <Badge variant="blue"><Navigation className="h-3 w-3 mr-1" />En cours</Badge>
        </div>
      </Card>

      {todayTrips.map((trip, i) => (
        <Card key={i} padding="sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-mc-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-sm">
                <span className="text-[var(--text-muted)]">{trip.from}</span>
                <span className="text-[var(--text-muted)]">→</span>
                <span className="font-medium">{trip.to}</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">{trip.time}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold">{trip.km} km</p>
              <p className="text-[10px] text-mc-green-500">€{(trip.km * RATE_PER_KM).toFixed(2)}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const weeklyTab = (
    <div className="space-y-3">
      {weekDays.map(day => (
        <Card key={day.date} padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{day.date}</p>
              <p className="text-xs text-[var(--text-muted)]">{day.trips} trajets</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">{day.km} km</p>
              <p className="text-xs text-mc-green-500">€{day.amount.toFixed(2)}</p>
            </div>
          </div>
          {/* Mini bar */}
          <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] mt-2">
            <div className="h-1.5 rounded-full bg-[image:var(--gradient-brand)]" style={{ width: `${(day.km / 60) * 100}%` }} />
          </div>
        </Card>
      ))}

      <Card glass>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Total semaine</span>
          <div className="text-right">
            <p className="text-sm font-bold">{weekDays.reduce((s, d) => s + d.km, 0).toFixed(1)} km</p>
            <p className="text-xs text-mc-green-500">€{weekDays.reduce((s, d) => s + d.amount, 0).toFixed(2)}</p>
          </div>
        </div>
      </Card>
    </div>
  );

  const monthlyTab = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card glass className="text-center">
          <p className="text-2xl font-bold">{monthlyStats.totalKm}</p>
          <p className="text-xs text-[var(--text-muted)]">km ce mois</p>
        </Card>
        <Card glass className="text-center">
          <p className="text-2xl font-bold text-mc-green-500">€{monthlyStats.totalAmount.toFixed(0)}</p>
          <p className="text-xs text-[var(--text-muted)]">Remboursable</p>
        </Card>
        <Card glass className="text-center">
          <p className="text-2xl font-bold">{monthlyStats.avgPerDay}</p>
          <p className="text-xs text-[var(--text-muted)]">km/jour moy.</p>
        </Card>
        <Card glass className="text-center">
          <p className="text-2xl font-bold">{monthlyStats.workDays}</p>
          <p className="text-xs text-[var(--text-muted)]">Jours prestés</p>
        </Card>
      </div>

      <Card className="border-l-4 border-l-mc-blue-500">
        <div className="flex items-start gap-2 text-sm">
          <Euro className="h-4 w-4 text-mc-blue-500 mt-0.5" />
          <div>
            <p className="font-medium">Indemnité kilométrique 2025</p>
            <p className="text-xs text-[var(--text-muted)]">
              Taux: €{RATE_PER_KM}/km (barème fédéral). Applicable pour les déplacements professionnels entre domicile et patients.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 gap-1">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
        <Button variant="gradient" className="flex-1 gap-1">
          <Download className="h-4 w-4" /> Export PDF
        </Button>
      </div>
    </div>
  );

  const tabs = [
    { id: 'daily', label: "Aujourd'hui", content: dailyTab },
    { id: 'weekly', label: 'Semaine', content: weeklyTab },
    { id: 'monthly', label: 'Mois', content: monthlyTab },
  ];

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<Car className="h-5 w-5" />}
        title="Kilométrage"
        subtitle="Suivi des déplacements"
        badge={<Badge variant="green">€{RATE_PER_KM}/km</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{todayKm.toFixed(1)} km</p>
            <p className="text-[10px] text-white/60">Aujourd'hui</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{monthlyStats.totalKm}</p>
            <p className="text-[10px] text-white/60">km ce mois</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">€{monthlyStats.totalAmount.toFixed(0)}</p>
            <p className="text-[10px] text-white/60">Remboursable</p>
          </div>
        </div>
      </GradientHeader>

      <ContentTabs tabs={tabs} />
    </AnimatedPage>
  );
}
