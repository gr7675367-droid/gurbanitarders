// ============================================================
// GURBANI TRADERS - Dashboard Screen
// Business overview: sales, stock, profit, recent activity
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp, formatCurrency } from '../../context/AppContext';
import { StatCard, Card, Badge } from '../../components/common/UIComponents';
import { COLORS, FONT_SIZES, SPACING, FONTS, BORDER_RADIUS } from '../../utils/theme';
import { getAllProducts, getLowStockProducts, getTotalStockValue } from '../../database/products';
import { getTodaySalesSummary, getMonthlySales } from '../../database/billing';
import { getTotalCreditOutstanding } from '../../database/customers';
import { getActivityLog } from '../../database/settings';

interface DashboardData {
  totalProducts: number;
  stockValue: number;
  lowStockCount: number;
  todaySales: number;
  todayBills: number;
  monthlySales: number;
  todayProfit: number;
  totalCredit: number;
  recentActivity: any[];
}

export default function DashboardScreen() {
  const { colors, settings } = useApp();
  const [data, setData] = useState<DashboardData>({
    totalProducts: 0, stockValue: 0, lowStockCount: 0,
    todaySales: 0, todayBills: 0, monthlySales: 0,
    todayProfit: 0, totalCredit: 0, recentActivity: [],
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    try {
      const products = getAllProducts();
      const lowStock = getLowStockProducts();
      const stockValue = getTotalStockValue();
      const todaySales = getTodaySalesSummary();
      const monthlySales = getMonthlySales();
      const totalCredit = getTotalCreditOutstanding();
      const activity = getActivityLog(15);

      setData({
        totalProducts: products.length,
        stockValue: stockValue.selling_value,
        lowStockCount: lowStock.length,
        todaySales: todaySales.total,
        todayBills: todaySales.count,
        monthlySales: monthlySales.total,
        todayProfit: todaySales.profit,
        totalCredit,
        recentActivity: activity,
      });
    } catch (e) {
      console.error('Dashboard load error:', e);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 600);
  }, [loadData]);

  const today = new Date().toLocaleDateString('en-PK', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header Banner */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View>
          <Text style={styles.businessName}>{settings.business_name}</Text>
          <Text style={styles.dateText}>{today}</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="storefront" size={32} color="rgba(255,255,255,0.9)" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        contentContainerStyle={{ padding: SPACING.base, paddingBottom: 100 }}
      >
        {/* Today Sales Banner */}
        <Card style={{ backgroundColor: COLORS.primary, marginBottom: SPACING.md }} padding={SPACING.lg}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: FONT_SIZES.sm, fontWeight: FONTS.medium }}>
            TODAY'S SALES
          </Text>
          <Text style={{ color: '#fff', fontSize: FONT_SIZES['4xl'], fontWeight: FONTS.extraBold, marginTop: 4 }}>
            {formatCurrency(data.todaySales, settings.currency)}
          </Text>
          <View style={{ flexDirection: 'row', gap: SPACING.xl, marginTop: SPACING.sm }}>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZES.xs }}>Bills</Text>
              <Text style={{ color: '#fff', fontSize: FONT_SIZES.lg, fontWeight: FONTS.bold }}>{data.todayBills}</Text>
            </View>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZES.xs }}>Profit</Text>
              <Text style={{ color: '#fff', fontSize: FONT_SIZES.lg, fontWeight: FONTS.bold }}>
                {formatCurrency(data.todayProfit, settings.currency)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Quick Stats Grid */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Overview</Text>
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm }}>
          <StatCard
            title="Total Products"
            value={String(data.totalProducts)}
            icon="cube-outline"
            color={COLORS.primary}
          />
          <StatCard
            title="Stock Value"
            value={formatCurrency(data.stockValue, settings.currency)}
            icon="wallet-outline"
            color={COLORS.accent2}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm }}>
          <StatCard
            title="Low Stock"
            value={String(data.lowStockCount)}
            icon="warning-outline"
            color={data.lowStockCount > 0 ? COLORS.warning : COLORS.primary}
            subtitle={data.lowStockCount > 0 ? 'Needs attention' : 'All good'}
          />
          <StatCard
            title="Monthly Sales"
            value={formatCurrency(data.monthlySales, settings.currency)}
            icon="trending-up-outline"
            color={COLORS.accent3}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.base }}>
          <StatCard
            title="Credit (Udhaar)"
            value={formatCurrency(data.totalCredit, settings.currency)}
            icon="people-outline"
            color={data.totalCredit > 0 ? COLORS.warning : COLORS.primary}
            subtitle={data.totalCredit > 0 ? 'Outstanding' : 'Cleared'}
          />
        </View>

        {/* Recent Activity */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
        <Card padding={0}>
          {data.recentActivity.length === 0 ? (
            <View style={{ padding: SPACING.xl, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontSize: FONT_SIZES.md }}>No recent activity</Text>
            </View>
          ) : (
            data.recentActivity.map((activity, index) => (
              <ActivityItem key={activity.id} activity={activity} isLast={index === data.recentActivity.length - 1} />
            ))
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

// ─── ACTIVITY ITEM ────────────────────────────────────────────
const ActivityItem: React.FC<{ activity: any; isLast: boolean }> = ({ activity, isLast }) => {
  const { colors } = useApp();

  const iconMap: Record<string, { icon: string; color: string }> = {
    sale: { icon: 'receipt-outline', color: COLORS.primary },
    purchase: { icon: 'cart-outline', color: COLORS.accent2 },
    product: { icon: 'cube-outline', color: COLORS.accent3 },
    stock: { icon: 'layers-outline', color: COLORS.accent1 },
    payment: { icon: 'cash-outline', color: COLORS.success },
  };

  const { icon, color } = iconMap[activity.type] || { icon: 'ellipse-outline', color: COLORS.mediumGray };
  const time = new Date(activity.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  const date = new Date(activity.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });

  return (
    <View style={[
      { flexDirection: 'row', padding: SPACING.md, alignItems: 'center', gap: SPACING.md },
      !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
    ]}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${color}18`, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FONT_SIZES.sm, color: colors.textPrimary, fontWeight: FONTS.medium }} numberOfLines={1}>
          {activity.description}
        </Text>
        <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted, marginTop: 2 }}>
          {date} at {time}
        </Text>
      </View>
      {activity.amount && (
        <Text style={{ fontSize: FONT_SIZES.sm, color: color, fontWeight: FONTS.semiBold }}>
          Rs.{activity.amount.toFixed(0)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  businessName: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONTS.extraBold,
    color: '#fff',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  headerIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONTS.bold,
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
});
