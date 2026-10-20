import React, { useState, useEffect } from 'react';
import { Save, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchConfig, updateConfig } from '../../api';
import type { ShopConfig } from '../../types';

const AdminSettings: React.FC = () => {
  const [config, setConfig] = useState<Partial<ShopConfig>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    fetchConfig()
      .then((res) => setConfig(res.data.config))
      .catch(() => toast.error('Failed to load settings.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateConfig(config);
      setConfig(res.data.config);
      toast.success('Settings saved successfully!');
    } catch {
      toast.error('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    if (config.categories?.includes(newCategory.trim())) {
      toast.error('Category already exists.');
      return;
    }
    setConfig((p) => ({ ...p, categories: [...(p.categories || []), newCategory.trim()] }));
    setNewCategory('');
  };

  const removeCategory = (cat: string) => {
    setConfig((p) => ({ ...p, categories: (p.categories || []).filter((c) => c !== cat) }));
  };

  if (isLoading) {
    return <div className="page-loading"><div className="spinner spinner-dark" /><span>Loading settings…</span></div>;
  }

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-page-title">Settings</div>
      <div className="admin-page-subtitle">Manage your shop configuration</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: '1.5rem' }}>
        {/* General */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--gray-900)' }}>
            General Information
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Shop Name</label>
              <input
                className="form-control"
                type="text"
                value={config.shopName || ''}
                onChange={(e) => setConfig((p) => ({ ...p, shopName: e.target.value }))}
                id="setting-shop-name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tagline</label>
              <input
                className="form-control"
                type="text"
                placeholder="Quality products at great prices"
                value={config.tagline || ''}
                onChange={(e) => setConfig((p) => ({ ...p, tagline: e.target.value }))}
                id="setting-tagline"
              />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp Number (international format)</label>
              <input
                className="form-control"
                type="text"
                placeholder="919610684627"
                value={config.whatsappNumber || ''}
                onChange={(e) => setConfig((p) => ({ ...p, whatsappNumber: e.target.value.replace(/\D/g, '') }))}
                id="setting-whatsapp"
              />
              <span className="form-hint">Format: 91XXXXXXXXXX (no + or spaces)</span>
            </div>
            <div className="form-group">
              <label className="form-label">Announcement Banner</label>
              <input
                className="form-control"
                type="text"
                placeholder="e.g., Free delivery above ₹500"
                value={config.announcementBanner || ''}
                onChange={(e) => setConfig((p) => ({ ...p, announcementBanner: e.target.value }))}
                id="setting-banner"
              />
              <span className="form-hint">Displayed at the top of the store. Leave empty to hide.</span>
            </div>
            <div className="form-group">
              <label className="form-label">Footer Text</label>
              <textarea
                className="form-control"
                placeholder="Custom footer message"
                value={config.footerText || ''}
                onChange={(e) => setConfig((p) => ({ ...p, footerText: e.target.value }))}
                id="setting-footer"
              />
            </div>
          </div>
        </div>

        {/* Store Status & Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--gray-900)' }}>
              Store Status
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>Store Open for Orders</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--gray-500)', marginTop: '2px' }}>
                  When closed, a notice is shown in the admin dashboard.
                </div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={config.isStoreOpen !== false}
                  onChange={(e) => setConfig((p) => ({ ...p, isStoreOpen: e.target.checked }))}
                  id="setting-store-open"
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          {/* Categories */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--gray-900)' }}>
              Product Categories
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {(config.categories || []).map((cat) => (
                <span key={cat} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  background: 'var(--primary-light)', color: 'var(--primary)',
                  borderRadius: 'var(--radius-full)', padding: '0.3rem 0.75rem',
                  fontSize: 'var(--fs-xs)', fontWeight: 600,
                }}>
                  {cat}
                  <button
                    onClick={() => removeCategory(cat)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'inherit', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                className="form-control"
                type="text"
                placeholder="New category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                id="add-category"
              />
              <button className="btn btn-outline btn-sm" onClick={addCategory}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Delivery Options */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 700, marginBottom: '1rem', color: 'var(--gray-900)' }}>
              Delivery Options
            </h3>
            {['Pickup', 'Delivery', 'Home Delivery'].map((opt) => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.625rem', cursor: 'pointer', fontSize: 'var(--fs-sm)' }}>
                <input
                  type="checkbox"
                  checked={(config.deliveryOptions || []).includes(opt)}
                  onChange={(e) => {
                    const current = config.deliveryOptions || [];
                    setConfig((p) => ({
                      ...p,
                      deliveryOptions: e.target.checked
                        ? [...current, opt]
                        : current.filter((d) => d !== opt),
                    }));
                  }}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={isSaving} id="save-settings">
          {isSaving ? <><span className="spinner" /> Saving…</> : <><Save size={16} /> Save Settings</>}
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
