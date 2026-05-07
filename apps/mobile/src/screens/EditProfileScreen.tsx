import React, { useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Apple, Bird, Bug, Cat, Cherry, Coffee, Dog,
  Fish, Flower, Leaf, PawPrint, Pizza, Rabbit,
  Rainbow, Rat, Shrimp, Snail, Squirrel, Turtle, Worm,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { TOKENS } from '../theme/tokens';

// ─── Avatar definitions ────────────────────────────────────────────────────────

interface AvatarDef {
  id: string;
  Icon: LucideIcon;
  bg: string;
  fg: string;
}

const AVATARS: AvatarDef[] = [
  // Red
  { id: 'cherry',   Icon: Cherry,   bg: '#FF5C4D', fg: '#ffffff' },
  { id: 'apple',    Icon: Apple,    bg: '#FF5C4D', fg: '#ffffff' },
  { id: 'cat',      Icon: Cat,      bg: '#FF5C4D', fg: '#ffffff' },
  { id: 'dog',      Icon: Dog,      bg: '#FF5C4D', fg: '#ffffff' },
  { id: 'rabbit',   Icon: Rabbit,   bg: '#FF5C4D', fg: '#ffffff' },
  // Black
  { id: 'fish',     Icon: Fish,     bg: '#111111', fg: '#ffffff' },
  { id: 'squirrel', Icon: Squirrel, bg: '#111111', fg: '#ffffff' },
  { id: 'snail',    Icon: Snail,    bg: '#111111', fg: '#ffffff' },
  { id: 'rat',      Icon: Rat,      bg: '#111111', fg: '#ffffff' },
  { id: 'bug',      Icon: Bug,      bg: '#111111', fg: '#ffffff' },
  // Beige
  { id: 'bird',     Icon: Bird,     bg: '#E8E0D5', fg: '#111111' },
  { id: 'turtle',   Icon: Turtle,   bg: '#E8E0D5', fg: '#111111' },
  { id: 'flower',   Icon: Flower,   bg: '#E8E0D5', fg: '#FF5C4D' },
  { id: 'leaf',     Icon: Leaf,     bg: '#E8E0D5', fg: '#111111' },
  { id: 'pawprint', Icon: PawPrint, bg: '#E8E0D5', fg: '#111111' },
  { id: 'shrimp',   Icon: Shrimp,   bg: '#E8E0D5', fg: '#FF5C4D' },
  { id: 'worm',     Icon: Worm,     bg: '#E8E0D5', fg: '#FF5C4D' },
  { id: 'pizza',    Icon: Pizza,    bg: '#E8E0D5', fg: '#111111' },
  { id: 'coffee',   Icon: Coffee,   bg: '#E8E0D5', fg: '#111111' },
  { id: 'rainbow',  Icon: Rainbow,  bg: '#E8E0D5', fg: '#FF5C4D' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Screen ────────────────────────────────────────────────────────────────────

interface Props {
  navigation?: any;
}

export function EditProfileScreen({ navigation }: Props) {
  const { user, updateUser } = useApp();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [avatarId, setAvatarId] = useState(user?.avatarId ?? '');
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const [saved, setSaved] = useState(false);

  const emailChanged = email.trim() !== (user?.email ?? '');
  const emailVerified = !emailChanged && !!user?.email;

  function validate() {
    let ok = true;
    if (!name.trim()) {
      setNameError('Name is required.');
      ok = false;
    } else {
      setNameError('');
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      ok = false;
    } else {
      setEmailError('');
    }
    return ok;
  }

  function handleSave() {
    if (!validate()) return;
    updateUser(name, email, avatarId || undefined);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      navigation?.goBack();
    }, 800);
  }

  const selectedAvatar = AVATARS.find((a) => a.id === avatarId);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation?.goBack()} style={styles.backBtn} hitSlop={10}>
          <Text style={styles.backText}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Current avatar preview */}
        <View style={styles.previewRow}>
          <View style={[styles.previewCircle, selectedAvatar ? { backgroundColor: selectedAvatar.bg } : null]}>
            {selectedAvatar ? (
              <selectedAvatar.Icon size={32} color={selectedAvatar.fg} strokeWidth={1.8} />
            ) : (
              <Text style={styles.previewInitials}>{name.trim().slice(0, 2).toUpperCase() || 'U'}</Text>
            )}
          </View>
          <Text style={styles.previewHint}>Pick an avatar below</Text>
        </View>

        {/* Avatar grid */}
        <View style={styles.gridCard}>
          <View style={styles.grid}>
            {AVATARS.map((av) => {
              const selected = avatarId === av.id;
              return (
                <Pressable
                  key={av.id}
                  onPress={() => setAvatarId(selected ? '' : av.id)}
                  style={[styles.avatarCell, selected && styles.avatarCellSelected]}
                >
                  <View style={[styles.avatarCircle, { backgroundColor: av.bg }]}>
                    <av.Icon size={20} color={av.fg} strokeWidth={1.8} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Name field */}
        <Text style={styles.fieldLabel}>Name</Text>
        <View style={[styles.inputCard, !!nameError && styles.inputCardError]}>
          <TextInput
            value={name}
            onChangeText={(t) => { setName(t); setNameError(''); }}
            placeholder="Your name"
            placeholderTextColor={TOKENS.colors.text.muted}
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>
        {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}

        {/* Email field */}
        <Text style={styles.fieldLabel}>Email</Text>
        <View style={[styles.inputCard, !!emailError && styles.inputCardError]}>
          <TextInput
            value={email}
            onChangeText={(t) => { setEmail(t); setEmailError(''); }}
            placeholder="you@example.com"
            placeholderTextColor={TOKENS.colors.text.muted}
            style={[styles.input, { flex: 1 }]}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
          />
          {emailVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
        {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
        {emailChanged && !emailError && (
          <Text style={styles.hintText}>You will need to verify your new email after saving.</Text>
        )}

        {/* Save button */}
        <Pressable
          onPress={handleSave}
          style={[styles.saveBtn, saved && styles.saveBtnDone]}
        >
          <Text style={styles.saveBtnText}>{saved ? 'Saved!' : 'Save Changes'}</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.colors.bg.screen },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: TOKENS.spacing.screenPad,
    paddingVertical: 12,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 16, color: TOKENS.colors.accent.heading, fontWeight: '500' },
  title: { fontSize: 17, fontWeight: '700', color: TOKENS.colors.text.primary },

  content: {
    paddingHorizontal: TOKENS.spacing.screenPad,
    paddingBottom: 40,
    gap: 10,
  },

  // Preview
  previewRow: { alignItems: 'center', paddingVertical: 8, gap: 10 },
  previewCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: TOKENS.colors.action.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInitials: { fontSize: 24, fontWeight: '700', color: '#ffffff' },
  previewHint: { fontSize: 13, color: TOKENS.colors.text.secondary },

  // Avatar grid
  gridCard: {
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.card,
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  avatarCell: {
    width: '18%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: TOKENS.radius.row,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarCellSelected: {
    borderColor: TOKENS.colors.action.primary,
    backgroundColor: '#f0f0f0',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Fields
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TOKENS.colors.text.secondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  inputCard: {
    backgroundColor: TOKENS.colors.bg.card,
    borderRadius: TOKENS.radius.row,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputCardError: { borderColor: TOKENS.colors.action.danger },
  input: {
    fontSize: 16,
    color: TOKENS.colors.text.primary,
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: '#e6f9ee',
    borderRadius: TOKENS.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verifiedText: { fontSize: 12, fontWeight: '600', color: '#22a722' },
  errorText: { fontSize: 13, color: TOKENS.colors.action.danger, marginTop: -4 },
  hintText: { fontSize: 13, color: TOKENS.colors.text.secondary, marginTop: -4 },

  // Save
  saveBtn: {
    marginTop: 8,
    backgroundColor: TOKENS.colors.action.primary,
    borderRadius: TOKENS.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDone: { backgroundColor: TOKENS.colors.action.success },
  saveBtnText: { fontSize: 17, fontWeight: '600', color: '#ffffff' },
});
