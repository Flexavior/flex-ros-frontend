import React from 'react';
import { Link } from 'react-router-dom';

export default class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Route render error:', error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    const title = this.props.title || 'Something went wrong';
    return (
      <div className="card" role="alert">
        <h1 className="page-title">{title}</h1>
        <p className="error-text">{error.message || 'This page could not be displayed.'}</p>
        <p className="kpi-sub">Try refreshing. If the problem continues, contact your supervisor or system admin.</p>
        <p style={{ marginTop: 12 }}>
          <Link to={this.props.backTo || '/leads'}>← Back</Link>
        </p>
      </div>
    );
  }
}
