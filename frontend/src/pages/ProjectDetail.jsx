import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, tasksAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Modal, FormField, StatusBadge, PriorityDot, Avatar, Spinner } from '../components/UI';
import { format, isPast, parseISO } from 'date-fns';

function TaskCard({ task, members, onUpdate, onDelete, myRole }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...task, due_date: task.due_date ? task.due_date.slice(0, 10) : '' });
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'done';

  const handleSave = async () => {
    try {
      const res = await tasksAPI.update(task.id, form);
      onUpdate(res.data);
      setEditing(false);
    } catch {}
  };

  if (editing) {
    return (
      <div className="card" style={{ marginBottom: 8 }}>
        <input
          value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          style={{ marginBottom: 8 }} placeholder="Task title"
        />
        <textarea
          value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={2} style={{ marginBottom: 8, resize: 'vertical' }} placeholder="Description"
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select value={form.assignee_id || ''} onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value || null }))}>
            <option value="">Unassigned</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} style={{ marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>Save</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
          <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }} onClick={() => onDelete(task.id)}>Delete</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        marginBottom: 8, cursor: 'pointer', padding: '14px 16px',
        borderLeft: `3px solid ${isOverdue ? '#f43f5e' : 'transparent'}`,
        transition: 'border-color 0.15s'
      }}
      onClick={() => setEditing(true)}
      onMouseEnter={e => { if (!isOverdue) e.currentTarget.style.borderLeftColor = '#6366f1'; }}
      onMouseLeave={e => { if (!isOverdue) e.currentTarget.style.borderLeftColor = 'transparent'; }}
    >
      <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 6 }}>{task.title}</p>
      {task.description && <p style={{ fontSize: 12, color: '#8891a8', marginBottom: 8 }}>{task.description.slice(0, 80)}{task.description.length > 80 ? '...' : ''}</p>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <PriorityDot priority={task.priority} />
        {task.assignee_name && <Avatar name={task.assignee_name} color={task.assignee_color} size={20} />}
        {task.due_date && (
          <span style={{ fontSize: 11, color: isOverdue ? '#f43f5e' : '#8891a8', marginLeft: 'auto' }}>
            {isOverdue ? '⚠ ' : ''}Due {format(parseISO(task.due_date), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  );
}

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: '#555f78' },
  { key: 'in_progress', label: 'In Progress', color: '#38bdf8' },
  { key: 'review', label: 'Review', color: '#f59e0b' },
  { key: 'done', label: 'Done', color: '#10b981' }
];

function CreateTaskModal({ projectId, members, onClose, onCreate }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo', assignee_id: '', due_date: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await tasksAPI.create({
        ...form, project_id: projectId,
        assignee_id: form.assignee_id || null,
        due_date: form.due_date || null
      });
      onCreate(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Create task" onClose={onClose} width={480}>
      <form onSubmit={handleSubmit}>
        <FormField label="Task title">
          <input type="text" required placeholder="What needs to be done?" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </FormField>
        <FormField label="Description">
          <textarea rows={3} placeholder="More details..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Priority">
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </FormField>
          <FormField label="Status">
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </FormField>
        </div>
        <FormField label="Assign to">
          <select value={form.assignee_id} onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))}>
            <option value="">Unassigned</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </FormField>
        <FormField label="Due date">
          <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
        </FormField>
        {error && <p style={{ color: '#f43f5e', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create task'}</button>
        </div>
      </form>
    </Modal>
  );
}

function MembersModal({ projectId, members, myRole, onClose, onUpdate }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await projectsAPI.addMember(projectId, { email, role });
      setSuccess(`${email} added!`);
      setEmail('');
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    if (!confirm('Remove this member?')) return;
    await projectsAPI.removeMember(projectId, userId);
    onUpdate();
  };

  return (
    <Modal title="Team members" onClose={onClose} width={460}>
      {myRole === 'admin' && (
        <form onSubmit={handleAdd} style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: '#8891a8', marginBottom: 12 }}>Invite by email (user must have an account)</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input type="email" placeholder="colleague@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <select value={role} onChange={e => setRole(e.target.value)} style={{ width: 120 }}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <p style={{ color: '#f43f5e', fontSize: 12, marginBottom: 6 }}>{error}</p>}
          {success && <p style={{ color: '#10b981', fontSize: 12, marginBottom: 6 }}>{success}</p>}
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
            {loading ? 'Adding...' : 'Add member'}
          </button>
        </form>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {members.map(m => (
          <div key={m.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px', background: 'rgba(255,255,255,0.03)',
            borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <Avatar name={m.name} color={m.avatar_color} size={34} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</p>
              <p style={{ fontSize: 12, color: '#8891a8' }}>{m.email}</p>
            </div>
            <span style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 99,
              background: m.role === 'admin' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
              color: m.role === 'admin' ? '#818cf8' : '#8891a8',
              fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>{m.role}</span>
            {myRole === 'admin' && (
              <button className="btn btn-ghost btn-sm" onClick={() => handleRemove(m.id)} style={{ color: '#f43f5e', padding: '4px 8px' }}>✕</button>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [activeTab, setActiveTab] = useState('board');

  const myRole = members.find(m => m.id === user?.id)?.role || (project?.owner_id === user?.id ? 'admin' : 'member');

  const load = async () => {
    try {
      const [proj, taskList, memberList] = await Promise.all([
        projectsAPI.get(projectId),
        tasksAPI.forProject(projectId),
        projectsAPI.getMembers(projectId)
      ]);
      setProject(proj.data);
      setTasks(taskList.data);
      setMembers(memberList.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [projectId]);

  const handleUpdate = (updated) => setTasks(ts => ts.map(t => t.id === updated.id ? updated : t));
  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    await tasksAPI.delete(id);
    setTasks(ts => ts.filter(t => t.id !== id));
  };

  if (loading) return <Spinner />;
  if (!project) return <div style={{ padding: 40 }}>Project not found.</div>;

  const byStatus = (status) => tasks.filter(t => t.status === status);

  return (
    <div className="fade-in" style={{ padding: '32px 36px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <button onClick={() => navigate('/projects')} style={{ background: 'none', color: '#8891a8', fontSize: 13, marginBottom: 12, padding: 0, border: 'none' }}>
          ← Projects
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{project.name}</h1>
            {project.description && <p style={{ color: '#8891a8', fontSize: 14 }}>{project.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowMembers(true)}>
              👥 Members ({members.length})
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Task</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 0 }}>
        {['board', 'list'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none', border: 'none', padding: '8px 16px',
              color: activeTab === tab ? '#e8eaf0' : '#8891a8',
              borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
              fontWeight: activeTab === tab ? 500 : 400, fontSize: 14, cursor: 'pointer',
              textTransform: 'capitalize', transition: 'all 0.15s', marginBottom: -1
            }}
          >{tab === 'board' ? '▦ Board' : '☰ List'}</button>
        ))}
      </div>

      {/* Board view */}
      {activeTab === 'board' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'start' }}>
          {COLUMNS.map(col => (
            <div key={col.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>{col.label}</span>
                <span style={{
                  marginLeft: 'auto', fontSize: 12, padding: '1px 7px', borderRadius: 99,
                  background: 'rgba(255,255,255,0.06)', color: '#8891a8'
                }}>{byStatus(col.key).length}</span>
              </div>
              <div>
                {byStatus(col.key).map(task => (
                  <TaskCard
                    key={task.id} task={task} members={members}
                    onUpdate={handleUpdate} onDelete={handleDelete} myRole={myRole}
                  />
                ))}
                {byStatus(col.key).length === 0 && (
                  <div style={{
                    height: 80, border: '1.5px dashed rgba(255,255,255,0.08)',
                    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#555f78', fontSize: 12
                  }}>Empty</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {activeTab === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 800 }}>
          {tasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8891a8' }}>No tasks yet. Create your first one!</div>
          )}
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} members={members} onUpdate={handleUpdate} onDelete={handleDelete} myRole={myRole} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateTaskModal
          projectId={projectId} members={members}
          onClose={() => setShowCreate(false)}
          onCreate={t => setTasks(ts => [t, ...ts])}
        />
      )}
      {showMembers && (
        <MembersModal
          projectId={projectId} members={members} myRole={myRole}
          onClose={() => setShowMembers(false)}
          onUpdate={() => projectsAPI.getMembers(projectId).then(r => setMembers(r.data))}
        />
      )}
    </div>
  );
}
