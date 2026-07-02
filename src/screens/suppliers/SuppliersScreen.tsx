// ============================================================
// GURBANI TRADERS - Suppliers Screen
// Supplier management with purchase history
// ============================================================

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp, formatCurrency } from '../../context/AppContext';
import {
  Button, Input, Card, BottomModal, Header, SearchBar,
  EmptyState, Badge, Divider,
} from '../../components/common/UIComponents';
import {
  getAllSuppliers, addSupplier, updateSupplier, deleteSupplier,
  getPurchaseOrders, type Supplier,
} from '../../database/suppliers';
import { COLORS, FONT_SIZES, SPACING, FONTS, BORDER_RADIUS } from '../../utils/theme';

export default function SuppliersScreen() {
  const { colors, settings } = useApp();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadSuppliers = useCallback(() => {
    setSuppliers(getAllSuppliers(search));
  }, [search]);

  useFocusEffect(useCallback(() => { loadSuppliers(); }, [loadSuppliers]));

  const handleDelete = (supplier: Supplier) => {
    Alert.alert('Delete Supplier', `Remove "${supplier.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteSupplier(supplier.id); loadSuppliers(); } },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title="Suppliers"
        subtitle={`${suppliers.length} suppliers`}
        rightAction={{ icon: 'add', label: 'Add', onPress: () => setShowAddModal(true) }}
      />

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name or phone..." />

      <FlatList
        data={suppliers}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: SPACING.base, paddingBottom: 100 }}
        ListEmptyComponent={
          <EmptyState
            icon="business-outline"
            title="No Suppliers"
            subtitle="Add your first supplier"
            action={{ label: 'Add Supplier', onPress: () => setShowAddModal(true) }}
          />
        }
        renderItem={({ item }) => (
          <Card onPress={() => { setSelectedSupplier(item); setShowDetailModal(true); }} style={{ marginBottom: SPACING.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 }}>
                <View style={{ width: 44, height: 44, borderRadius: BORDER_RADIUS.md, backgroundColor: `${COLORS.accent2}18`, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="business" size={20} color={COLORS.accent2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FONT_SIZES.base, fontWeight: FONTS.bold, color: colors.textPrimary }}>{item.name}</Text>
                  {item.phone && <Text style={{ fontSize: FONT_SIZES.sm, color: colors.textMuted }}>📞 {item.phone}</Text>}
                  <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted }}>
                    Total Purchases: {formatCurrency(item.total_purchases, settings.currency)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />

      <AddSupplierModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => { setShowAddModal(false); loadSuppliers(); }}
      />

      {selectedSupplier && (
        <SupplierDetailModal
          visible={showDetailModal}
          supplier={selectedSupplier}
          currency={settings.currency}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </View>
  );
}

const AddSupplierModal: React.FC<{
  visible: boolean; onClose: () => void; onSuccess: () => void;
}> = ({ visible, onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    addSupplier({ name: form.name.trim(), phone: form.phone || undefined, address: form.address || undefined });
    setForm({ name: '', phone: '', address: '' });
    setError('');
    onSuccess();
  };

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <BottomModal visible={visible} onClose={onClose} title="Add Supplier">
      <Input label="Supplier Name *" value={form.name} onChangeText={set('name')} placeholder="Business or person name" error={error} leftIcon="business-outline" />
      <Input label="Phone" value={form.phone} onChangeText={set('phone')} placeholder="03XXXXXXXXX" keyboardType="phone-pad" leftIcon="call-outline" />
      <Input label="Address" value={form.address} onChangeText={set('address')} placeholder="Street, Area, City" leftIcon="location-outline" />
      <Button title="Add Supplier" onPress={handleSave} fullWidth icon="checkmark-circle-outline" size="lg" />
    </BottomModal>
  );
};

const SupplierDetailModal: React.FC<{
  visible: boolean; supplier: Supplier; currency: string; onClose: () => void;
}> = ({ visible, supplier, currency, onClose }) => {
  const { colors } = useApp();
  const orders = getPurchaseOrders(supplier.id);

  return (
    <BottomModal visible={visible} onClose={onClose} title={supplier.name}>
      <View style={{ backgroundColor: `${COLORS.accent2}15`, borderRadius: BORDER_RADIUS.md, padding: SPACING.base, marginBottom: SPACING.base }}>
        <Text style={{ color: COLORS.accent2 }}>Total Purchases</Text>
        <Text style={{ color: COLORS.accent2, fontSize: FONT_SIZES['2xl'], fontWeight: FONTS.extraBold }}>
          {formatCurrency(supplier.total_purchases, currency)}
        </Text>
      </View>

      {[
        { label: 'Phone', value: supplier.phone || 'Not set', icon: 'call-outline' },
        { label: 'Address', value: supplier.address || 'Not set', icon: 'location-outline' },
      ].map(({ label, value, icon }) => (
        <View key={label} style={{ flexDirection: 'row', gap: 12, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Ionicons name={icon as any} size={18} color={COLORS.accent2} />
          <View>
            <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted }}>{label}</Text>
            <Text style={{ fontSize: FONT_SIZES.base, color: colors.textPrimary, fontWeight: FONTS.medium }}>{value}</Text>
          </View>
        </View>
      ))}

      <Divider style={{ marginVertical: SPACING.base }} />
      <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: FONTS.bold, color: colors.textSecondary, marginBottom: SPACING.sm }}>
        Purchase Orders ({orders.length})
      </Text>
      {orders.map(order => (
        <View key={order.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View>
            <Text style={{ fontWeight: FONTS.semiBold, color: colors.textPrimary }}>{order.order_number}</Text>
            <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted }}>{new Date(order.created_at).toLocaleDateString('en-PK')}</Text>
          </View>
          <Text style={{ fontWeight: FONTS.bold, color: COLORS.accent2 }}>{formatCurrency(order.total, currency)}</Text>
        </View>
      ))}
      {orders.length === 0 && (
        <Text style={{ textAlign: 'center', color: colors.textMuted, padding: SPACING.xl }}>No purchase orders yet</Text>
      )}
    </BottomModal>
  );
};
