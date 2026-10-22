import React, { useState } from 'react';
import { X, Trash2, ShoppingCart, Plus, Minus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import { validateOrder } from '../../api';
import type { ValidatedOrderItem } from '../../types';

interface CartDrawerProps {
  onClose: () => void;
  whatsappNumber: string;
  shopName: string;
  deliveryOptions: string[];
}

type Step = 'cart' | 'details' | 'preview';

const CartDrawer: React.FC<CartDrawerProps> = ({ onClose, whatsappNumber, shopName, deliveryOptions }) => {
  const { items, removeItem, updateQuantity } = useCart();
  const [step, setStep] = useState<Step>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [delivery, setDelivery] = useState(deliveryOptions[0] || 'Pickup');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validatedItems, setValidatedItems] = useState<ValidatedOrderItem[]>([]);
  const [validatedTotal, setValidatedTotal] = useState(0);
  const [isValidating, setIsValidating] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const validateDetails = () => {
    const newErrors: Record<string, string> = {};
    if (!customerName.trim()) newErrors.name = 'Please enter your name';
    if (!customerPhone.trim()) newErrors.phone = 'Please enter your phone number';
    else if (!/^[6-9]\d{9}$/.test(customerPhone.replace(/\s/g, '')))
      newErrors.phone = 'Enter a valid 10-digit Indian mobile number';
    const needsDeliveryAddress = delivery.toLowerCase().includes('delivery');
    if (needsDeliveryAddress && !address.trim())
      newErrors.address = 'Please enter your delivery address';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToDetails = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setStep('details');
  };

  const handleProceedToPreview = async () => {
    if (!validateDetails()) return;
    setIsValidating(true);
    try {
      const res = await validateOrder(items.map((i) => ({ productId: i.product._id, quantity: i.quantity })));
      setValidatedItems(res.data.items);
      setValidatedTotal(res.data.total);
      setStep('preview');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to validate order. Please try again.';
      toast.error(msg);
    } finally {
      setIsValidating(false);
    }
  };

  const generateWhatsAppMessage = () => {
    const needsAddress = delivery.toLowerCase().includes('delivery');
    const itemsText = validatedItems
      .map(
        (item) =>
          `• ${item.name} × ${item.quantity}\n  Unit: ₹${item.price.toLocaleString('en-IN')} | Subtotal: ₹${item.subtotal.toLocaleString('en-IN')}`
      )
      .join('\n');

    return `Hello! I'd like to place an order from *${shopName}*.

*Customer Details:*
Name: ${customerName}
Phone: ${customerPhone}

*Order Items:*
${itemsText}

*Estimated Total: ₹${validatedTotal.toLocaleString('en-IN')}*
Preference: ${delivery}${needsAddress && address ? `\nAddress: ${address}` : ''}

_Please confirm availability and final amount. I understand this is a request — not a confirmed order._`;
  };

  const handleSendOnWhatsApp = () => {
    const message = generateWhatsAppMessage();
    const encoded = encodeURIComponent(message);
    // Sanitize the WhatsApp number — ensure it has country code and no special chars
    let sanitizedNumber = whatsappNumber.replace(/[\s\-\+\(\)]/g, '');
    // If number is 10 digits (Indian mobile without country code), prepend 91
    if (/^[6-9]\d{9}$/.test(sanitizedNumber)) {
      sanitizedNumber = '91' + sanitizedNumber;
    }
    const url = `https://wa.me/${sanitizedNumber}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    // Don't clear cart automatically — let user confirm after WhatsApp
    toast.success('WhatsApp opened! Press Send to complete your order request.', { duration: 5000 });
  };

  return (
    <>
      {/* Overlay */}
      <div className="cart-overlay" onClick={onClose} />

      {/* Drawer */}
      <div className="cart-drawer">
        <div className="cart-header">
          <div>
            <h2>
              {step === 'cart' && '🛒 Your Cart'}
              {step === 'details' && '📝 Your Details'}
              {step === 'preview' && '✅ Order Preview'}
            </h2>
          </div>
          <button className="cart-close" onClick={onClose} id="close-cart">
            <X size={16} />
          </button>
        </div>

        {/* Step Indicators */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1.5px solid var(--gray-100)' }}>
          {(['cart', 'details', 'preview'] as Step[]).map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 3,
                background: ['cart', 'details', 'preview'].indexOf(step) >= i
                  ? 'var(--primary)'
                  : 'var(--gray-200)',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* ── Step: Cart ── */}
        {step === 'cart' && (
          <>
            <div className="cart-items">
              {items.length === 0 ? (
                <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                  <ShoppingCart size={56} strokeWidth={1} style={{ color: 'var(--gray-300)' }} />
                  <h3>Cart is empty</h3>
                  <p>Add products from the store to get started.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div className="cart-item" key={item.product._id}>
                    {item.product.imageUrl ? (
                      <img className="cart-item-img" src={item.product.imageUrl} alt={item.product.name} />
                    ) : (
                      <div className="cart-item-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-100)', borderRadius: '8px' }}>
                        <ShoppingCart size={20} style={{ color: 'var(--gray-400)' }} />
                      </div>
                    )}
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.product.name}</div>
                      <div className="cart-item-price">₹{item.product.price.toLocaleString('en-IN')} × {item.product.unit}</div>
                      <div className="qty-control" style={{ marginTop: '0.5rem', width: 'fit-content' }}>
                        <button className="qty-btn" onClick={() => updateQuantity(item.product._id, item.quantity - 1)}>
                          <Minus size={12} />
                        </button>
                        <span className="qty-value">{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQuantity(item.product._id, item.quantity + 1)}>
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <span className="cart-item-subtotal">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                      <button className="cart-remove" onClick={() => removeItem(item.product._id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <span>Subtotal</span>
                  <span style={{ color: 'var(--primary)' }}>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--gray-500)', marginBottom: '0.75rem' }}>
                  * Final amount confirmed by shopkeeper after review.
                </p>
                <button className="btn btn-primary btn-full btn-lg" onClick={handleProceedToDetails} id="proceed-to-details">
                  Continue to Details →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Step: Details ── */}
        {step === 'details' && (
          <>
            <div className="cart-items" style={{ padding: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Your Name <span className="required">*</span></label>
                <input
                  className={`form-control ${errors.name ? 'error' : ''}`}
                  type="text"
                  placeholder="Enter your full name"
                  value={customerName}
                  onChange={(e) => { setCustomerName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
                  id="customer-name"
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Mobile Number <span className="required">*</span></label>
                <input
                  className={`form-control ${errors.phone ? 'error' : ''}`}
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={customerPhone}
                  onChange={(e) => { setCustomerPhone(e.target.value); setErrors((p) => ({ ...p, phone: '' })); }}
                  id="customer-phone"
                />
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>

              {deliveryOptions.length > 0 && (
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Order Preference</label>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    {deliveryOptions.map((opt) => (
                      <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: 'var(--fs-sm)', fontWeight: 500 }}>
                        <input
                          type="radio"
                          name="delivery"
                          value={opt}
                          checked={delivery === opt}
                          onChange={() => setDelivery(opt)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {delivery.toLowerCase().includes('delivery') && (
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Delivery Address <span className="required">*</span></label>
                  <textarea
                    className={`form-control ${errors.address ? 'error' : ''}`}
                    placeholder="Enter your full delivery address"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); setErrors((p) => ({ ...p, address: '' })); }}
                    id="customer-address"
                  />
                  {errors.address && <span className="form-error">{errors.address}</span>}
                </div>
              )}

              <div style={{
                marginTop: '1.5rem',
                padding: '0.875rem',
                background: 'var(--accent-light)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                gap: '0.625rem',
                fontSize: 'var(--fs-xs)',
                color: 'var(--warning)',
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>Your order will be sent as a WhatsApp message. The shopkeeper will confirm availability and final price before payment.</span>
              </div>
            </div>

            <div className="cart-footer" style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-ghost" onClick={() => setStep('cart')}>← Back</button>
              <button
                className="btn btn-primary btn-full"
                onClick={handleProceedToPreview}
                disabled={isValidating}
                id="proceed-to-preview"
              >
                {isValidating ? <><span className="spinner" /> Checking…</> : 'Preview Order →'}
              </button>
            </div>
          </>
        )}

        {/* ── Step: Preview ── */}
        {step === 'preview' && (
          <>
            <div className="cart-items" style={{ padding: '1.25rem' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--gray-600)', fontWeight: 600 }}>
                  Order Summary (verified prices):
                </p>
              </div>
              {validatedItems.map((item) => (
                <div key={item.productId} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.5rem 0', borderBottom: '1px solid var(--gray-100)', fontSize: 'var(--fs-sm)',
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ color: 'var(--gray-500)', fontSize: 'var(--fs-xs)' }}>
                      ₹{item.price.toLocaleString('en-IN')} × {item.quantity}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{item.subtotal.toLocaleString('en-IN')}</div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontWeight: 800, fontSize: 'var(--fs-lg)' }}>
                <span>Estimated Total</span>
                <span style={{ color: 'var(--primary)' }}>₹{validatedTotal.toLocaleString('en-IN')}</span>
              </div>

              <div style={{
                marginTop: '1rem',
                background: 'var(--primary-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.875rem',
                fontSize: 'var(--fs-xs)',
                color: 'var(--primary-dark)',
                fontWeight: 500,
              }}>
                📱 <strong>Next step:</strong> WhatsApp will open with your order. Press the <strong>Send</strong> button in WhatsApp to submit your order request to the shopkeeper.
              </div>
            </div>

            <div className="cart-footer" style={{ flexDirection: 'column', gap: '0.75rem' }}>
              <button
                className="btn-whatsapp"
                onClick={handleSendOnWhatsApp}
                id="send-whatsapp"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                </svg>
                Order on WhatsApp
              </button>
              <button className="btn btn-ghost btn-full" onClick={() => setStep('details')}>← Back to Details</button>
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--gray-400)', textAlign: 'center' }}>
                You must press <strong>Send</strong> in WhatsApp to submit. This does not automatically place an order.
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
