import React from 'react';
import { useParams } from 'react-router-dom';
import LeadDetail from './LeadDetail.jsx';

/** Remount detail state when route id changes (avoids stale error/white screen after failed load). */
export default function LeadDetailPage() {
  const { id } = useParams();
  return <LeadDetail key={id} />;
}
