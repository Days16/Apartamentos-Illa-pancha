export default function Usuarios() {
  const users = [
    { name: 'Propietario', email: 'info@illapancha.com', role: 'Admin', apts: 'Todos', avatar: 'P', lastLogin: 'Hoy, 09:14' },
    { name: 'Carmen López', email: 'carmen@illapancha.com', role: 'Manager', apts: 'Cantábrico, Ribadeo, Eo', avatar: 'C', lastLogin: 'Ayer, 18:32' },
  ];

  return (
    <>
      <div className="main-header">
        <div><div className="main-title">Usuarios del panel</div></div>
        <button className="action-btn">+ Invitar usuario</button>
      </div>

      <div className="main-body">
        <div className="card" style={{ marginBottom: 16 }}>
          {users.map((u, i) => (
            <div
              key={i}
              className="table-row"
              style={{ gridTemplateColumns: '40px 1.5fr 1.5fr 1.5fr 80px 100px auto', alignItems: 'center', gap: 16 }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: 14, fontWeight: 700 }}>
                {u.avatar}
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{u.email}</div>
              </div>
              <div style={{ fontSize: 12, color: '#475569' }}>{u.apts}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Último acceso: {u.lastLogin}</div>
              <span className={`badge ${u.role === 'Admin' ? 'badge-blue' : 'badge-gray'}`}>{u.role}</span>
              <span className="badge badge-green">Activo</span>
              <button className="action-btn action-btn-outline" style={{ padding: '4px 12px', fontSize: 11 }}>Editar</button>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: '#0f172a', marginBottom: 8 }}>
            Roles disponibles
          </div>
          {[
            { role: 'Admin', desc: 'Acceso total. Puede configurar pagos, precios, cancelaciones y usuarios.', badge: 'badge-blue' },
            { role: 'Manager', desc: 'Puede ver y gestionar reservas, mensajes y el calendario. No puede tocar configuración.', badge: 'badge-gray' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: i < 1 ? '1px solid rgba(15,23,42,0.06)' : 'none', alignItems: 'flex-start' }}>
              <span className={`badge ${r.badge}`} style={{ marginTop: 2 }}>{r.role}</span>
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
