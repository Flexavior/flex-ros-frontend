import React from 'react';
import { useParams } from 'react-router-dom';
import CustomerDetail from './CustomerDetail.jsx';

export default function CustomerDetailPage() {
  const { id } = useParams();
  return <CustomerDetail key={id} />;
}
