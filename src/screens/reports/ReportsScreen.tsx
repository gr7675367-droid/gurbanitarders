// ============================================================
// GURBANI TRADERS - Reports Screen
// Daily/Weekly/Monthly/Yearly/Profit/Sales/Purchase/Stock reports
// ============================================================

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, formatCurrency } from '../../context/AppContext';
import { Card, Header, Divider, Badge } from '../../components/common/UIComponents';
import { getSalesReport } from '../../database/billing';
import { getAllProducts, getLowStockProducts, getTotalStockValue } from '../../database/products';
import { COLORS, FONT_SIZES, SPACING, FONTS, BORDER_RADIUS } from '../../utils/theme';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
type ReportType = 'sales' | 'profit' | 'stock' | 'lowstock';

const formatDate = (d: Date) => d.toISOString().slice(0, 10);

export default function ReportsScreen() {
  const { colors, settings } = useApp();
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [reportType, setReportType] = useState<ReportType>('sales');

  const { from, to, label } = useMemo(() => {
    const now = new Date();
    let from = new Date(now);
    let label = '';

    if (period === 'daily') {
      label = 'Today';
    } else if (period === 'weekly') {
      from.setDate(now.getDate() - 7);
      label = 'Last 7 Days';
    } else if (period === 'monthly') {
      from.setDate(now.getDate() - 30);
      label = 'Last 30 Days';
    } else {
      from.setFullYear(now.getFullYear() - 1);
      label = 'Last 12 Months';
    }

    return { from: formatDate(from), to: formatDate(now), label };
  }, [period]);

  const salesData = useMemo(() => getSalesReport(from, to), [from, to]);
  const products = useMemo(() => getAllProducts(), []);
  const lowStockProducts = useMemo(() => getLowStockProducts(), []);
  const stockValue = useMemo(() => getTotalStockValue(), []);

  const periods: { key: ReportPeriod; label: string; icon: string }[] = [
    { key: 'daily', label: 'Daily', icon: 'today-outline' },
    { key: 'weekly', label: 'Weekly', icon: 'calendar-outline' },
    { key: 'monthly', label: 'Monthly', icon: 'calendar-number-outline' },
    { key: 'yearly', label: 'Yearly', icon: 'calendar-clear-outline' },
  ];

  const reportTypes: { key: ReportType; label: string; icon: string }[] = [
    { key: 'sales', label: 'Sales', icon: 'receipt-outline' },
    { key: 'profit', label: 'Profit', icon: 'trending-up-outline' },
    { key: 'stock', label: 'Stock', icon: 'cube-outline' },
    { key: 'lowstock', label: 'Low Stock', icon: 'warning-outline' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Reports" subtitle="Business Analytics" />

      {/* Report Type Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 56, marginTop: SPACING.base }} contentContainerStyle={{ paddingHorizontal: SPACING.base, gap: 8 }}>
        {reportTypes.map(rt => (
          <TouchableOpacity
            key={rt.key}
            onPress={() => setReportType(rt.key)}
            style={[
              { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: BORDER_RADIUS.full, borderWidth: 1.5 },
              reportType === rt.key ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons name={rt.icon as any} size={16} color={reportType === rt.key ? '#fff' : colors.textMuted} />
            <Text style={{ color: reportType === rt.key ? '#fff' : colors.textMuted, fontWeight: FONTS.semiBold, fontSize: FONT_SIZES.sm }}>{rt.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Period Selector (only for sales/profit) */}
      {(reportType === 'sales' || reportType === 'profit') && (
        <View style={{ flexDirection: 'row', margin: SPACING.base, backgroundColor: colors.card, borderRadius: BORDER_RADIUS.lg, padding: 4, borderWidth: 1, borderColor: colors.border }}>
          {periods.map(p => (
            <TouchableOpacity
              key={p.key}
              onPress={() => setPeriod(p.key)}
              style={[
                { flex: 1, alignItems: 'center', padding: SPACING.sm, borderRadius: BORDER_RADIUS.md },
                period === p.key && { backgroundColor: colors.primary },
              ]}
            >
              <Text style={{ color: period === p.key ? '#fff' : colors.textMuted, fontSize: FONT_SIZES.xs, fontWeight: FONTS.semiBold }}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: SPACING.base, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {reportType === 'sales' && <SalesReportView data={salesData} label={label} currency={settings.currency} />}
        {reportType === 'profit' && <ProfitReportView data={salesData} label={label} currency={settings.currency} />}
        {reportType === 'stock' && <StockReportView products={products} stockValue={stockValue} currency={settings.currency} />}
        {reportType === 'lowstock' && <LowStockReportView products={lowStockProducts} currency={settings.currency} />}
      </ScrollView>
    </View>
  );
}

// ─── SALES REPORT ─────────────────────────────────────────────
const SalesReportView: React.FC<{ data: any; label: string; currency: string }> = ({ data, label, currency }) => {
  const { colors } = useApp();
  return (
    <View>
      <Card style={{ backgroundColor: COLORS.primary }} padding={SPACING.lg}>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: FONT_SIZES.sm }}>{label.toUpperCase()} SALES</Text>
        <Text style={{ color: '#fff', fontSize: FONT_SIZES['4xl'], fontWeight: FONTS.extraBold, marginTop: 4 }}>
          {formatCurrency(data.summary.total_sales, currency)}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>{data.summary.bill_count} bills</Text>
      </Card>

      <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
        <Card style={{ flex: 1 }} padding={SPACING.md}>
          <Text style={{ color: colors.textMuted, fontSize: FONT_SIZES.xs }}>PAID</Text>
          <Text style={{ color: COLORS.primary, fontSize: FONT_SIZES.xl, fontWeight: FONTS.bold }}>
            {formatCurrency(data.summary.total_paid, currency)}
          </Text>
        </Card>
        <Card style={{ flex: 1 }} padding={SPACING.md}>
          <Text style={{ color: colors.textMuted, fontSize: FONT_SIZES.xs }}>CREDIT (UDHAAR)</Text>
          <Text style={{ color: COLORS.warning, fontSize: FONT_SIZES.xl, fontWeight: FONTS.bold }}>
            {formatCurrency(data.summary.total_credit, currency)}
          </Text>
        </Card>
      </View>

      <Text style={{ fontSize: FONT_SIZES.base, fontWeight: FONTS.bold, color: colors.textPrimary, marginTop: SPACING.lg, marginBottom: SPACING.sm }}>
        Bills ({data.bills.length})
      </Text>
      {data.bills.slice(0, 20).map((bill: any) => (
        <Card key={bill.id} style={{ marginBottom: SPACING.sm }} padding={SPACING.md}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontWeight: FONTS.semiBold, color: colors.textPrimary }}>{bill.bill_number}</Text>
              <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted }}>{new Date(bill.created_at).toLocaleDateString('en-PK')}</Text>
            </View>
            <Text style={{ fontWeight: FONTS.bold, color: COLORS.primary }}>{formatCurrency(bill.total, currency)}</Text>
          </View>
        </Card>
      ))}
      {data.bills.length === 0 && (
        <Text style={{ textAlign: 'center', color: colors.textMuted, padding: SPACING.xl }}>No sales in this period</Text>
      )}
    </View>
  );
};

// ─── PROFIT REPORT ────────────────────────────────────────────
const ProfitReportView: React.FC<{ data: any; label: string; currency: string }> = ({ data, label, currency }) => {
  const { colors } = useApp();
  const margin = data.summary.total_sales > 0 ? ((data.profit / data.summary.total_sales) * 100).toFixed(1) : '0';

  return (
    <View>
      <Card style={{ backgroundColor: COLORS.accent3 }} padding={SPACING.lg}>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: FONT_SIZES.sm }}>{label.toUpperCase()} PROFIT</Text>
        <Text style={{ color: '#fff', fontSize: FONT_SIZES['4xl'], fontWeight: FONTS.extraBold, marginTop: 4 }}>
          {formatCurrency(data.profit, currency)}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>Margin: {margin}%</Text>
      </Card>

      <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
        <Card style={{ flex: 1 }} padding={SPACING.md}>
          <Text style={{ color: colors.textMuted, fontSize: FONT_SIZES.xs }}>TOTAL REVENUE</Text>
          <Text style={{ color: colors.textPrimary, fontSize: FONT_SIZES.xl, fontWeight: FONTS.bold }}>
            {formatCurrency(data.summary.total_sales, currency)}
          </Text>
        </Card>
        <Card style={{ flex: 1 }} padding={SPACING.md}>
          <Text style={{ color: colors.textMuted, fontSize: FONT_SIZES.xs }}>NET PROFIT</Text>
          <Text style={{ color: COLORS.primary, fontSize: FONT_SIZES.xl, fontWeight: FONTS.bold }}>
            {formatCurrency(data.profit, currency)}
          </Text>
        </Card>
      </View>
    </View>
  );
};

// ─── STOCK REPORT ─────────────────────────────────────────────
const StockReportView: React.FC<{ products: any[]; stockValue: any; currency: string }> = ({ products, stockValue, currency }) => {
  const { colors } = useApp();

  return (
    <View>
      <Card style={{ backgroundColor: COLORS.accent2 }} padding={SPACING.lg}>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: FONT_SIZES.sm }}>TOTAL STOCK VALUE (SELLING)</Text>
        <Text style={{ color: '#fff', fontSize: FONT_SIZES['4xl'], fontWeight: FONTS.extraBold, marginTop: 4 }}>
          {formatCurrency(stockValue.selling_value, currency)}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
          Purchase Value: {formatCurrency(stockValue.purchase_value, currency)}
        </Text>
      </Card>

      <Text style={{ fontSize: FONT_SIZES.base, fontWeight: FONTS.bold, color: colors.textPrimary, marginTop: SPACING.lg, marginBottom: SPACING.sm }}>
        All Products ({products.length})
      </Text>
      {products.map(product => (
        <Card key={product.id} style={{ marginBottom: SPACING.sm }} padding={SPACING.md}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: FONTS.semiBold, color: colors.textPrimary }}>{product.name}</Text>
              <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted }}>{product.category}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontWeight: FONTS.bold, color: colors.textPrimary }}>{product.quantity} {product.unit}</Text>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.primary }}>
                {formatCurrency(product.quantity * product.selling_price, currency)}
              </Text>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
};

// ─── LOW STOCK REPORT ─────────────────────────────────────────
const LowStockReportView: React.FC<{ products: any[]; currency: string }> = ({ products, currency }) => {
  const { colors } = useApp();

  return (
    <View>
      <Card style={{ backgroundColor: COLORS.warning }} padding={SPACING.lg}>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: FONT_SIZES.sm }}>LOW STOCK ITEMS</Text>
        <Text style={{ color: '#fff', fontSize: FONT_SIZES['4xl'], fontWeight: FONTS.extraBold, marginTop: 4 }}>
          {products.length}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>Products need restocking</Text>
      </Card>

      {products.map(product => (
        <Card key={product.id} style={{ marginTop: SPACING.sm }} padding={SPACING.md}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: FONTS.semiBold, color: colors.textPrimary }}>{product.name}</Text>
              <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted }}>{product.category}</Text>
            </View>
            <Badge label={`${product.quantity} ${product.unit} left`} color={COLORS.warning} size="md" />
          </View>
        </Card>
      ))}
      {products.length === 0 && (
        <View style={{ alignItems: 'center', padding: SPACING['3xl'] }}>
          <Ionicons name="checkmark-circle" size={50} color={COLORS.primary} />
          <Text style={{ color: colors.textPrimary, fontWeight: FONTS.bold, marginTop: SPACING.md }}>All Stocked Up!</Text>
          <Text style={{ color: colors.textMuted }}>No products are low on stock</Text>
        </View>
      )}
    </View>
  );
};
