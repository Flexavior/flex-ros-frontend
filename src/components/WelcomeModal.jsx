import React, { useEffect, useState } from 'react';
import HelpModal from './HelpModal.jsx';

function notificationLines(user) {
  const list = user?.system_notifications;
  if (!Array.isArray(list) || !list.length) return [];
  return list.map((n) => (typeof n === 'string' ? n : n.body)).filter(Boolean);
}

export default function WelcomeModal({ user, onDismiss }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (!user?.id || !user.welcome_kind) return;
    const key = `mss_welcome_${user.id}_${user.welcome_kind}`;
    if (sessionStorage.getItem(key)) return;

    const name = user.name || 'there';
    setTitle(user.welcome_kind === 'first' ? 'Welcome' : 'Welcome back');
    const lines = [
      user.welcome_kind === 'first' ? `Welcome ${name}.` : `Welcome back ${name}.`,
    ];
    const notices = notificationLines(user);
    if (notices.length) {
      lines.push('', 'System notifications:');
      notices.forEach((t) => lines.push(`• ${t}`));
    }
    setBody(lines.join('\n'));
    setOpen(true);
    sessionStorage.setItem(key, '1');
  }, [user]);

  const close = () => {
    setOpen(false);
    onDismiss?.();
  };

  if (!open) return null;

  return (
    <HelpModal open={open} title={title} onClose={close}>
      <p className="help-modal-text" style={{ whiteSpace: 'pre-line' }}>{body}</p>
      <p style={{ marginTop: 16 }}>
        <button type="button" className="primary" onClick={close}>OK</button>
      </p>
    </HelpModal>
  );
}
