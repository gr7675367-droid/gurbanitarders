// ============================================================
// GURBANI TRADERS - Common UI Components
// Reusable building blocks for the entire app
// ============================================================

import React from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, Modal, ScrollView, Pressable, ViewStyle, TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '../../utils/theme';
import { useApp } from '../../context/AppContext';

// ─── BUTTON ───────────────────────────────────────────────────
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = 'primary', size = 'md',
  loading, disabled, icon, style, fullWidth,
}) => {
  const { colors } = useApp();

  const variants = {
    primary: { bg: colors.primary, text: '#fff', border: colors.primary },
    secondary: { bg: colors.primaryPale, text: colors.primary, border: colors.primaryPale },
    outline: { bg: 'transparent', text: colors.primary, border: colors.primary },
    danger: { bg: COLORS.error, text: '#fff', border: COLORS.error },
    ghost: { bg: 'transparent', text: colors.textSecondary, border: 'transparent' },
  };

  const sizes = {
    sm: { py: 6, px: 12, fontSize: FONT_SIZES.sm, iconSize: 14 },
    md: { py: 10, px: 16, fontSize: FONT_SIZES.md, iconSize: 16 },
    lg: { py: 14, px: 20, fontSize: FONT_SIZES.base, iconSize: 18 },
  };

  const v = variants[variant];
  const s = sizes[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: 1.5,
          borderRadius: BORDER_RADIUS.md,
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <>
          {icon && <Ionicons name={icon as any} size={s.iconSize} color={v.text} />}
          <Text style={{ color: v.text, fontSize: s.fontSize, fontWeight: FONTS.semiBold }}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// ─── INPUT ────────────────────────────────────────────────────
interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  editable?: boolean;
  secureTextEntry?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label, value, onChangeText, placeholder, keyboardType = 'default',
  multiline, numberOfLines, error, leftIcon, rightIcon, onRightIconPress,
  style, editable = true, secureTextEntry,
}) => {
  const { colors } = useApp();

  return (
    <View style={[{ marginBottom: SPACING.base }, style]}>
      {label && (
        <Text style={{
          fontSize: FONT_SIZES.sm,
          fontWeight: FONTS.semiBold,
          color: colors.textSecondary,
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          {label}
        </Text>
      )}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1.5,
        borderColor: error ? COLORS.error : colors.border,
        paddingHorizontal: SPACING.md,
      }}>
        {leftIcon && (
          <Ionicons name={leftIcon as any} size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          secureTextEntry={secureTextEntry}
          style={{
            flex: 1,
            paddingVertical: SPACING.md,
            fontSize: FONT_SIZES.base,
            color: colors.textPrimary,
            textAlignVertical: multiline ? 'top' : 'auto',
            minHeight: multiline ? 80 : undefined,
          }}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress}>
            <Ionicons name={rightIcon as any} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={{ color: COLORS.error, fontSize: FONT_SIZES.sm, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
};

// ─── CARD ─────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress, padding }) => {
  const { colors } = useApp();
  const cardStyle = {
    backgroundColor: colors.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: padding ?? SPACING.base,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: colors.border,
  };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[cardStyle, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[cardStyle, style]}>{children}</View>;
};

// ─── STAT CARD ────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color?: string;
  subtitle?: string;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle, onPress }) => {
  const { colors } = useApp();
  const accentColor = color || colors.primary;

  return (
    <Card onPress={onPress} style={{ flex: 1 }} padding={SPACING.md}>
      <View style={{
        width: 40, height: 40, borderRadius: BORDER_RADIUS.md,
        backgroundColor: `${accentColor}18`, alignItems: 'center', justifyContent: 'center',
        marginBottom: SPACING.sm,
      }}>
        <Ionicons name={icon as any} size={20} color={accentColor} />
      </View>
      <Text style={{ fontSize: FONT_SIZES['2xl'], fontWeight: FONTS.bold, color: colors.textPrimary }}>
        {value}
      </Text>
      <Text style={{ fontSize: FONT_SIZES.sm, color: colors.textSecondary, marginTop: 2, fontWeight: FONTS.medium }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: FONT_SIZES.xs, color: accentColor, marginTop: 2, fontWeight: FONTS.semiBold }}>
          {subtitle}
        </Text>
      )}
    </Card>
  );
};

// ─── BOTTOM SHEET MODAL ───────────────────────────────────────
interface BottomModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  height?: string | number;
}

export const BottomModal: React.FC<BottomModalProps> = ({ visible, onClose, title, children, height = '70%' }) => {
  const { colors } = useApp();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose} />
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        maxHeight: '90%',
      }}>
        {/* Handle */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
        </View>

        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: SPACING.base, paddingVertical: SPACING.md,
          borderBottomWidth: 1, borderBottomColor: colors.border,
        }}>
          <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: FONTS.bold, color: colors.textPrimary }}>
            {title}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Ionicons name="close-circle" size={26} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" style={{ padding: SPACING.base }}>
          {children}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

// ─── HEADER ──────────────────────────────────────────────────
interface HeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: { icon: string; onPress: () => void; label?: string };
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, rightAction, showBack, onBack }) => {
  const { colors } = useApp();

  return (
    <View style={{
      backgroundColor: colors.primary,
      paddingTop: SPACING.xl,
      paddingBottom: SPACING.base,
      paddingHorizontal: SPACING.base,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 }}>
        {showBack && (
          <TouchableOpacity onPress={onBack} style={{ marginRight: 4 }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FONT_SIZES.xl, fontWeight: FONTS.bold, color: '#fff' }}>{title}</Text>
          {subtitle && <Text style={{ fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.8)' }}>{subtitle}</Text>}
        </View>
      </View>
      {rightAction && (
        <TouchableOpacity onPress={rightAction.onPress} style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: BORDER_RADIUS.md,
          padding: SPACING.sm,
          flexDirection: 'row', alignItems: 'center', gap: 4,
        }}>
          <Ionicons name={rightAction.icon as any} size={18} color="#fff" />
          {rightAction.label && (
            <Text style={{ color: '#fff', fontSize: FONT_SIZES.sm, fontWeight: FONTS.semiBold }}>
              {rightAction.label}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── SEARCH BAR ───────────────────────────────────────────────
interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, placeholder }) => {
  const { colors } = useApp();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: BORDER_RADIUS.lg,
      paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
      borderWidth: 1, borderColor: colors.border, gap: 8,
      marginHorizontal: SPACING.base, marginBottom: SPACING.md,
      ...SHADOWS.sm,
    }}>
      <Ionicons name="search" size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'Search...'}
        placeholderTextColor={colors.textMuted}
        style={{ flex: 1, fontSize: FONT_SIZES.base, color: colors.textPrimary }}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── EMPTY STATE ─────────────────────────────────────────────
interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle, action }) => {
  const { colors } = useApp();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING['3xl'] }}>
      <View style={{
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: COLORS.primaryPale, alignItems: 'center', justifyContent: 'center',
        marginBottom: SPACING.base,
      }}>
        <Ionicons name={icon as any} size={40} color={COLORS.primary} />
      </View>
      <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: FONTS.bold, color: colors.textPrimary, textAlign: 'center' }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: FONT_SIZES.md, color: colors.textMuted, textAlign: 'center', marginTop: 6 }}>
          {subtitle}
        </Text>
      )}
      {action && (
        <View style={{ marginTop: SPACING.lg }}>
          <Button title={action.label} onPress={action.onPress} size="md" />
        </View>
      )}
    </View>
  );
};

// ─── BADGE ────────────────────────────────────────────────────
interface BadgeProps {
  label: string;
  color?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ label, color, size = 'sm' }) => {
  const bg = color ? `${color}18` : COLORS.primaryPale;
  const textColor = color || COLORS.primary;
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BORDER_RADIUS.full }}>
      <Text style={{ color: textColor, fontSize: size === 'sm' ? FONT_SIZES.xs : FONT_SIZES.sm, fontWeight: FONTS.semiBold }}>
        {label}
      </Text>
    </View>
  );
};

// ─── DIVIDER ──────────────────────────────────────────────────
export const Divider: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { colors } = useApp();
  return <View style={[{ height: 1, backgroundColor: colors.border, marginVertical: SPACING.sm }, style]} />;
};

// ─── LOADING SPINNER ─────────────────────────────────────────
export const LoadingSpinner: React.FC<{ message?: string }> = ({ message }) => {
  const { colors } = useApp();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      {message && <Text style={{ color: colors.textMuted, fontSize: FONT_SIZES.md }}>{message}</Text>}
    </View>
  );
};
