import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Settings, LogOut, Menu, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AdminLayout: React.FC = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/admin/products', icon: <Package size={18} />, label: 'Products' },
    { to: '/admin/settings', icon: <Settings size={18} />, label: 'Settings' },
  ];

  const SidebarContent = () => (
    <>
      <div className="admin-sidebar-logo">
        <div className="header-logo" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="header-logo-icon">
              <ShoppingBag size={18} />
            </div>
            <div>
              <div className="header-shop-name" style={{ fontSize: '1rem' }}>Admin Panel</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{admin?.email}</div>
            </div>
          </div>
        </div>
      </div>
      <nav className="admin-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          <NavLink to="/" className="admin-nav-item" target="_blank" rel="noopener">
            <ShoppingBag size={18} /> View Store
          </NavLink>
          <button className="admin-nav-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>
    </>
  );

  return (
    <div className="admin-layout">
      {/* Desktop sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 49 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="admin-content">
        <div className="admin-topbar">
          <button
            className="btn btn-ghost btn-sm hide-desktop"
            onClick={() => setSidebarOpen(true)}
            style={{ marginRight: '0.5rem' }}
          >
            <Menu size={18} />
          </button>
          <span className="font-semibold" style={{ color: 'var(--gray-700)' }}>
            PatakhaShop Admin
          </span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            <LogOut size={16} />
            <span className="hide-mobile">Logout</span>
          </button>
        </div>
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
