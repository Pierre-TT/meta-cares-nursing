import { useState } from 'react';
import { ArrowLeft, Shield, Award, MapPin, Phone, Mail, Calendar, CheckCircle, GraduationCap, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, Badge, Avatar, AnimatedPage, StatRing } from '@/design-system';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [available, setAvailable] = useState(true);

  const profileData = {
    inamiNr: '5-12345-67-890',
    qualification: 'Infirmier(e) bachelier(e)',
    specializations: ['Soins de plaies', 'Diabétologie', 'Gériatrie'],
    phone: '+32 470 12 34 56',
    email: 'marie.laurent@metacares.be',
    address: 'Rue des Infirmiers 42, 1000 Bruxelles',
    registeredSince: '15/01/2024',
    eHealthCert: { valid: true, expires: '31/12/2026' },
    stats: { patients: 48, visitsMonth: 187, revenue: 12450, acceptRate: 98.2 },
  };

  return (
    <AnimatedPage className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Mon Profil</h1>
      </div>

      {/* Identity card */}
      <Card gradient>
        <div className="flex items-center gap-4">
          <Avatar name={`${user?.firstName} ${user?.lastName}`} size="xl" />
          <div>
            <h2 className="text-lg font-bold">{user?.firstName} {user?.lastName}</h2>
            <p className="text-sm text-[var(--text-muted)]">{profileData.qualification}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="blue"><Shield className="h-3 w-3 mr-1" />INAMI {profileData.inamiNr}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Availability toggle */}
      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${available ? 'bg-mc-green-500/10' : 'bg-[var(--bg-tertiary)]'}`}>
            <Clock className={`h-5 w-5 ${available ? 'text-mc-green-500' : 'text-[var(--text-muted)]'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold">{available ? 'Disponible' : 'Indisponible'}</p>
            <p className="text-xs text-[var(--text-muted)]">{available ? 'Vous êtes visible pour les affectations' : 'Vous ne recevrez pas de nouvelles tournées'}</p>
          </div>
        </div>
        <button onClick={() => setAvailable(!available)}>
          {available
            ? <ToggleRight className="h-8 w-8 text-mc-green-500" />
            : <ToggleLeft className="h-8 w-8 text-[var(--text-muted)]" />
          }
        </button>
      </Card>

      {/* Education credits */}
      <Card className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/nurse/education')}>
        <StatRing value={23} max={60} label="Crédits" color="blue" size={56} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-mc-blue-500" />
            <p className="text-sm font-semibold">Formation continue</p>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">14/60 crédits — cycle 2023-2027</p>
          <p className="text-xs text-mc-blue-500 font-medium">2 modules en cours</p>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card glass className="text-center">
          <p className="text-2xl font-bold">{profileData.stats.patients}</p>
          <p className="text-xs text-[var(--text-muted)]">Patients actifs</p>
        </Card>
        <Card glass className="text-center">
          <p className="text-2xl font-bold">{profileData.stats.visitsMonth}</p>
          <p className="text-xs text-[var(--text-muted)]">Visites ce mois</p>
        </Card>
        <Card glass className="text-center">
          <p className="text-2xl font-bold text-mc-green-500">€{profileData.stats.revenue.toLocaleString()}</p>
          <p className="text-xs text-[var(--text-muted)]">CA mensuel</p>
        </Card>
        <Card glass className="text-center">
          <p className="text-2xl font-bold text-mc-green-500">{profileData.stats.acceptRate}%</p>
          <p className="text-xs text-[var(--text-muted)]">Taux eFact</p>
        </Card>
      </div>

      {/* eHealth Certificate */}
      <Card className={profileData.eHealthCert.valid ? 'border-mc-green-200 dark:border-mc-green-800' : 'border-mc-red-200 dark:border-red-800'}>
        <CardHeader>
          <CardTitle>Certificat eHealth</CardTitle>
          <Badge variant={profileData.eHealthCert.valid ? 'green' : 'red'} dot>
            {profileData.eHealthCert.valid ? 'Valide' : 'Expiré'}
          </Badge>
        </CardHeader>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-mc-green-500" />
          <span>Expire le {profileData.eHealthCert.expires}</span>
        </div>
      </Card>

      {/* Specializations */}
      <Card>
        <CardHeader><CardTitle>Spécialisations</CardTitle></CardHeader>
        <div className="flex flex-wrap gap-2">
          {profileData.specializations.map(s => (
            <Badge key={s} variant="blue"><Award className="h-3 w-3 mr-1" />{s}</Badge>
          ))}
        </div>
      </Card>

      {/* Contact info */}
      <Card>
        <CardHeader><CardTitle>Coordonnées</CardTitle></CardHeader>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-[var(--text-muted)]" /><span>{profileData.phone}</span></div>
          <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-[var(--text-muted)]" /><span>{profileData.email}</span></div>
          <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-[var(--text-muted)]" /><span>{profileData.address}</span></div>
          <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-[var(--text-muted)]" /><span>Inscrit depuis le {profileData.registeredSince}</span></div>
        </div>
      </Card>

      <Button variant="outline" className="w-full">Modifier le profil</Button>
    </AnimatedPage>
  );
}
