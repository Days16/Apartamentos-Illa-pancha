import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import Ico, { paths } from '../../components/Ico';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { path: '/gestion', label: 'Dashboard', icon: paths.home, exact: true },
  { path: '/gestion/reservas', label: 'Reservas', icon: paths.cal },
  { path: '/gestion/calendario', label: 'Calendario', icon: paths.building },
  //{ path: '/gestion/sync', label: 'Sincronización', icon: paths.sync },
  { path: '/gestion/mensajes', label: 'Mensajes', icon: paths.msg },
];

export default function GestionLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="sidebar-logo">
          <div
            className="sidebar-logo-text"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            Illa Pancha
          </div>
          <div className="sidebar-logo-sub">Panel gestión</div>
        </div>

        <div className="sidebar-nav">
          <div className="sidebar-section">Principal</div>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive(item) ? 'active' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <Ico d={item.icon} size={15} color="currentColor" />
              {item.label}
            </Link>
          ))}

          <div className="sidebar-section" style={{ marginTop: 16 }}>Acceso</div>
          <Link
            to="/admin"
            className="sidebar-item"
            style={{ textDecoration: 'none' }}
          >
            <Ico d={paths.settings} size={15} color="currentColor" />
            Administración
          </Link>
          <Link
            to="/"
            className="sidebar-item"
            style={{ textDecoration: 'none' }}
          >
            <Ico d={paths.eye} size={15} color="currentColor" />
            Ver web pública
          </Link>
          <button
            onClick={logout}
            className="sidebar-item"
            style={{
              background: 'none',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <Ico d={paths.lock} size={15} color="currentColor" />
            Cerrar sesión
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">A</div>
            <div>
              <div className="sidebar-user-name">Administrador</div>
              <div className="sidebar-user-role">{user?.email || 'info@illapancha.com'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        <Outlet />
      </div>
    </div >
  );
}
