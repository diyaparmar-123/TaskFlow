import { useState } from 'react';

export function Avatar({ name, color, size = 32 }) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color || '#6366f1',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 600, color: '#fff',
      flexShrink: 0, fontFamily: 'DM Sans, sans-serif',
      border: '2px solid rgba(255,255,255,0.1)'
    }}>
      {initials}
    </div>
  );
}

export function StatusBadge({ status }) {
  const labels = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
  return <span className={`tag badge-${status}`}>{labels[status] || status}</span>;
}

export function PriorityDot({ priority }) {
  const colors = { low: '#10b981', medium: '#f59e0b', high: '#f43f5e', critical: '#ff3d3d' };
  const labels = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: colors[priority] }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors[priority], display: 'inline-block' }} />
      {labels[priority]}
    </span>
  );
}

export function Modal({ title, onClose, children, width = 500 }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20, backdropFilter: 'blur(4px)'
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="fade-in" style={{
        background: '#1a1e2a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, padding: 28, width: '100%', maxWidth: width,
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18 }}>{title}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: 18 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FormField({ label, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: 'block', fontSize: 13, color: '#8891a8', marginBottom: 6, fontWeight: 500 }}>{label}</label>}
      {children}
      {error && <p style={{ color: '#f43f5e', fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontFamily: 'Syne, sans-serif', marginBottom: 8 }}>{title}</h3>
      <p style={{ color: '#8891a8', marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>{subtitle}</p>
      {action}
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div className="spinner" />
    </div>
  );
}

export function ProgressBar({ value, max }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8891a8', marginBottom: 4 }}>
        <span>{pct}% done</span>
        <span>{value}/{max} tasks</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: pct === 100 ? '#10b981' : 'linear-gradient(90deg, #6366f1, #818cf8)',
          borderRadius: 99, transition: 'width 0.4s ease'
        }} />
      </div>
    </div>
  );
}
