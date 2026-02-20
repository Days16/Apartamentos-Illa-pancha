import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import Ico, { paths } from '../../components/Ico';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { path: '/admin', label: 'Apartamentos', icon: paths.building, exact: true },
  { path: '/admin/precios', label: 'Precios', icon: paths.tag },
  { path: '/admin/ofertas', label: 'Ofertas', icon: paths.star },
  { path: '/admin/extras', label: 'Extras', icon: paths.plus },
  { path: '/admin/cancelacion', label: 'Cancelación', icon: paths.cash },
  { path: '/admin/pagos', label: 'Pagos', icon: paths.lock },
  { path: '/admin/ical', label: 'Canales iCal', icon: paths.sync },
  { path: '/admin/usuarios', label: 'Usuarios', icon: paths.users },
  { path: '/admin/web', label: 'Textos web', icon: paths.edit },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="dashboard admin-sidebar">
      <div className="sidebar" style={{ background: '#1C1810' }}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-text" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            Illa Pancha
          </div>
          <div className="sidebar-logo-sub">⚙ Administración</div>
        </div>

        <div className="sidebar-nav">
          <div className="sidebar-section">Contenido</div>
          {navItems.slice(0, 3).map(item => (
            <Link key={item.path} to={item.path} className={`sidebar-item ${isActive(item) ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
              <Ico d={item.icon} size={15} />{item.label}
            </Link>
          ))}

          <div className="sidebar-section">Configuración</div>
          {navItems.slice(3).map(item => (
            <Link key={item.path} to={item.path} className={`sidebar-item ${isActive(item) ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
              <Ico d={item.icon} size={15} />{item.label}
            </Link>
          ))}

          <div className="sidebar-section" style={{ marginTop: 16 }}>Acceso</div>
          <Link to="/gestion" className="sidebar-item" style={{ textDecoration: 'none' }}>
            <Ico d={paths.home} size={15} />Panel gestión
          </Link>
          <Link to="/" className="sidebar-item" style={{ textDecoration: 'none' }}>
            <Ico d={paths.eye} size={15} />Ver web pública
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
              <div className="sidebar-user-name">Propietario</div>
              <div className="sidebar-user-role">{user?.email || 'Admin total'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}
