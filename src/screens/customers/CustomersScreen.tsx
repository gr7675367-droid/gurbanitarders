// ============================================================
// GURBANI TRADERS - Customers Screen
// Customer management with Udhaar (credit) tracking
// ============================================================

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp, formatCurrency } from '../../context/AppContext';
import {
  Button, Input, Card, BottomModal, Header, SearchBar,
  EmptyState, Badge, Divider,
} from '../../components/common/UIComponents';
import {
  getAllCustomers, addCustomer, updateCustomer, deleteCustomer,
  recordCustomerPayment, getCustomerPaymentHistory, getCustomerBills,
  type Customer,
} from '../../database/customers';
import { COLORS, FONT_SIZES, SPACING, FONTS, BORDER_RADIUS } from '../../utils/theme';

export default function CustomersScreen() {
  const { colors, settings } = useApp();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadCustomers = useCallback(() => {
    setCustomers(getAllCustomers(search));
  }, [search]);

  useFocusEffect(useCallback(() => { loadCustomers(); }, [loadCustomers]));

  const totalCredit = customers.reduce((sum, c) => sum + c.credit_balance, 0);

  const handleDelete = (customer: Customer) => {
    Alert.alert('Delete Customer', `Remove "${customer.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteCustomer(customer.id); setRefreshKey(k => k + 1); loadCustomers(); } },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title="Customers"
        subtitle={`${customers.length} customers`}
        rightAction={{ icon: 'add', label: 'Add', onPress: () => setShowAddModal(true) }}
      />

      {/* Credit Summary Banner */}
      {totalCredit > 0 && (
        <View style={{ backgroundColor: `${COLORS.warning}18`, margin: SPACING.base, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="warning-outline" size={24} color={COLORS.warning} />
          <View>
            <Text style={{ color: COLORS.warning, fontWeight: FONTS.bold }}>Outstanding Udhaar</Text>
            <Text style={{ color: COLORS.warning, fontSize: FONT_SIZES.lg, fontWeight: FONTS.extraBold }}>
              {formatCurrency(totalCredit, settings.currency)}
            </Text>
          </View>
        </View>
      )}

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name or phone..." />

      <FlatList
        data={customers}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: SPACING.base, paddingBottom: 100 }}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No Customers"
            subtitle="Add your first customer"
            action={{ label: 'Add Customer', onPress: () => setShowAddModal(true) }}
          />
        }
        renderItem={({ item }) => (
          <CustomerCard
            customer={item}
            currency={settings.currency}
            onPress={() => { setSelectedCustomer(item); setShowDetailModal(true); }}
            onDelete={() => handleDelete(item)}
          />
        )}
      />

      {/* Add Modal */}
      <AddCustomerModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => { setShowAddModal(false); loadCustomers(); }}
      />

      {/* Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          visible={showDetailModal}
          customer={selectedCustomer}
          currency={settings.currency}
          onClose={() => setShowDetailModal(false)}
          onPaymentRecorded={() => { loadCustomers(); }}
        />
      )}
    </View>
  );
}

// ─── CUSTOMER CARD ────────────────────────────────────────────
const CustomerCard: React.FC<{
  customer: Customer;
  currency: string;
  onPress: () => void;
  onDelete: () => void;
}> = ({ customer, currency, onPress, onDelete }) => {
  const { colors } = useApp();

  return (
    <Card onPress={onPress} style={{ marginBottom: SPACING.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryPale, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: FONTS.bold, color: COLORS.primary }}>
              {customer.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FONT_SIZES.base, fontWeight: FONTS.bold, color: colors.textPrimary }}>{customer.name}</Text>
            {customer.mobile && <Text style={{ fontSize: FONT_SIZES.sm, color: colors.textMuted }}>📞 {customer.mobile}</Text>}
            <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted }}>
              Total Purchases: {formatCurrency(customer.total_purchases, currency)}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          {customer.credit_balance > 0 ? (
            <Badge label={`Udhaar: ${formatCurrency(customer.credit_balance, currency)}`} color={COLORS.warning} size="md" />
          ) : (
            <Badge label="Cleared" color={COLORS.primary} size="sm" />
          )}
          <TouchableOpacity onPress={onDelete}>
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

// ─── ADD CUSTOMER MODAL ───────────────────────────────────────
const AddCustomerModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ visible, onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', mobile: '', address: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    addCustomer({ name: form.name.trim(), mobile: form.mobile || undefined, address: form.address || undefined });
    setForm({ name: '', mobile: '', address: '' });
    onSuccess();
  };

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <BottomModal visible={visible} onClose={onClose} title="Add Customer">
      <Input label="Full Name *" value={form.name} onChangeText={set('name')} placeholder="Customer name" error={errors.name} leftIcon="person-outline" />
      <Input label="Mobile Number" value={form.mobile} onChangeText={set('mobile')} placeholder="03XXXXXXXXX" keyboardType="phone-pad" leftIcon="call-outline" />
      <Input label="Address" value={form.address} onChangeText={set('address')} placeholder="Street, Area, City" leftIcon="location-outline" />
      <Button title="Add Customer" onPress={handleSave} fullWidth icon="checkmark-circle-outline" size="lg" />
    </BottomModal>
  );
};

// ─── CUSTOMER DETAIL MODAL ────────────────────────────────────
const CustomerDetailModal: React.FC<{
  visible: boolean;
  customer: Customer;
  currency: string;
  onClose: () => void;
  onPaymentRecorded: () => void;
}> = ({ visible, customer, currency, onClose, onPaymentRecorded }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'payment'>('info');
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const { colors } = useApp();

  const history = getCustomerPaymentHistory(customer.id);
  const bills = getCustomerBills(customer.id) as any[];

  const handlePayment = () => {
    if (!payAmount || isNaN(Number(payAmount)) || Number(payAmount) <= 0) {
      Alert.alert('Error', 'Enter a valid payment amount');
      return;
    }
    recordCustomerPayment(customer.id, Number(payAmount), payNote);
    setPayAmount('');
    setPayNote('');
    Alert.alert('✅ Payment Recorded', `Rs. ${payAmount} received from ${customer.name}`);
    onPaymentRecorded();
  };

  const tabs = [
    { key: 'info', label: 'Info', icon: 'person-outline' },
    { key: 'history', label: 'History', icon: 'receipt-outline' },
    { key: 'payment', label: 'Payment', icon: 'cash-outline' },
  ];

  return (
    <BottomModal visible={visible} onClose={onClose} title={customer.name}>
      {/* Credit Badge */}
      {customer.credit_balance > 0 && (
        <View style={{ backgroundColor: `${COLORS.warning}18`, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.base }}>
          <Text style={{ color: COLORS.warning, fontSize: FONT_SIZES['2xl'], fontWeight: FONTS.extraBold }}>
            Udhaar: {formatCurrency(customer.credit_balance, currency)}
          </Text>
        </View>
      )}

      {/* Tab Row */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: SPACING.base }}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as any)}
            style={[
              { flex: 1, alignItems: 'center', padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 1.5, gap: 4 },
              activeTab === tab.key ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary } : { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? '#fff' : colors.textMuted} />
            <Text style={{ fontSize: FONT_SIZES.xs, color: activeTab === tab.key ? '#fff' : colors.textMuted, fontWeight: FONTS.semiBold }}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'info' && (
        <View>
          {[
            { label: 'Phone', value: customer.mobile || 'Not set', icon: 'call-outline' },
            { label: 'Address', value: customer.address || 'Not set', icon: 'location-outline' },
            { label: 'Total Purchases', value: formatCurrency(customer.total_purchases, currency), icon: 'trending-up-outline' },
            { label: 'Credit Balance', value: formatCurrency(customer.credit_balance, currency), icon: 'warning-outline' },
            { label: 'Customer Since', value: new Date(customer.created_at).toLocaleDateString('en-PK'), icon: 'calendar-outline' },
          ].map(({ label, value, icon }) => (
            <View key={label} style={{ flexDirection: 'row', gap: 12, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Ionicons name={icon as any} size={18} color={COLORS.primary} />
              <View>
                <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted }}>{label}</Text>
                <Text style={{ fontSize: FONT_SIZES.base, color: colors.textPrimary, fontWeight: FONTS.medium }}>{value}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {activeTab === 'history' && (
        <View>
          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: FONTS.bold, color: colors.textSecondary, marginBottom: SPACING.sm }}>
            Recent Bills ({bills.length})
          </Text>
          {bills.slice(0, 10).map((bill: any) => (
            <View key={bill.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View>
                <Text style={{ fontWeight: FONTS.semiBold, color: colors.textPrimary }}>{bill.bill_number}</Text>
                <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted }}>{new Date(bill.created_at).toLocaleDateString('en-PK')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontWeight: FONTS.bold, color: COLORS.primary }}>{formatCurrency(bill.total, currency)}</Text>
                {bill.credit_amount > 0 && <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.warning }}>Udhaar: {formatCurrency(bill.credit_amount, currency)}</Text>}
              </View>
            </View>
          ))}

          <Divider style={{ marginVertical: SPACING.base }} />
          <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: FONTS.bold, color: colors.textSecondary, marginBottom: SPACING.sm }}>
            Payment History
          </Text>
          {history.map(payment => (
            <View key={payment.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View>
                <Text style={{ fontWeight: FONTS.semiBold, color: colors.textPrimary, textTransform: 'capitalize' }}>
                  {payment.type === 'payment' ? '✅ Payment' : payment.type === 'credit' ? '⚠ Credit' : '↩ Refund'}
                </Text>
                <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted }}>{new Date(payment.created_at).toLocaleDateString('en-PK')}</Text>
                {payment.note && <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted }}>{payment.note}</Text>}
              </View>
              <Text style={{ fontWeight: FONTS.bold, color: payment.type === 'payment' ? COLORS.primary : COLORS.warning }}>
                {formatCurrency(payment.amount, currency)}
              </Text>
            </View>
          ))}
          {history.length === 0 && bills.length === 0 && (
            <Text style={{ textAlign: 'center', color: colors.textMuted, padding: SPACING.xl }}>No history yet</Text>
          )}
        </View>
      )}

      {activeTab === 'payment' && (
        <View>
          <View style={{ backgroundColor: COLORS.primaryPale, borderRadius: BORDER_RADIUS.md, padding: SPACING.base, marginBottom: SPACING.base }}>
            <Text style={{ color: COLORS.primary }}>Outstanding Amount</Text>
            <Text style={{ color: COLORS.primary, fontSize: FONT_SIZES['3xl'], fontWeight: FONTS.extraBold }}>
              {formatCurrency(customer.credit_balance, currency)}
            </Text>
          </View>
          <Input label="Payment Amount" value={payAmount} onChangeText={setPayAmount}
            placeholder="Enter amount received" keyboardType="numeric" leftIcon="cash-outline" />
          <Input label="Note (Optional)" value={payNote} onChangeText={setPayNote} placeholder="e.g. Cash received" />
          <Button
            title="Record Payment"
            onPress={handlePayment}
            fullWidth icon="checkmark-circle-outline" size="lg"
            disabled={customer.credit_balance <= 0}
          />
          {customer.credit_balance <= 0 && (
            <Text style={{ textAlign: 'center', color: COLORS.primary, marginTop: SPACING.md, fontWeight: FONTS.semiBold }}>
              ✅ No outstanding balance
            </Text>
          )}
        </View>
      )}
    </BottomModal>
  );
};
