import React, { useEffect, useState } from 'react';
import { Package, CheckCircle, XCircle, TrendingUp, ExternalLink } from 'lucide-react';
import { fetchProducts, fetchConfig } from '../../api';
import type { Product, ShopConfig } from '../../types';

const AdminDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<ShopConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchProducts({ limit: 500 }), fetchConfig()])
      .then(([prodRes, confRes]) => {
        setProducts(prodRes.data.products);
        setConfig(confRes.data.config);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const available = products.filter((p) => p.isAvailable).length;
  const unavailable = products.length - available;
  const categories = Array.from(new Set(products.map((p) => p.category)));

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-dark" />
        <span>Loading dashboard…</span>
      </div>
    );
  }

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-page-title">Dashboard</div>
      <div className="admin-page-subtitle">Welcome back! Here's your store overview.</div>

      {/* Store Status Banner */}
      {config && !config.isStoreOpen && (
        <div style={{
          background: 'var(--danger-light)',
          border: '1.5px solid var(--danger)',
          borderRadius: 'var(--radius)',
          padding: '0.875rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: 'var(--danger)',
          fontWeight: 600,
          fontSize: 'var(--fs-sm)',
        }}>
          <XCircle size={18} />
          Store is currently <strong>CLOSED</strong>. Go to Settings to open it.
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-green"><Package size={20} /></div>
          <div className="stat-label">Total Products</div>
          <div className="stat-value">{products.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green"><CheckCircle size={20} /></div>
          <div className="stat-label">Available</div>
          <div className="stat-value">{available}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-red"><XCircle size={20} /></div>
          <div className="stat-label">Out of Stock</div>
          <div className="stat-value">{unavailable}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-amber"><TrendingUp size={20} /></div>
          <div className="stat-label">Categories</div>
          <div className="stat-value">{categories.length}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: 'var(--fs-base)', marginBottom: '0.75rem', color: 'var(--gray-900)' }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <a href="/admin/products" className="btn btn-primary btn-sm">
              <Package size={14} /> Manage Products
            </a>
            <a href="/" target="_blank" rel="noopener" className="btn btn-outline btn-sm">
              <ExternalLink size={14} /> View Live Store
            </a>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: 'var(--fs-base)', marginBottom: '0.75rem', color: 'var(--gray-900)' }}>
            Store Info
          </h3>
          <div style={{ fontSize: 'var(--fs-sm)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div><span style={{ color: 'var(--gray-500)' }}>Shop Name:</span> <strong>{config?.shopName}</strong></div>
            <div><span style={{ color: 'var(--gray-500)' }}>WhatsApp:</span> <strong>+{config?.whatsappNumber}</strong></div>
            <div><span style={{ color: 'var(--gray-500)' }}>Status:</span>{' '}
              <span className={`badge ${config?.isStoreOpen ? 'badge-success' : 'badge-danger'}`}>
                {config?.isStoreOpen ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Products */}
      {products.length > 0 && (
        <div className="table-wrap">
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1.5px solid var(--gray-100)', fontWeight: 700, fontSize: 'var(--fs-base)' }}>
            Recent Products
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 8).map((p) => (
                <tr key={p._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {p.imageUrl ? (
                        <img className="admin-product-img" src={p.imageUrl} alt={p.name} />
                      ) : (
                        <div className="admin-product-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-100)' }}>
                          <Package size={18} style={{ color: 'var(--gray-400)' }} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--gray-500)' }}>{p.unit}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-primary">{p.category}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{p.price.toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`badge ${p.isAvailable ? 'badge-success' : 'badge-danger'}`}>
                      {p.isAvailable ? 'Available' : 'Out of Stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
