// ============================================================
// GURBANI TRADERS - Products Screen
// Full product management: list, search, add, edit, stock
// ============================================================

import React, { useState, useCallback, useEffect } from 'react';
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
import {
  getAllProducts, addProduct, updateProduct, deleteProduct,
  adjustStock, getStockHistory, getCategories, addCategory,
  getCustomUnits, addCustomUnit, type Product,
} from '../../database/products';
import { COLORS, FONT_SIZES, SPACING, FONTS, BORDER_RADIUS, PRODUCT_UNITS } from '../../utils/theme';

export default function ProductsScreen() {
  const { colors, settings } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadProducts = useCallback(() => {
    const list = getAllProducts(search, selectedCategory);
    setProducts(list);
    const cats = getCategories();
    setCategories(['All', ...cats]);
  }, [search, selectedCategory]);

  useFocusEffect(useCallback(() => {
    loadProducts();
  }, [loadProducts]));

  useEffect(() => { loadProducts(); }, [search, selectedCategory, refreshKey]);

  const refresh = () => setRefreshKey(k => k + 1);

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Remove "${product.name}" from inventory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { deleteProduct(product.id); refresh(); } },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title="Products"
        subtitle={`${products.length} items`}
        rightAction={{ icon: 'add', label: 'Add', onPress: () => setShowAddModal(true) }}
      />

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name, brand, category..." />

      {/* Category Filter */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 44, marginBottom: SPACING.sm }}
        contentContainerStyle={{ paddingHorizontal: SPACING.base, gap: 8 }}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[
              styles.chip,
              selectedCategory === cat && { backgroundColor: colors.primary, borderColor: colors.primary },
              selectedCategory !== cat && { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[
              styles.chipText,
              { color: selectedCategory === cat ? '#fff' : colors.textSecondary },
            ]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={products}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: SPACING.base, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="cube-outline"
            title="No Products Found"
            subtitle={search ? "Try a different search term" : "Tap + Add to create your first product"}
            action={{ label: 'Add Product', onPress: () => setShowAddModal(true) }}
          />
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            currency={settings.currency}
            onEdit={() => { setSelectedProduct(item); setShowEditModal(true); }}
            onStock={() => { setSelectedProduct(item); setShowStockModal(true); }}
            onDelete={() => handleDelete(item)}
          />
        )}
      />

      {/* ADD MODAL */}
      <AddProductModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => { setShowAddModal(false); refresh(); }}
        categories={categories.filter(c => c !== 'All')}
      />

      {/* EDIT MODAL */}
      {selectedProduct && (
        <EditProductModal
          visible={showEditModal}
          product={selectedProduct}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => { setShowEditModal(false); refresh(); }}
          categories={categories.filter(c => c !== 'All')}
        />
      )}

      {/* STOCK MODAL */}
      {selectedProduct && (
        <StockModal
          visible={showStockModal}
          product={selectedProduct}
          onClose={() => setShowStockModal(false)}
          onSuccess={() => { setShowStockModal(false); refresh(); }}
        />
      )}
    </View>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────
const ProductCard: React.FC<{
  product: Product;
  currency: string;
  onEdit: () => void;
  onStock: () => void;
  onDelete: () => void;
}> = ({ product, currency, onEdit, onStock, onDelete }) => {
  const { colors } = useApp();
  const isLowStock = product.quantity <= product.low_stock_threshold;
  const profit = product.selling_price - product.purchase_price;
  const profitMargin = product.purchase_price > 0 ? ((profit / product.purchase_price) * 100).toFixed(0) : 0;

  return (
    <Card style={{ marginBottom: SPACING.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, marginRight: SPACING.sm }}>
          <Text style={{ fontSize: FONT_SIZES.base, fontWeight: FONTS.bold, color: colors.textPrimary }} numberOfLines={1}>
            {product.name}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <Badge label={product.category} />
            {product.brand && <Badge label={product.brand} color={COLORS.accent2} />}
            {isLowStock && <Badge label="Low Stock" color={COLORS.warning} />}
          </View>
        </View>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity onPress={onStock} style={[styles.iconBtn, { backgroundColor: `${COLORS.primary}15` }]}>
            <Ionicons name="layers-outline" size={16} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onEdit} style={[styles.iconBtn, { backgroundColor: `${COLORS.accent2}15` }]}>
            <Ionicons name="pencil-outline" size={16} color={COLORS.accent2} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={[styles.iconBtn, { backgroundColor: `${COLORS.error}12` }]}>
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      <Divider style={{ marginVertical: SPACING.sm }} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted }}>Purchase</Text>
          <Text style={{ fontSize: FONT_SIZES.md, fontWeight: FONTS.semiBold, color: colors.textSecondary }}>
            {formatCurrency(product.purchase_price, currency)}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted }}>Selling</Text>
          <Text style={{ fontSize: FONT_SIZES.md, fontWeight: FONTS.bold, color: COLORS.primary }}>
            {formatCurrency(product.selling_price, currency)}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted }}>Stock</Text>
          <Text style={{ fontSize: FONT_SIZES.md, fontWeight: FONTS.bold, color: isLowStock ? COLORS.warning : colors.textPrimary }}>
            {product.quantity} {product.unit}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted }}>Margin</Text>
          <Text style={{ fontSize: FONT_SIZES.md, fontWeight: FONTS.semiBold, color: COLORS.success }}>
            {profitMargin}%
          </Text>
        </View>
      </View>
    </Card>
  );
};

// ─── ADD PRODUCT MODAL ────────────────────────────────────────
const AddProductModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: string[];
}> = ({ visible, onClose, onSuccess, categories }) => {
  const [form, setForm] = useState({
    name: '', category: 'General', brand: '',
    purchase_price: '', selling_price: '',
    quantity: '', unit: 'Piece', low_stock_threshold: '10',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customUnits, setCustomUnits] = useState<string[]>([]);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [newUnit, setNewUnit] = useState('');
  const { colors } = useApp();

  useEffect(() => {
    if (visible) setCustomUnits(getCustomUnits());
  }, [visible]);

  const allUnits = [...PRODUCT_UNITS, ...customUnits];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.purchase_price || isNaN(Number(form.purchase_price))) errs.purchase_price = 'Valid purchase price required';
    if (!form.selling_price || isNaN(Number(form.selling_price))) errs.selling_price = 'Valid selling price required';
    if (form.quantity && isNaN(Number(form.quantity))) errs.quantity = 'Invalid quantity';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    addProduct({
      name: form.name.trim(),
      category: form.category,
      brand: form.brand.trim() || undefined,
      purchase_price: Number(form.purchase_price),
      selling_price: Number(form.selling_price),
      quantity: Number(form.quantity) || 0,
      unit: form.unit,
      low_stock_threshold: Number(form.low_stock_threshold) || 10,
    });
    setForm({ name: '', category: 'General', brand: '', purchase_price: '', selling_price: '', quantity: '', unit: 'Piece', low_stock_threshold: '10' });
    setErrors({});
    onSuccess();
  };

  const handleAddUnit = () => {
    if (newUnit.trim()) {
      addCustomUnit(newUnit.trim());
      setCustomUnits(getCustomUnits());
      setForm(f => ({ ...f, unit: newUnit.trim() }));
      setNewUnit('');
      setShowUnitPicker(false);
    }
  };

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <BottomModal visible={visible} onClose={onClose} title="Add New Product">
      <Input label="Product Name *" value={form.name} onChangeText={set('name')}
        placeholder="e.g. Basmati Rice 5kg" error={errors.name} leftIcon="cube-outline" />

      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <View style={{ flex: 1 }}>
          <Input label="Purchase Price *" value={form.purchase_price} onChangeText={set('purchase_price')}
            placeholder="0" keyboardType="numeric" error={errors.purchase_price} leftIcon="cash-outline" />
        </View>
        <View style={{ flex: 1 }}>
          <Input label="Selling Price *" value={form.selling_price} onChangeText={set('selling_price')}
            placeholder="0" keyboardType="numeric" error={errors.selling_price} leftIcon="pricetag-outline" />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <View style={{ flex: 1 }}>
          <Input label="Initial Stock" value={form.quantity} onChangeText={set('quantity')}
            placeholder="0" keyboardType="numeric" error={errors.quantity} />
        </View>
        <View style={{ flex: 1 }}>
          {/* Unit Selector */}
          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: FONTS.semiBold, color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase' }}>
            Unit
          </Text>
          <TouchableOpacity
            onPress={() => setShowUnitPicker(true)}
            style={{ backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.md, borderWidth: 1.5, borderColor: colors.border, paddingVertical: 12, paddingHorizontal: SPACING.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: FONT_SIZES.base }}>{form.unit}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <Input label="Brand (Optional)" value={form.brand} onChangeText={set('brand')}
        placeholder="e.g. National, Tapal..." />

      {/* Category chips */}
      <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: FONTS.semiBold, color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>
        Category
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.base }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setForm(f => ({ ...f, category: cat }))}
              style={[styles.chip, form.category === cat
                ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                : { backgroundColor: colors.card, borderColor: colors.border }
              ]}
            >
              <Text style={{ color: form.category === cat ? '#fff' : colors.textSecondary, fontSize: FONT_SIZES.sm, fontWeight: FONTS.medium }}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Input label="Low Stock Alert Threshold" value={form.low_stock_threshold}
        onChangeText={set('low_stock_threshold')} placeholder="10" keyboardType="numeric" leftIcon="warning-outline" />

      <Button title="Save Product" onPress={handleSave} fullWidth icon="checkmark-circle-outline" size="lg" />

      {/* Unit Picker Modal */}
      <BottomModal visible={showUnitPicker} onClose={() => setShowUnitPicker(false)} title="Select Unit">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.base }}>
          {allUnits.map(unit => (
            <TouchableOpacity
              key={unit}
              onPress={() => { setForm(f => ({ ...f, unit })); setShowUnitPicker(false); }}
              style={[styles.chip, form.unit === unit
                ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                : { backgroundColor: colors.card, borderColor: colors.border }
              ]}
            >
              <Text style={{ color: form.unit === unit ? '#fff' : colors.textSecondary, fontWeight: FONTS.medium }}>
                {unit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Divider />
        <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: FONTS.semiBold, color: colors.textSecondary, marginBottom: 8, marginTop: 8 }}>
          CREATE CUSTOM UNIT
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Input value={newUnit} onChangeText={setNewUnit} placeholder="e.g. Bundle, Roll..." style={{ marginBottom: 0 }} />
          </View>
          <Button title="Add" onPress={handleAddUnit} size="md" />
        </View>
      </BottomModal>
    </BottomModal>
  );
};

// ─── EDIT PRODUCT MODAL ───────────────────────────────────────
const EditProductModal: React.FC<{
  visible: boolean;
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
  categories: string[];
}> = ({ visible, product, onClose, onSuccess, categories }) => {
  const [form, setForm] = useState({ ...product, purchase_price: String(product.purchase_price), selling_price: String(product.selling_price), low_stock_threshold: String(product.low_stock_threshold) });
  const { colors } = useApp();

  useEffect(() => {
    setForm({ ...product, purchase_price: String(product.purchase_price), selling_price: String(product.selling_price), low_stock_threshold: String(product.low_stock_threshold) });
  }, [product]);

  const handleSave = () => {
    if (!form.name.trim()) { Alert.alert('Error', 'Product name is required'); return; }
    updateProduct(product.id, {
      name: form.name.trim(),
      category: form.category,
      brand: form.brand || undefined,
      purchase_price: Number(form.purchase_price) || product.purchase_price,
      selling_price: Number(form.selling_price) || product.selling_price,
      unit: form.unit,
      low_stock_threshold: Number(form.low_stock_threshold) || 10,
    });
    onSuccess();
  };

  const set = (key: string) => (val: string) => setForm((f: any) => ({ ...f, [key]: val }));

  return (
    <BottomModal visible={visible} onClose={onClose} title={`Edit: ${product.name}`}>
      <Input label="Product Name" value={form.name} onChangeText={set('name')} leftIcon="cube-outline" />
      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <View style={{ flex: 1 }}>
          <Input label="Purchase Price" value={form.purchase_price} onChangeText={set('purchase_price')} keyboardType="numeric" leftIcon="cash-outline" />
        </View>
        <View style={{ flex: 1 }}>
          <Input label="Selling Price" value={form.selling_price} onChangeText={set('selling_price')} keyboardType="numeric" leftIcon="pricetag-outline" />
        </View>
      </View>
      <Input label="Brand" value={form.brand || ''} onChangeText={set('brand')} />

      <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: FONTS.semiBold, color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.base }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {categories.map(cat => (
            <TouchableOpacity key={cat} onPress={() => setForm((f: any) => ({ ...f, category: cat }))}
              style={[styles.chip, form.category === cat ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary } : { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ color: form.category === cat ? '#fff' : colors.textSecondary, fontSize: FONT_SIZES.sm }}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Input label="Low Stock Threshold" value={String(form.low_stock_threshold)} onChangeText={set('low_stock_threshold')} keyboardType="numeric" leftIcon="warning-outline" />

      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <View style={{ flex: 1 }}>
          <Button title="Cancel" onPress={onClose} variant="outline" fullWidth />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Save Changes" onPress={handleSave} fullWidth icon="checkmark-outline" />
        </View>
      </View>
    </BottomModal>
  );
};

// ─── STOCK ADJUSTMENT MODAL ───────────────────────────────────
const StockModal: React.FC<{
  visible: boolean;
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ visible, product, onClose, onSuccess }) => {
  const [type, setType] = useState<'add' | 'reduce' | 'adjustment'>('add');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const { colors } = useApp();

  useEffect(() => {
    if (visible) {
      const h = getStockHistory(product.id, 10);
      setHistory(h);
    }
  }, [visible, product.id]);

  const handleAdjust = () => {
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      Alert.alert('Error', 'Enter a valid quantity');
      return;
    }
    adjustStock(product.id, type, Number(quantity), note);
    setQuantity('');
    setNote('');
    onSuccess();
  };

  const typeOptions = [
    { key: 'add', label: 'Add Stock', icon: 'add-circle-outline', color: COLORS.primary },
    { key: 'reduce', label: 'Reduce', icon: 'remove-circle-outline', color: COLORS.warning },
    { key: 'adjustment', label: 'Set Exact', icon: 'sync-outline', color: COLORS.accent2 },
  ];

  return (
    <BottomModal visible={visible} onClose={onClose} title={`Stock: ${product.name}`}>
      {/* Current Stock Display */}
      <View style={{ backgroundColor: COLORS.primaryPale, borderRadius: BORDER_RADIUS.md, padding: SPACING.base, marginBottom: SPACING.base, alignItems: 'center' }}>
        <Text style={{ color: COLORS.primary, fontSize: FONT_SIZES['3xl'], fontWeight: FONTS.extraBold }}>
          {product.quantity}
        </Text>
        <Text style={{ color: COLORS.primary, fontSize: FONT_SIZES.md }}>{product.unit} in stock</Text>
      </View>

      {/* Operation Type */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: SPACING.base }}>
        {typeOptions.map(opt => (
          <TouchableOpacity
            key={opt.key}
            onPress={() => setType(opt.key as any)}
            style={[
              { flex: 1, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, alignItems: 'center', borderWidth: 1.5, gap: 4 },
              type === opt.key ? { backgroundColor: opt.color, borderColor: opt.color } : { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons name={opt.icon as any} size={20} color={type === opt.key ? '#fff' : colors.textMuted} />
            <Text style={{ fontSize: FONT_SIZES.xs, color: type === opt.key ? '#fff' : colors.textMuted, fontWeight: FONTS.semiBold, textAlign: 'center' }}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label={type === 'adjustment' ? 'New Total Quantity' : 'Quantity'}
        value={quantity} onChangeText={setQuantity}
        keyboardType="numeric" placeholder="Enter quantity"
        leftIcon="layers-outline"
      />
      <Input label="Note (Optional)" value={note} onChangeText={setNote} placeholder="Reason for adjustment..." />

      <Button title="Apply Stock Change" onPress={handleAdjust} fullWidth icon="checkmark-circle-outline" size="lg" />

      {/* History */}
      {history.length > 0 && (
        <>
          <Divider style={{ marginVertical: SPACING.base }} />
          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: FONTS.bold, color: colors.textPrimary, marginBottom: 8 }}>Recent History</Text>
          {history.slice(0, 5).map(h => (
            <View key={h.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <View>
                <Text style={{ fontSize: FONT_SIZES.sm, color: colors.textPrimary, fontWeight: FONTS.medium, textTransform: 'capitalize' }}>
                  {h.type} • {h.quantity} {product.unit}
                </Text>
                {h.note && <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted }}>{h.note}</Text>}
              </View>
              <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted }}>
                {h.previous_quantity} → {h.new_quantity}
              </Text>
            </View>
          ))}
        </>
      )}
    </BottomModal>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  chipText: { fontSize: FONT_SIZES.sm, fontWeight: FONTS.medium },
  iconBtn: { width: 32, height: 32, borderRadius: BORDER_RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
});
