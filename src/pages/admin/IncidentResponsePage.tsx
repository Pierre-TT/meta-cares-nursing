import { Siren, AlertTriangle, Shield, Clock3, FileText, CheckCircle, Users, Bell } from 'lucide-react';
import { Badge, Button, Card, CardHeader, CardTitle, AnimatedPage, GradientHeader } from '@/design-system';
import { useAdminPlatformData } from '@/hooks/usePlatformData';

export function IncidentResponsePage() {
  const { data } = useAdminPlatformData();
  const incidents = data.incidents.active;
  const nearestDeadline = incidents.length > 0 ? Math.min(...incidents.map((incident) => Number.parseInt(incident.deadline, 10))) : 0;
  const apdReviewCount = incidents.filter((incident) => incident.apd).length;
  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Siren className="h-5 w-5" />}
        title="Incident response"
        subtitle="Breach workflow, compteurs 72h et coordination DPO/APD"
        badge={<Badge variant="red">{incidents.length} cas actifs</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{incidents.length}</p>
            <p className="text-[10px] text-white/60">Incidents actifs</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{nearestDeadline}h</p>
            <p className="text-[10px] text-white/60">Échéance la plus proche</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{apdReviewCount}</p>
            <p className="text-[10px] text-white/60">Pré-notification APD</p>
          </div>
        </div>
      </GradientHeader>

      <Card className="border-l-4 border-l-mc-red-500">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-mc-red-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">72-hour governance clock started</p>
            <p className="text-xs text-[var(--text-muted)]">{data.incidents.governanceNotice}</p>
          </div>
          <Badge variant="red">72h</Badge>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Board incidents</CardTitle>
            <Badge variant="outline">Containment</Badge>
          </CardHeader>
          <div className="space-y-3">
            {incidents.map((incident) => (
              <div key={incident.title} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{incident.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">{incident.opened}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Owner {incident.owner}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={incident.severity === 'high' ? 'red' : 'amber'}>
                      {incident.severity === 'high' ? 'Critique' : 'Majeur'}
                    </Badge>
                    <Badge variant={incident.status === 'containment' ? 'blue' : 'outline'}>
                      {incident.status === 'containment' ? 'Containment' : 'Investigation'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs">
                  <span className="text-[var(--text-muted)]">{incident.deadline}</span>
                  <Badge variant={incident.apd ? 'red' : 'amber'}>{incident.apd ? 'APD en revue' : 'DPO only'}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow réglementaire</CardTitle>
            <Badge variant="blue">DPO runbook</Badge>
          </CardHeader>
          <div className="space-y-3">
            {data.incidents.workflow.map((step) => (
              <div key={step.step} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {step.state === 'done' ? <CheckCircle className="h-4 w-4 text-mc-green-500" /> : step.state === 'active' ? <Clock3 className="h-4 w-4 text-mc-amber-500" /> : <Shield className="h-4 w-4 text-mc-blue-500" />}
                    <p className="text-sm font-medium">{step.step}</p>
                  </div>
                  <Badge variant={step.state === 'done' ? 'green' : step.state === 'active' ? 'amber' : 'outline'}>
                    {step.state === 'done' ? 'Fait' : step.state === 'active' ? 'En cours' : 'À lancer'}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">{step.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Exercices & post-mortems</CardTitle>
            <Badge variant="green">Preparedness</Badge>
          </CardHeader>
          <div className="space-y-2">
            {data.incidents.exercises.map((exercise) => (
              <div key={exercise.name} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-mc-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{exercise.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{exercise.date}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={exercise.status === 'ok' ? 'green' : 'amber'}>
                    {exercise.status === 'ok' ? 'Validé' : 'À corriger'}
                  </Badge>
                  <span className="text-[10px] text-[var(--text-muted)]">{exercise.result}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documentation requise</CardTitle>
            <Badge variant="outline">Evidence</Badge>
          </CardHeader>
          <div className="space-y-3">
            {data.incidents.documentation.map((item) => {
              const Icon = item.tone === 'blue' ? FileText : Bell;
              return (
                <div key={item.title} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${item.tone === 'blue' ? 'text-mc-blue-500' : 'text-mc-amber-500'}`} />
                    <p className="text-sm font-medium">{item.title}</p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{item.detail}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="justify-start">
          <FileText className="h-4 w-4" />
          Ouvrir runbook 72h
        </Button>
        <Button variant="gradient" className="justify-start">
          <Siren className="h-4 w-4" />
          Lancer exercice table-top
        </Button>
      </div>
    </AnimatedPage>
  );
}
