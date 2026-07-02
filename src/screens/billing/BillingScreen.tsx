// ============================================================
// GURBANI TRADERS - Billing Screen
// Create sales bills with credit/Udhaar support
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ScrollView,
  Alert, StyleSheet, TextInput,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp, formatCurrency } from '../../context/AppContext';
import {
  Button, Input, Card, BottomModal, Header, SearchBar,
  EmptyState, Badge, Divider,
} from '../../components/common/UIComponents';
import { getAllProducts, type Product } from '../../database/products';
import { createBill, getBills, type Bill, type BillItem } from '../../database/billing';
import { getAllCustomers, type Customer } from '../../database/customers';
import { COLORS, FONT_SIZES, SPACING, FONTS, BORDER_RADIUS } from '../../utils/theme';

interface CartItem extends BillItem {
  key: string;
}

export default function BillingScreen() {
  const { colors, settings } = useApp();
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [bills, setBills] = useState<Bill[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(useCallback(() => {
    setBills(getBills(100));
  }, [refreshKey]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Billing" subtitle="Sales & Invoices" />

      {/* Tab Switcher */}
      <View style={{ flexDirection: 'row', margin: SPACING.base, backgroundColor: colors.card, borderRadius: BORDER_RADIUS.lg, padding: 4, ...{ borderWidth: 1, borderColor: colors.border } }}>
        {[{ key: 'new', label: 'New Bill', icon: 'add-circle-outline' }, { key: 'history', label: 'Bill History', icon: 'receipt-outline' }].map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as any)}
            style={[
              { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, gap: 6 },
              activeTab === tab.key && { backgroundColor: colors.primary },
            ]}
          >
            <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? '#fff' : colors.textMuted} />
            <Text style={{ color: activeTab === tab.key ? '#fff' : colors.textMuted, fontSize: FONT_SIZES.sm, fontWeight: FONTS.semiBold }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'new' ? (
        <NewBillTab onBillCreated={() => { setRefreshKey(k => k + 1); setActiveTab('history'); }} />
      ) : (
        <BillHistoryTab bills={bills} currency={settings.currency} />
      )}
    </View>
  );
}

// ─── NEW BILL TAB ────────────────────────────────────────────
const NewBillTab: React.FC<{ onBillCreated: () => void }> = ({ onBillCreated }) => {
  const { colors, settings } = useApp();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [discount, setDiscount] = useState('');
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountAmt = discountType === 'percent'
    ? (subtotal * Number(discount || 0)) / 100
    : Number(discount || 0);
  const total = Math.max(0, subtotal - discountAmt);
  const credit = Math.max(0, total - Number(paidAmount || 0));

  const handleSearch = (text: string) => {
    setSearch(text);
    if (text.length > 1) {
      const results = getAllProducts(text);
      setSearchResults(results.slice(0, 10));
    } else {
      setSearchResults([]);
    }
  };

  const addToCart = (product: Product) => {
    const key = `${product.id}-${Date.now()}`;
    setCart(prev => [...prev, {
      key,
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit: product.unit,
      purchase_price: product.purchase_price,
      selling_price: product.selling_price,
      discount: 0,
      total: product.selling_price,
    }]);
    setSearch('');
    setSearchResults([]);
    setShowProductSearch(false);
  };

  const updateCartItem = (key: string, field: string, value: string) => {
    setCart(prev => prev.map(item => {
      if (item.key !== key) return item;
      const updated = { ...item, [field]: field === 'quantity' || field === 'selling_price' || field === 'discount' ? Number(value) || 0 : value };
      updated.total = (updated.selling_price * updated.quantity) - updated.discount;
      return updated;
    }));
  };

  const removeFromCart = (key: string) => {
    setCart(prev => prev.filter(item => item.key !== key));
  };

  const handleCreateBill = () => {
    if (cart.length === 0) { Alert.alert('Empty Cart', 'Add at least one product'); return; }
    const paid = Number(paidAmount) || 0;

    createBill({
      customer_id: selectedCustomer?.id,
      customer_name: selectedCustomer?.name,
      items: cart,
      discount: Number(discount) || 0,
      discount_type: discountType,
      paid_amount: paid,
      payment_method: paymentMethod,
    });

    Alert.alert('✅ Bill Created!', `Total: ${formatCurrency(total, settings.currency)}\nCredit: ${formatCurrency(credit, settings.currency)}`, [
      { text: 'OK', onPress: () => { setCart([]); setDiscount(''); setPaidAmount(''); setSelectedCustomer(null); setShowCheckout(false); onBillCreated(); } },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Add Product Button */}
      <View style={{ paddingHorizontal: SPACING.base, marginBottom: SPACING.sm }}>
        <TouchableOpacity
          onPress={() => setShowProductSearch(true)}
          style={{ backgroundColor: colors.primary, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontSize: FONT_SIZES.base, fontWeight: FONTS.semiBold }}>Search & Add Product</Text>
        </TouchableOpacity>
      </View>

      {/* Customer Selection */}
      <TouchableOpacity
        onPress={() => setShowCustomerPicker(true)}
        style={{ marginHorizontal: SPACING.base, marginBottom: SPACING.sm, backgroundColor: colors.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
      >
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Ionicons name="person-outline" size={18} color={colors.textMuted} />
          <Text style={{ color: selectedCustomer ? colors.textPrimary : colors.textMuted, fontSize: FONT_SIZES.md, fontWeight: selectedCustomer ? FONTS.semiBold : FONTS.regular }}>
            {selectedCustomer ? selectedCustomer.name : 'Select Customer (Optional)'}
          </Text>
        </View>
        {selectedCustomer && (
          <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Cart */}
      <FlatList
        data={cart}
        keyExtractor={item => item.key}
        contentContainerStyle={{ paddingHorizontal: SPACING.base, paddingBottom: 180 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: SPACING['3xl'] }}>
            <Ionicons name="cart-outline" size={60} color={colors.border} />
            <Text style={{ color: colors.textMuted, marginTop: SPACING.md, fontSize: FONT_SIZES.md }}>Cart is empty</Text>
            <Text style={{ color: colors.textMuted, fontSize: FONT_SIZES.sm }}>Search and add products above</Text>
          </View>
        }
        renderItem={({ item }) => (
          <CartItemCard item={item} onUpdate={updateCartItem} onRemove={removeFromCart} currency={settings.currency} />
        )}
      />

      {/* Cart Footer */}
      {cart.length > 0 && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, padding: SPACING.base }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm }}>
            <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.md }}>{cart.length} items</Text>
            <Text style={{ color: colors.textPrimary, fontSize: FONT_SIZES.lg, fontWeight: FONTS.bold }}>
              Total: {formatCurrency(total, settings.currency)}
            </Text>
          </View>
          <Button title="Proceed to Checkout" onPress={() => { setPaidAmount(String(total)); setShowCheckout(true); }} fullWidth icon="card-outline" size="lg" />
        </View>
      )}

      {/* Product Search Modal */}
      <BottomModal visible={showProductSearch} onClose={() => setShowProductSearch(false)} title="Add Product">
        <SearchBar value={search} onChangeText={handleSearch} placeholder="Search by name, brand..." />
        {searchResults.map(product => (
          <TouchableOpacity
            key={product.id}
            onPress={() => addToCart(product)}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.border }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FONT_SIZES.base, fontWeight: FONTS.semiBold, color: colors.textPrimary }}>{product.name}</Text>
              <Text style={{ fontSize: FONT_SIZES.sm, color: colors.textMuted }}>{product.category} • Stock: {product.quantity} {product.unit}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: COLORS.primary, fontWeight: FONTS.bold, fontSize: FONT_SIZES.md }}>
                {formatCurrency(product.selling_price, settings.currency)}
              </Text>
              <Ionicons name="add-circle" size={24} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        ))}
        {search.length > 0 && searchResults.length === 0 && (
          <Text style={{ textAlign: 'center', color: colors.textMuted, padding: SPACING.xl }}>No products found</Text>
        )}
      </BottomModal>

      {/* Customer Picker Modal */}
      <CustomerPickerModal
        visible={showCustomerPicker}
        onClose={() => setShowCustomerPicker(false)}
        onSelect={customer => { setSelectedCustomer(customer); setShowCustomerPicker(false); }}
      />

      {/* Checkout Modal */}
      <BottomModal visible={showCheckout} onClose={() => setShowCheckout(false)} title="Checkout">
        <View style={{ backgroundColor: COLORS.primaryPale, borderRadius: BORDER_RADIUS.md, padding: SPACING.base, marginBottom: SPACING.base }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: COLORS.primary }}>Subtotal:</Text>
            <Text style={{ fontWeight: FONTS.bold, color: COLORS.primary }}>{formatCurrency(subtotal, settings.currency)}</Text>
          </View>
          {discountAmt > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={{ color: COLORS.warning }}>Discount:</Text>
              <Text style={{ color: COLORS.warning }}>-{formatCurrency(discountAmt, settings.currency)}</Text>
            </View>
          )}
          <Divider />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: COLORS.primary, fontWeight: FONTS.bold, fontSize: FONT_SIZES.lg }}>Total:</Text>
            <Text style={{ color: COLORS.primary, fontWeight: FONTS.extraBold, fontSize: FONT_SIZES.lg }}>{formatCurrency(total, settings.currency)}</Text>
          </View>
        </View>

        {/* Discount Row */}
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.base }}>
          <View style={{ flex: 2 }}>
            <Input label="Discount" value={discount} onChangeText={setDiscount} keyboardType="numeric" placeholder="0" leftIcon="pricetag-outline" style={{ marginBottom: 0 }} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: FONTS.semiBold, color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase' }}>Type</Text>
            <TouchableOpacity
              onPress={() => setDiscountType(d => d === 'amount' ? 'percent' : 'amount')}
              style={{ backgroundColor: colors.card, borderRadius: BORDER_RADIUS.md, borderWidth: 1.5, borderColor: colors.border, padding: 12, alignItems: 'center' }}
            >
              <Text style={{ color: COLORS.primary, fontWeight: FONTS.bold }}>{discountType === 'amount' ? 'Rs.' : '%'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Input label={`Amount Paid (Total: ${formatCurrency(total, settings.currency)})`}
          value={paidAmount} onChangeText={setPaidAmount} keyboardType="numeric"
          leftIcon="cash-outline" placeholder={String(total)} />

        {credit > 0 && selectedCustomer && (
          <View style={{ backgroundColor: `${COLORS.warning}15`, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.base }}>
            <Text style={{ color: COLORS.warning, fontWeight: FONTS.semiBold }}>
              ⚠ Credit (Udhaar): {formatCurrency(credit, settings.currency)} will be added to {selectedCustomer.name}'s account
            </Text>
          </View>
        )}

        {credit > 0 && !selectedCustomer && (
          <View style={{ backgroundColor: `${COLORS.error}15`, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.base }}>
            <Text style={{ color: COLORS.error, fontWeight: FONTS.semiBold }}>
              ⚠ Select a customer to track Udhaar of {formatCurrency(credit, settings.currency)}
            </Text>
          </View>
        )}

        {/* Payment Method */}
        <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: FONTS.semiBold, color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>Payment Method</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: SPACING.base }}>
          {['cash', 'transfer', 'card'].map(method => (
            <TouchableOpacity key={method} onPress={() => setPaymentMethod(method)}
              style={[{ flex: 1, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, alignItems: 'center', borderWidth: 1.5 },
                paymentMethod === method ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary } : { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ color: paymentMethod === method ? '#fff' : colors.textMuted, fontWeight: FONTS.semiBold, fontSize: FONT_SIZES.sm, textTransform: 'capitalize' }}>{method}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button title="Create Bill" onPress={handleCreateBill} fullWidth icon="checkmark-circle-outline" size="lg" />
      </BottomModal>
    </View>
  );
};

// ─── CART ITEM CARD ──────────────────────────────────────────
const CartItemCard: React.FC<{
  item: CartItem;
  onUpdate: (key: string, field: string, value: string) => void;
  onRemove: (key: string) => void;
  currency: string;
}> = ({ item, onUpdate, onRemove, currency }) => {
  const { colors } = useApp();

  return (
    <Card style={{ marginBottom: SPACING.sm }} padding={SPACING.md}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm }}>
        <Text style={{ flex: 1, fontWeight: FONTS.bold, color: colors.textPrimary, fontSize: FONT_SIZES.md }} numberOfLines={1}>
          {item.product_name}
        </Text>
        <TouchableOpacity onPress={() => onRemove(item.key)}>
          <Ionicons name="close-circle" size={22} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted, marginBottom: 4 }}>QTY ({item.unit})</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bg, borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8 }}>
            <TouchableOpacity onPress={() => item.quantity > 1 && onUpdate(item.key, 'quantity', String(item.quantity - 1))}>
              <Ionicons name="remove" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <TextInput
              value={String(item.quantity)}
              onChangeText={v => onUpdate(item.key, 'quantity', v)}
              keyboardType="numeric"
              style={{ flex: 1, textAlign: 'center', color: colors.textPrimary, fontSize: FONT_SIZES.base, fontWeight: FONTS.bold, paddingVertical: 6 }}
            />
            <TouchableOpacity onPress={() => onUpdate(item.key, 'quantity', String(item.quantity + 1))}>
              <Ionicons name="add" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted, marginBottom: 4 }}>Price</Text>
          <TextInput
            value={String(item.selling_price)}
            onChangeText={v => onUpdate(item.key, 'selling_price', v)}
            keyboardType="numeric"
            style={{ backgroundColor: colors.bg, borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, paddingVertical: 8, color: colors.textPrimary, fontSize: FONT_SIZES.base, fontWeight: FONTS.bold }}
          />
        </View>
        <View style={{ alignItems: 'flex-end', justifyContent: 'flex-end' }}>
          <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted }}>Total</Text>
          <Text style={{ color: COLORS.primary, fontWeight: FONTS.extraBold, fontSize: FONT_SIZES.lg }}>
            {formatCurrency(item.total, currency)}
          </Text>
        </View>
      </View>
    </Card>
  );
};

// ─── CUSTOMER PICKER ──────────────────────────────────────────
const CustomerPickerModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
}> = ({ visible, onClose, onSelect }) => {
  const [search, setSearch] = useState('');
  const customers = getAllCustomers(search);
  const { colors } = useApp();

  return (
    <BottomModal visible={visible} onClose={onClose} title="Select Customer">
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search customer..." />
      {customers.map(customer => (
        <TouchableOpacity
          key={customer.id}
          onPress={() => onSelect(customer)}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.border }}
        >
          <View>
            <Text style={{ fontWeight: FONTS.semiBold, color: colors.textPrimary, fontSize: FONT_SIZES.base }}>{customer.name}</Text>
            <Text style={{ fontSize: FONT_SIZES.sm, color: colors.textMuted }}>{customer.mobile || 'No phone'}</Text>
          </View>
          {customer.credit_balance > 0 && (
            <Badge label={`Udhaar: Rs.${customer.credit_balance.toFixed(0)}`} color={COLORS.warning} size="md" />
          )}
        </TouchableOpacity>
      ))}
      {customers.length === 0 && (
        <Text style={{ textAlign: 'center', color: colors.textMuted, padding: SPACING.xl }}>No customers found</Text>
      )}
    </BottomModal>
  );
};

// ─── BILL HISTORY TAB ─────────────────────────────────────────
const BillHistoryTab: React.FC<{ bills: Bill[]; currency: string }> = ({ bills, currency }) => {
  const { colors } = useApp();

  if (bills.length === 0) {
    return <EmptyState icon="receipt-outline" title="No Bills Yet" subtitle="Create your first bill from the New Bill tab" />;
  }

  return (
    <FlatList
      data={bills}
      keyExtractor={item => String(item.id)}
      contentContainerStyle={{ padding: SPACING.base, paddingBottom: 100 }}
      renderItem={({ item }) => (
        <Card style={{ marginBottom: SPACING.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FONT_SIZES.base, fontWeight: FONTS.bold, color: colors.textPrimary }}>
                {item.bill_number}
              </Text>
              <Text style={{ fontSize: FONT_SIZES.sm, color: colors.textMuted }}>
                {new Date(item.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
              {item.customer_name && (
                <Text style={{ fontSize: FONT_SIZES.sm, color: colors.textSecondary, marginTop: 2 }}>
                  👤 {item.customer_name}
                </Text>
              )}
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: FONTS.extraBold, color: COLORS.primary }}>
                {formatCurrency(item.total, currency)}
              </Text>
              <Badge
                label={item.status === 'credit' ? '⚠ Credit' : '✓ Paid'}
                color={item.status === 'credit' ? COLORS.warning : COLORS.primary}
                size="sm"
              />
            </View>
          </View>
          {item.credit_amount > 0 && (
            <>
              <Divider style={{ marginVertical: SPACING.sm }} />
              <Text style={{ color: COLORS.warning, fontSize: FONT_SIZES.sm, fontWeight: FONTS.semiBold }}>
                Udhaar: {formatCurrency(item.credit_amount, currency)} | Paid: {formatCurrency(item.paid_amount, currency)}
              </Text>
            </>
          )}
        </Card>
      )}
    />
  );
};
