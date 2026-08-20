import { Settings as SettingsIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '@acme/ui';
import {
  ClientsContainer,
  ScheduleContainer,
  TemplatesSectionContainer,
} from '@acme/bison-ui';

/**
 * One route component per section — thin: read URL params, hand the
 * containers navigation callbacks. All real behavior lives behind the DI
 * seam (store → flows → `bison.*` gateway).
 */
export const AgendaRoute = () => {
  const navigate = useNavigate();
  return (
    <ScheduleContainer
      onOpenClient={(clientId) => navigate(`/clients/${clientId}`)}
    />
  );
};

export const ClientsRoute = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();
  return (
    <ClientsContainer
      clientId={clientId}
      onOpenClient={(id) => navigate(`/clients/${id}`)}
      onBack={() => navigate('/clients')}
    />
  );
};

export const TemplatesRoute = () => <TemplatesSectionContainer />;

export const SettingsRoute = () => (
  <EmptyState
    className="max-w-3xl"
    icon={<SettingsIcon />}
    title="Settings isn't designed yet"
    description="Agenda, Clients and Templates are live; this one lands next."
  />
);
