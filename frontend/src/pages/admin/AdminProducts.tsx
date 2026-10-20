import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, Package, X, Upload, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchProducts, createProduct, updateProduct, deleteProduct, fetchConfig } from '../../api';
import type { Product, ShopConfig } from '../../types';

// ─── Product Form Modal ────────────────────────────────────────────────────────
const ProductFormModal: React.FC<{
  product: Product | null;
  categories: string[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ product, categories, onClose, onSaved }) => {
  const isEdit = !!product;
  const validCategories = categories.filter((c) => c !== 'All');
  const [formData, setFormData] = useState({
    name: product?.name || '',
    price: product?.price?.toString() || '',
    unit: product?.unit || 'per piece',
    category: product?.category || validCategories[0] || 'Sparklers',
    description: product?.description || '',
    isAvailable: product?.isAvailable !== false,
    newCategory: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(product?.imageUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [useNewCategory, setUseNewCategory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Product name is required';
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) < 0)
      errs.price = 'Enter a valid price';
    if (!formData.unit.trim()) errs.unit = 'Unit is required';
    const cat = useNewCategory ? formData.newCategory : formData.category;
    if (!cat.trim()) errs.category = 'Category is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    const fd = new FormData();
    fd.append('name', formData.name.trim());
    fd.append('price', formData.price);
    fd.append('unit', formData.unit.trim());
    fd.append('category', useNewCategory ? formData.newCategory.trim() : formData.category);
    fd.append('description', formData.description.trim());
    fd.append('isAvailable', formData.isAvailable.toString());
    if (imageFile) fd.append('image', imageFile);

    try {
      if (isEdit) {
        await updateProduct(product!._id, fd);
        toast.success('Product updated!');
      } else {
        await createProduct(fd);
        toast.success('Product added!');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button className="cart-close" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Image Upload */}
            <div>
              <label className="form-label">Product Photo</label>
              <div
                className="upload-zone"
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: '1rem', cursor: 'pointer' }}
              >
                {imagePreview ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(0,0,0,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '8px', opacity: 0, transition: 'opacity 0.2s',
                    }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0')}
                    >
                      <Upload size={24} color="white" />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--gray-500)' }}>
                    <Upload size={28} />
                    <span style={{ fontSize: 'var(--fs-sm)' }}>Click to upload image</span>
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--gray-400)' }}>JPEG, PNG, WebP • max 5MB</span>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} id="image-upload" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Product Name <span className="required">*</span></label>
                <input
                  className={`form-control ${errors.name ? 'error' : ''}`}
                  type="text"
                  placeholder="e.g., Red Rose Sparkler"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  id="product-name"
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Price (₹) <span className="required">*</span></label>
                <input
                  className={`form-control ${errors.price ? 'error' : ''}`}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                  id="product-price"
                />
                {errors.price && <span className="form-error">{errors.price}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Unit / Pack Size <span className="required">*</span></label>
                <input
                  className={`form-control ${errors.unit ? 'error' : ''}`}
                  type="text"
                  placeholder="e.g., per piece, 10-pack"
                  value={formData.unit}
                  onChange={(e) => setFormData((p) => ({ ...p, unit: e.target.value }))}
                  id="product-unit"
                />
                {errors.unit && <span className="form-error">{errors.unit}</span>}
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Category <span className="required">*</span></label>
                {!useNewCategory ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      className={`form-control ${errors.category ? 'error' : ''}`}
                      value={formData.category}
                      onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                      id="product-category"
                    >
                      {validCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setUseNewCategory(true)}>
                      + New
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      className={`form-control ${errors.category ? 'error' : ''}`}
                      type="text"
                      placeholder="New category name"
                      value={formData.newCategory}
                      onChange={(e) => setFormData((p) => ({ ...p, newCategory: e.target.value }))}
                      autoFocus
                    />
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setUseNewCategory(false)}>
                      Cancel
                    </button>
                  </div>
                )}
                {errors.category && <span className="form-error">{errors.category}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                placeholder="Optional product description…"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                id="product-description"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData((p) => ({ ...p, isAvailable: e.target.checked }))}
                  id="product-available"
                />
                <span className="toggle-slider" />
              </label>
              <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--gray-700)' }}>
                {formData.isAvailable ? '✓ Available for purchase' : '✗ Mark as out of stock'}
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isLoading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading} id="save-product">
              {isLoading ? <><span className="spinner" /> Saving…</> : <><CheckCircle size={15} /> {isEdit ? 'Save Changes' : 'Add Product'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────
const DeleteConfirmModal: React.FC<{
  product: Product;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}> = ({ product, onConfirm, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const handle = async () => {
    setIsLoading(true);
    await onConfirm();
    setIsLoading(false);
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ color: 'var(--danger)' }}>Delete Product</h2>
          <button className="cart-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--gray-700)' }}>
            Are you sure you want to delete <strong>"{product.name}"</strong>? This action cannot be undone.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={isLoading}>Cancel</button>
          <button className="btn btn-danger" onClick={handle} disabled={isLoading} id="confirm-delete">
            {isLoading ? <><span className="spinner" /> Deleting…</> : <><Trash2 size={14} /> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Admin Products Page ───────────────────────────────────────────────────────
const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<ShopConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const loadProducts = async () => {
    try {
      const [prodRes, confRes] = await Promise.all([fetchProducts({ limit: 500 }), fetchConfig()]);
      setProducts(prodRes.data.products);
      setConfig(confRes.data.config);
    } catch {
      toast.error('Failed to load products.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  // Merge with config categories
  const allCategories = Array.from(new Set([...(config?.categories || []), ...categories]));

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || p.category === filterCat;
    return matchSearch && matchCat;
  });

  const handleDelete = async () => {
    if (!deletingProduct) return;
    try {
      await deleteProduct(deletingProduct._id);
      toast.success(`"${deletingProduct.name}" deleted.`);
      setDeletingProduct(null);
      loadProducts();
    } catch {
      toast.error('Failed to delete product.');
    }
  };

  const handleToggleAvailable = async (product: Product) => {
    try {
      const fd = new FormData();
      fd.append('isAvailable', String(!product.isAvailable));
      const res = await updateProduct(product._id, fd);
      setProducts((prev) => prev.map((p) => (p._id === product._id ? res.data.product : p)));
      toast.success(`"${product.name}" marked as ${!product.isAvailable ? 'In Stock' : 'Out of Stock'}`);
    } catch {
      toast.error('Failed to update product status.');
    }
  };

  if (isLoading) {
    return <div className="page-loading"><div className="spinner spinner-dark" /><span>Loading products…</span></div>;
  }

  return (
    <div className="admin-page animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div className="admin-page-title">Products</div>
          <div className="admin-page-subtitle">{products.length} products total • Manage your catalogue</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingProduct(null); setShowForm(true); }} id="add-product-btn">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ maxWidth: '320px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="admin-search"
          />
          {search && <button className="search-clear" onClick={() => setSearch('')}><X size={14} /></button>}
        </div>
        <select
          className="form-control"
          style={{ width: 'auto' }}
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Package size={64} strokeWidth={1} style={{ color: 'var(--gray-300)' }} />
          <h3>{products.length === 0 ? 'No products yet' : 'No products match your search'}</h3>
          <p>{products.length === 0 ? 'Click "Add Product" to add your first product.' : 'Try clearing the search or filter.'}</p>
          {products.length === 0 && (
            <button className="btn btn-primary" onClick={() => { setEditingProduct(null); setShowForm(true); }}>
              <Plus size={16} /> Add First Product
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Unit</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
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
                        <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{p.name}</div>
                        {p.description && (
                          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--gray-500)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-primary">{p.category}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{p.price.toLocaleString('en-IN')}</td>
                  <td style={{ fontSize: 'var(--fs-xs)', color: 'var(--gray-600)' }}>{p.unit}</td>
                  <td>
                    <button
                      className={`badge ${p.isAvailable ? 'badge-success' : 'badge-danger'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      title="Click to toggle availability"
                      onClick={() => handleToggleAvailable(p)}
                      id={`toggle-avail-${p._id}`}
                    >
                      {p.isAvailable ? '✓ In Stock' : '✗ Out of Stock'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setEditingProduct(p); setShowForm(true); }}
                        id={`edit-${p._id}`}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: 'none' }}
                        onClick={() => setDeletingProduct(p)}
                        id={`delete-${p._id}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <ProductFormModal
          product={editingProduct}
          categories={allCategories}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
          onSaved={() => { setShowForm(false); setEditingProduct(null); loadProducts(); }}
        />
      )}

      {deletingProduct && (
        <DeleteConfirmModal
          product={deletingProduct}
          onConfirm={handleDelete}
          onClose={() => setDeletingProduct(null)}
        />
      )}
    </div>
  );
};

export default AdminProducts;
