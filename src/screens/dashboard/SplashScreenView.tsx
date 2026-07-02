// ============================================================
// GURBANI TRADERS - Splash Screen
// Branded loading screen with owner contact footer
// ============================================================

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, FONTS, SPACING, APP_INFO } from '../../utils/theme';

export default function SplashScreenView() {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const footerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
      Animated.timing(footerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Animated.View style={[styles.logoCircle, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
          <Ionicons name="storefront" size={56} color={COLORS.primary} />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <Text style={styles.appName}>{APP_INFO.name}</Text>
          <Text style={styles.tagline}>{APP_INFO.tagline}</Text>
        </Animated.View>
      </View>

      {/* Footer with contact info */}
      <Animated.View style={[styles.footer, { opacity: footerFade }]}>
        <View style={styles.footerDivider} />
        <Text style={styles.footerLabel}>CONTACT US</Text>
        <View style={styles.contactRow}>
          <Ionicons name="call" size={14} color="rgba(255,255,255,0.85)" />
          <Text style={styles.contactText}>{APP_INFO.owner1.name}: {APP_INFO.owner1.phone}</Text>
        </View>
        <View style={styles.contactRow}>
          <Ionicons name="call" size={14} color="rgba(255,255,255,0.85)" />
          <Text style={styles.contactText}>{APP_INFO.owner2.name}: {APP_INFO.owner2.phone}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'space-between',
    paddingVertical: 80,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONTS.extraBold,
    color: '#fff',
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: FONT_SIZES.md,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  footerDivider: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: SPACING.md,
    borderRadius: 1,
  },
  footerLabel: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  contactText: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: FONTS.medium,
  },
});
