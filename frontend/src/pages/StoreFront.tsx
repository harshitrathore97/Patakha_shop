import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Search, X, ShoppingBag, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchProducts, fetchConfig } from '../api';
import type { Product, ShopConfig } from '../types';
import { useCart } from '../context/CartContext';
import CartDrawer from '../components/storefront/CartDrawer';

const StoreFront: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<ShopConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { addItem, totalItems } = useCart();

  const loadData = useCallback(async () => {
    try {
      const [productsRes, configRes] = await Promise.all([
        fetchProducts({ available: true }),
        fetchConfig(),
      ]);
      const prods: Product[] = productsRes.data.products;
      setProducts(prods);
      setConfig(configRes.data.config);
      const cats = Array.from(new Set(prods.map((p) => p.category).filter(Boolean)));
      setCategories(cats);
    } catch {
      toast.error('Failed to load store. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filter products client-side for snappy UX
  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const shopName = config?.shopName || 'My Shop';
  const initials = shopName.slice(0, 2).toUpperCase();
  const banner = config?.announcementBanner;

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-dark" />
        <p>Loading store…</p>
      </div>
    );
  }

  return (
    <>
      {/* Announcement Banner */}
      {banner && (
        <div className="announcement-banner">🎉 {banner}</div>
      )}

      {/* Header */}
      <header className="site-header">
        <div className="header-inner">
          <a href="/" className="header-logo">
            <div className="header-logo-icon">{initials}</div>
            <div>
              <div className="header-shop-name">{shopName}</div>
              {config?.tagline && <div className="header-tagline">{config.tagline}</div>}
            </div>
          </a>

          {/* Search bar — desktop */}
          <div className="search-bar hide-mobile">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="search-input"
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="header-actions">
            <button className="cart-btn" onClick={() => setCartOpen(true)} id="cart-button">
              <ShoppingCart size={18} />
              <span className="hide-mobile">Cart</span>
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div style={{ padding: '0 1rem 0.75rem', display: 'flex' }} className="hide-desktop">
          <div className="search-bar" style={{ maxWidth: '100%' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Category Pills */}
      {categories.length > 0 && (
        <div style={{ background: 'var(--white)', borderBottom: '1.5px solid var(--gray-100)', padding: '0.75rem 1rem' }}>
          <div className="container">
            <div className="category-pills">
              <button
                className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{ padding: '1.5rem 0', minHeight: '60vh' }}>
        <div className="container">
          {/* Result count */}
          {(search || selectedCategory !== 'all') && (
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--gray-500)', marginBottom: '1rem' }}>
              {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
              {search && <> for "<strong>{search}</strong>"</>}
            </p>
          )}

          {filtered.length === 0 ? (
            <div className="empty-state">
              <Package size={64} strokeWidth={1} style={{ color: 'var(--gray-300)' }} />
              <h3>No products found</h3>
              <p>
                {search
                  ? `No products match "${search}". Try a different search.`
                  : 'No products available in this category yet.'}
              </p>
              {(search || selectedCategory !== 'all') && (
                <button className="btn btn-outline" onClick={() => { setSearch(''); setSelectedCategory('all'); }}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="product-grid">
              {filtered.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onAddToCart={() => {
                    addItem(product);
                    toast.success(`${product.name} added to cart!`);
                  }}
                  onViewDetails={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        background: 'var(--white)',
        borderTop: '1.5px solid var(--gray-100)',
        padding: '2rem 1rem',
        textAlign: 'center',
        marginTop: '2rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '0.5rem' }}>
          <ShoppingBag size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 700, color: 'var(--gray-800)' }}>{shopName}</span>
        </div>
        <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--gray-400)' }}>
          {config?.footerText || 'Orders are processed via WhatsApp. Final confirmation will be by the shopkeeper.'}
        </p>
        <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--gray-300)', marginTop: '0.5rem' }}>
          ⚠️ Availability and final pricing will be confirmed by the seller.
        </p>
      </footer>

      {/* Cart Drawer */}
      {cartOpen && (
        <CartDrawer
          onClose={() => setCartOpen(false)}
          whatsappNumber={config?.whatsappNumber || '919610684627'}
          shopName={shopName}
          deliveryOptions={config?.deliveryOptions || ['Pickup', 'Delivery']}
        />
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={() => {
            addItem(selectedProduct);
            toast.success(`${selectedProduct.name} added to cart!`);
            setSelectedProduct(null);
          }}
        />
      )}
    </>
  );
};

// ─── Product Card ──────────────────────────────────────────────────────────────
const ProductCard: React.FC<{
  product: Product;
  onAddToCart: () => void;
  onViewDetails: () => void;
}> = ({ product, onAddToCart, onViewDetails }) => (
  <div className={`product-card animate-fade-in ${!product.isAvailable ? 'unavailable' : ''}`}>
    <div className="product-image-wrap" onClick={onViewDetails}>
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
      ) : (
        <div className="product-image-placeholder">
          <Package size={48} strokeWidth={1} />
        </div>
      )}
      {!product.isAvailable && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="badge badge-danger">Out of Stock</span>
        </div>
      )}
    </div>
    <div className="product-info">
      <div className="product-name" onClick={onViewDetails}>{product.name}</div>
      <div className="product-unit">{product.unit}</div>
      {product.category && <span className="badge badge-primary">{product.category}</span>}
      <div className="product-price"><sup>₹</sup>{product.price.toLocaleString('en-IN')}</div>
    </div>
    <div className="product-actions">
      <button
        className="btn btn-primary btn-full btn-sm"
        onClick={onAddToCart}
        disabled={!product.isAvailable}
        id={`add-to-cart-${product._id}`}
      >
        <ShoppingCart size={14} />
        {product.isAvailable ? 'Add to Cart' : 'Unavailable'}
      </button>
    </div>
  </div>
);

// ─── Product Detail Modal ──────────────────────────────────────────────────────
const ProductDetailModal: React.FC<{
  product: Product;
  onClose: () => void;
  onAddToCart: () => void;
}> = ({ product, onClose, onAddToCart }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
      {product.imageUrl && (
        <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: 'var(--gray-100)' }}>
          <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div className="modal-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 800, color: 'var(--gray-900)', lineHeight: 1.3 }}>{product.name}</h2>
            <p style={{ color: 'var(--gray-500)', fontSize: 'var(--fs-sm)', marginTop: '4px' }}>{product.unit}</p>
          </div>
          <button className="cart-close" onClick={onClose}>✕</button>
        </div>
        {product.category && <span className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>{product.category}</span>}
        {product.description && (
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: '1rem' }}>
            {product.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
          <span style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, color: 'var(--primary)' }}>
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.isAvailable ? (
            <span className="badge badge-success">✓ In Stock</span>
          ) : (
            <span className="badge badge-danger">Out of Stock</span>
          )}
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
        <button
          className="btn btn-primary"
          onClick={onAddToCart}
          disabled={!product.isAvailable}
          id={`modal-add-to-cart-${product._id}`}
        >
          <ShoppingCart size={16} /> Add to Cart
        </button>
      </div>
    </div>
  </div>
);

export default StoreFront;
