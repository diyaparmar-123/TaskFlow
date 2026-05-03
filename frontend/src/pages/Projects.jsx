import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../api';
import { Modal, FormField, EmptyState, Spinner, ProgressBar } from '../components/UI';

function CreateProjectModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await projectsAPI.create(form);
      onCreate(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="New project" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Project name">
          <input
            type="text" placeholder="e.g. Marketing Redesign" required
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </FormField>
        <FormField label="Description (optional)">
          <textarea
            placeholder="What is this project about?"
            rows={3} value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            style={{ resize: 'vertical' }}
          />
        </FormField>
        {error && <p style={{ color: '#f43f5e', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const STATUS_COLORS = { active: '#10b981', archived: '#8891a8', completed: '#6366f1' };

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    projectsAPI.list().then(res => setProjects(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="fade-in" style={{ padding: '32px 36px', maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800 }}>Projects</h1>
          <p style={{ color: '#8891a8', fontSize: 14 }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New project</button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon="◈"
          title="No projects yet"
          subtitle="Create your first project to start organizing tasks and collaborating with your team."
          action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create a project</button>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {projects.map(p => (
            <div
              key={p.id}
              className="card"
              onClick={() => navigate(`/projects/${p.id}`)}
              style={{ cursor: 'pointer', transition: 'border-color 0.15s', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(129,140,248,0.15))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: '#818cf8'
                }}>◈</div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                  background: `${STATUS_COLORS[p.status]}20`,
                  color: STATUS_COLORS[p.status],
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>{p.status}</span>
              </div>

              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, marginBottom: 6 }}>{p.name}</h3>
              {p.description && (
                <p style={{
                  fontSize: 13, color: '#8891a8', marginBottom: 16,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>{p.description}</p>
              )}

              <div style={{ marginBottom: 16 }}>
                <ProgressBar value={parseInt(p.done_count) || 0} max={parseInt(p.task_count) || 0} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8891a8' }}>
                <span>👥 {p.member_count} member{p.member_count !== '1' ? 's' : ''}</span>
                <span>📋 {p.task_count} tasks</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreate={p => setProjects(ps => [p, ...ps])}
        />
      )}
    </div>
  );
}
