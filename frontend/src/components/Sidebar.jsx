import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './UI';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '⬡' },
  { to: '/projects', label: 'Projects', icon: '◈' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside style={{
      width: 220, flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
      background: '#13161f', borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', padding: '24px 0'
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: '#fff'
          }}>T</div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, letterSpacing: '-0.3px' }}>
            Task<span style={{ color: '#6366f1' }}>Flow</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10, marginBottom: 4,
              color: isActive ? '#e8eaf0' : '#8891a8',
              background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
              fontWeight: isActive ? 500 : 400,
              fontSize: 14, transition: 'all 0.15s',
              textDecoration: 'none',
              ...(isActive ? {} : {})
            })}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '0 12px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px', borderRadius: 10,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)'
        }}>
          <Avatar name={user?.name} color={user?.avatar_color} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
            <p style={{ fontSize: 11, color: '#8891a8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{ background: 'none', color: '#555f78', fontSize: 16, padding: 4, borderRadius: 6, border: 'none' }}
            onMouseEnter={e => e.target.style.color = '#f43f5e'}
            onMouseLeave={e => e.target.style.color = '#555f78'}
          >⏻</button>
        </div>
      </div>
    </aside>
  );
}
