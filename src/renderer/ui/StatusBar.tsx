import React from 'react';

export default function StatusBar({ cpu, lastSaved }: { cpu: number, lastSaved: string | null }) {
  const savedAt = lastSaved ? new Date(lastSaved) : null;
  const hhmm = savedAt ? savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  return (
    <div className="statusbar" role="status">
      <span>CPU: {cpu?.toFixed(1) ?? 0}%</span>
      <span>Saved at: {hhmm}</span>
      <span>Tips: Press 1–5 to toggle tracks</span>
    </div>
  );
}
