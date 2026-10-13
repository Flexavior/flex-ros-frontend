import React from 'react';
import { useParams } from 'react-router-dom';
import LeadDetail from './LeadDetail.jsx';
import RouteErrorBoundary from '../components/RouteErrorBoundary.jsx';

/** Remount detail state when route id changes (avoids stale error/white screen after failed load). */
export default function LeadDetailPage() {
  const { id } = useParams();
  return (
    <RouteErrorBoundary title="Lead detail could not load" backTo="/leads">
      <LeadDetail key={id} />
    </RouteErrorBoundary>
  );
}
