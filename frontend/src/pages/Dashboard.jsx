import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tasksAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityDot, Avatar, Spinner } from '../components/UI';
import { format, isPast, parseISO } from 'date-fns';

function StatCard({ label, value, color, sub }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 140 }}>
      <p style={{ fontSize: 12, color: '#8891a8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: color || '#e8eaf0', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: '#8891a8', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tasksAPI.dashboard().then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const statusMap = {};
  data?.by_status?.forEach(s => { statusMap[s.status] = parseInt(s.count); });
  const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

  return (
    <div className="fade-in" style={{ padding: '32px 36px', maxWidth: 900 }}>
      {/* Greeting */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: '#8891a8' }}>Here's your task overview for today.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <StatCard label="Total tasks" value={total} />
        <StatCard label="In progress" value={statusMap['in_progress'] || 0} color="#38bdf8" />
        <StatCard label="Done" value={statusMap['done'] || 0} color="#10b981" />
        <StatCard label="Overdue" value={data?.overdue_count || 0} color={data?.overdue_count > 0 ? '#f43f5e' : '#e8eaf0'} sub={data?.overdue_count > 0 ? 'needs attention' : 'all caught up'} />
      </div>

      {/* Task list */}
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17 }}>My active tasks</h2>
        <Link to="/projects" style={{ fontSize: 13, color: '#818cf8' }}>View projects →</Link>
      </div>

      {data?.tasks?.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: '#8891a8' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>✓</p>
          <p>No active tasks. Enjoy your free time!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data?.tasks?.map(task => {
            const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'done';
            return (
              <div key={task.id} className="card" style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px',
                borderLeft: `3px solid ${isOverdue ? '#f43f5e' : 'transparent'}`
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 500, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</p>
                  <p style={{ fontSize: 12, color: '#8891a8' }}>
                    <span style={{ color: '#6366f1' }}>{task.project_name}</span>
                    {task.due_date && (
                      <span style={{ color: isOverdue ? '#f43f5e' : '#8891a8' }}>
                        {' · '}Due {format(parseISO(task.due_date), 'MMM d')}
                      </span>
                    )}
                  </p>
                </div>
                <PriorityDot priority={task.priority} />
                <StatusBadge status={task.status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
