import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { Ember, EmberGradient } from '@/constants/theme';

type Phase = { label: string; ms: number; target: number; haptic: 'in' | 'hold' | 'out' };

// Two guided patterns. `target` is the circle's scale for that phase (0.5 small
// → 1 full); phases play in order and loop, counting one breath per full cycle.
const PATTERNS = {
  '478': {
    name: '4-7-8',
    hint: 'In for four, hold for seven, out for eight.',
    phases: [
      { label: 'Breathe in', ms: 4000, target: 1, haptic: 'in' },
      { label: 'Hold', ms: 7000, target: 1, haptic: 'hold' },
      { label: 'Breathe out', ms: 8000, target: 0.5, haptic: 'out' },
    ] as Phase[],
  },
  box: {
    name: 'Box',
    hint: 'In, hold, out, hold — four seconds each.',
    phases: [
      { label: 'Breathe in', ms: 4000, target: 1, haptic: 'in' },
      { label: 'Hold', ms: 4000, target: 1, haptic: 'hold' },
      { label: 'Breathe out', ms: 4000, target: 0.5, haptic: 'out' },
      { label: 'Hold', ms: 4000, target: 0.5, haptic: 'hold' },
    ] as Phase[],
  },
} as const;

type PatternKey = keyof typeof PATTERNS;

function cue(kind: Phase['haptic']) {
  if (kind === 'hold') Haptics.selectionAsync();
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export default function BreatheScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [patternKey, setPatternKey] = useState<PatternKey>('478');
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [breaths, setBreaths] = useState(0);

  const pattern = PATTERNS[patternKey];
  const phases = pattern.phases;
  const phase = phases[phaseIdx];
  const scale = useSharedValue(0.5);

  // Drive one phase at a time so the loop can pause, resume, and switch patterns.
  useEffect(() => {
    if (!running) return;
    cue(phase.haptic);
    scale.value = withTiming(phase.target, { duration: phase.ms, easing: Easing.inOut(Easing.ease) });
    const t = setTimeout(() => {
      const next = (phaseIdx + 1) % phases.length;
      if (next === 0) setBreaths((b) => b + 1);
      setPhaseIdx(next);
    }, phase.ms);
    return () => clearTimeout(t);
  }, [running, phaseIdx, patternKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const toggleRun = () => {
    Haptics.selectionAsync();
    setRunning((r) => !r);
  };

  const choosePattern = (key: PatternKey) => {
    if (key === patternKey) return;
    Haptics.selectionAsync();
    setPatternKey(key);
    setPhaseIdx(0);
    setBreaths(0);
    scale.value = withTiming(0.5, { duration: 400 });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topRow}>
        <View style={styles.patternToggle}>
          {(Object.keys(PATTERNS) as PatternKey[]).map((key) => (
            <TouchableOpacity
              key={key}
              activeOpacity={0.85}
              onPress={() => choosePattern(key)}
              style={[styles.patternChip, patternKey === key && styles.patternChipActive]}
            >
              <Text style={[styles.patternText, patternKey === key && styles.patternTextActive]}>
                {PATTERNS[key].name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={Ember.textMuted} />
        </TouchableOpacity>
      </View>

      <Pressable style={styles.center} onPress={toggleRun}>
        <View style={styles.circleWrap}>
          <Animated.View style={[styles.circle, circleStyle]}>
            <LinearGradient colors={EmberGradient} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.circleFill} />
          </Animated.View>
          <Text serif style={styles.phase}>
            {running ? phase.label : 'Tap to begin'}
          </Text>
        </View>
      </Pressable>

      <View style={styles.footer}>
        <View style={styles.pips}>
          {phases.map((p, i) => (
            <View key={i} style={[styles.pip, running && i === phaseIdx && styles.pipActive]} />
          ))}
        </View>
        <Text style={styles.count}>
          {breaths === 0 ? pattern.hint : `${breaths} ${breaths === 1 ? 'breath' : 'breaths'} · tap to ${running ? 'pause' : 'resume'}`}
        </Text>
      </View>
    </View>
  );
}

const CIRCLE = 240;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Ember.bgDeep, paddingHorizontal: 24 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  patternToggle: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: Ember.surface,
    borderWidth: 1,
    borderColor: Ember.border,
    borderRadius: 14,
    padding: 4,
  },
  patternChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  patternChipActive: { backgroundColor: Ember.surfaceSelected },
  patternText: { color: Ember.textMuted, fontSize: 13, fontWeight: '600' },
  patternTextActive: { color: Ember.textPrimary, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  circleWrap: { width: CIRCLE, height: CIRCLE, alignItems: 'center', justifyContent: 'center' },
  circle: {
    position: 'absolute',
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    shadowColor: '#e85a2a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 12,
  },
  circleFill: { flex: 1, borderRadius: CIRCLE / 2, opacity: 0.9 },
  phase: { color: Ember.onGradient, fontSize: 22, fontWeight: '600' },
  footer: { alignItems: 'center', gap: 14, marginBottom: 44 },
  pips: { flexDirection: 'row', gap: 8 },
  pip: { width: 8, height: 8, borderRadius: 4, backgroundColor: Ember.surface3 },
  pipActive: { backgroundColor: Ember.ember, transform: [{ scale: 1.3 }] },
  count: { color: Ember.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
