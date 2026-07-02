// ============================================================
// GURBANI TRADERS - Settings Screen
// Business settings, dark mode, backup/restore, about
// ============================================================

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useApp } from '../../context/AppContext';
import { Header, Card, Input, Button, BottomModal, Divider } from '../../components/common/UIComponents';
import { backupDatabase, restoreDatabase } from '../../database/settings';
import { COLORS, FONT_SIZES, SPACING, FONTS, BORDER_RADIUS, APP_INFO } from '../../utils/theme';

export default function SettingsScreen() {
  const { colors, settings, isDarkMode, toggleDarkMode, updateSetting, refreshSettings } = useApp();
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      await backupDatabase();
      Alert.alert('✅ Backup Complete', 'Your data has been exported successfully');
    } catch (e) {
      Alert.alert('Error', 'Backup failed. Please try again.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) return;

      Alert.alert(
        'Restore Backup',
        'This will replace your current data with the backup. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore', style: 'destructive', onPress: async () => {
              try {
                const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
                await restoreDatabase(content);
                Alert.alert('✅ Restore Complete', 'Your data has been restored. Please restart the app.');
              } catch (e) {
                Alert.alert('Error', 'Invalid backup file or restore failed.');
              }
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to pick backup file.');
    }
  };

  const settingsItems = [
    { icon: 'business-outline', label: 'Business Information', sublabel: settings.business_name, onPress: () => setShowBusinessModal(true) },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Settings" subtitle="App Preferences" />

      <ScrollView contentContainerStyle={{ padding: SPACING.base, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Business Info */}
        <SectionTitle title="BUSINESS" />
        <Card padding={0}>
          <SettingRow icon="business-outline" label="Business Information" sublabel={settings.business_name} onPress={() => setShowBusinessModal(true)} />
          <Divider style={{ marginVertical: 0, marginHorizontal: SPACING.md }} />
          <SettingRow icon="cash-outline" label="Currency" sublabel={`${settings.currency} (${settings.currency_code})`} />
        </Card>

        {/* Appearance */}
        <SectionTitle title="APPEARANCE" />
        <Card padding={0}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
              <View style={{ width: 36, height: 36, borderRadius: BORDER_RADIUS.sm, backgroundColor: `${COLORS.dark}15`, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="moon-outline" size={18} color={colors.textPrimary} />
              </View>
              <Text style={{ fontSize: FONT_SIZES.base, color: colors.textPrimary, fontWeight: FONTS.medium }}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: colors.border, true: COLORS.primaryLight }}
              thumbColor={isDarkMode ? COLORS.primary : '#f4f3f4'}
            />
          </View>
        </Card>

        {/* Data Management */}
        <SectionTitle title="DATA MANAGEMENT" />
        <Card padding={0}>
          <SettingRow icon="cloud-upload-outline" label="Backup Data" sublabel="Export all data to a file" onPress={handleBackup} loading={backupLoading} />
          <Divider style={{ marginVertical: 0, marginHorizontal: SPACING.md }} />
          <SettingRow icon="cloud-download-outline" label="Restore Data" sublabel="Import data from backup file" onPress={handleRestore} />
        </Card>

        {/* About */}
        <SectionTitle title="ABOUT" />
        <Card padding={0}>
          <SettingRow icon="information-circle-outline" label="About Gurbani Traders" sublabel="App version, contact info" onPress={() => setShowAboutModal(true)} />
        </Card>

        {/* Offline Badge */}
        <View style={{ alignItems: 'center', marginTop: SPACING.xl, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primaryPale, paddingHorizontal: 14, paddingVertical: 8, borderRadius: BORDER_RADIUS.full }}>
            <Ionicons name="cloud-offline-outline" size={16} color={COLORS.primary} />
            <Text style={{ color: COLORS.primary, fontSize: FONT_SIZES.sm, fontWeight: FONTS.semiBold }}>100% Offline App</Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: FONT_SIZES.xs }}>All your data stays on this device</Text>
        </View>
      </ScrollView>

      {/* Business Info Modal */}
      <BusinessInfoModal
        visible={showBusinessModal}
        onClose={() => setShowBusinessModal(false)}
        settings={settings}
        updateSetting={updateSetting}
        refreshSettings={refreshSettings}
      />

      {/* About Modal */}
      <AboutModal visible={showAboutModal} onClose={() => setShowAboutModal(false)} />
    </View>
  );
}

const SectionTitle: React.FC<{ title: string }> = ({ title }) => {
  const { colors } = useApp();
  return (
    <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: FONTS.bold, color: colors.textMuted, marginBottom: SPACING.sm, marginTop: SPACING.md, letterSpacing: 1 }}>
      {title}
    </Text>
  );
};

const SettingRow: React.FC<{
  icon: string; label: string; sublabel?: string; onPress?: () => void; loading?: boolean;
}> = ({ icon, label, sublabel, onPress, loading }) => {
  const { colors } = useApp();
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 }}>
        <View style={{ width: 36, height: 36, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.primaryPale, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon as any} size={18} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FONT_SIZES.base, color: colors.textPrimary, fontWeight: FONTS.medium }}>{label}</Text>
          {sublabel && <Text style={{ fontSize: FONT_SIZES.sm, color: colors.textMuted, marginTop: 1 }}>{sublabel}</Text>}
        </View>
      </View>
      {onPress && !loading && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
      {loading && <Text style={{ color: COLORS.primary, fontSize: FONT_SIZES.sm }}>...</Text>}
    </Wrapper>
  );
};

const BusinessInfoModal: React.FC<{
  visible: boolean; onClose: () => void; settings: any;
  updateSetting: (key: any, value: string) => void; refreshSettings: () => void;
}> = ({ visible, onClose, settings, updateSetting, refreshSettings }) => {
  const [form, setForm] = useState({
    business_name: settings.business_name,
    shop_address: settings.shop_address,
    contact1: settings.contact1,
    contact2: settings.contact2,
    currency: settings.currency,
  });

  const handleSave = () => {
    Object.entries(form).forEach(([key, value]) => updateSetting(key, value as string));
    refreshSettings();
    Alert.alert('✅ Saved', 'Business information updated');
    onClose();
  };

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <BottomModal visible={visible} onClose={onClose} title="Business Information">
      <Input label="Business Name" value={form.business_name} onChangeText={set('business_name')} leftIcon="business-outline" />
      <Input label="Shop Address" value={form.shop_address} onChangeText={set('shop_address')} leftIcon="location-outline" multiline numberOfLines={2} />
      <Input label="Contact Number 1" value={form.contact1} onChangeText={set('contact1')} keyboardType="phone-pad" leftIcon="call-outline" />
      <Input label="Contact Number 2" value={form.contact2} onChangeText={set('contact2')} keyboardType="phone-pad" leftIcon="call-outline" />
      <Input label="Currency Symbol" value={form.currency} onChangeText={set('currency')} leftIcon="cash-outline" />
      <Button title="Save Changes" onPress={handleSave} fullWidth icon="checkmark-circle-outline" size="lg" />
    </BottomModal>
  );
};

const AboutModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const { colors } = useApp();

  const callNumber = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <BottomModal visible={visible} onClose={onClose} title="About Us">
      <View style={{ alignItems: 'center', marginBottom: SPACING.lg }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md }}>
          <Ionicons name="storefront" size={40} color="#fff" />
        </View>
        <Text style={{ fontSize: FONT_SIZES.xl, fontWeight: FONTS.extraBold, color: colors.textPrimary }}>
          {APP_INFO.name}
        </Text>
        <Text style={{ fontSize: FONT_SIZES.sm, color: colors.textMuted, marginTop: 2 }}>{APP_INFO.tagline}</Text>
        <Text style={{ fontSize: FONT_SIZES.xs, color: colors.textMuted, marginTop: 8 }}>Version 1.0.0</Text>
      </View>

      <Divider />

      <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: FONTS.bold, color: colors.textSecondary, marginBottom: SPACING.sm, marginTop: SPACING.md, letterSpacing: 0.5 }}>
        CONTACT US
      </Text>

      {[APP_INFO.owner1, APP_INFO.owner2].map((owner, idx) => (
        <TouchableOpacity
          key={idx}
          onPress={() => callNumber(owner.phone)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, backgroundColor: COLORS.primaryPale, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="person" size={22} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FONT_SIZES.base, fontWeight: FONTS.bold, color: COLORS.primary }}>{owner.name}</Text>
            <Text style={{ fontSize: FONT_SIZES.sm, color: colors.textSecondary }}>📞 {owner.phone}</Text>
          </View>
          <Ionicons name="call" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      ))}

      <Divider style={{ marginVertical: SPACING.base }} />
      <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: FONT_SIZES.xs }}>
        © 2026 Gurbani Traders. All rights reserved.{'\n'}Built with care for professional inventory management.
      </Text>
    </BottomModal>
  );
};
