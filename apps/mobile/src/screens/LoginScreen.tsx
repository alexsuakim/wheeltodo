import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';

interface Props {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: Props) {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSignIn() {
    if (!email.trim()) return;
    login(email.trim(), password);
    onLogin();
  }

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.logoWrap}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>◎</Text>
          </View>
          <Text style={styles.appName}>Wheel Todo</Text>
          <Text style={styles.tagline}>Spin. Focus. Done.</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#8E8E93"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#8E8E93"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
            style={styles.input}
          />
          <Pressable onPress={handleSignIn} style={styles.signInBtn}>
            <Text style={styles.signInBtnText}>Sign in</Text>
          </Pressable>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          <Pressable
            style={styles.socialBtn}
            onPress={() => { login('user@apple.com', ''); onLogin(); }}
          >
            <Text style={styles.socialBtnText}>Continue with Apple</Text>
          </Pressable>
          <Pressable
            style={styles.socialBtn}
            onPress={() => { login('user@google.com', ''); onLogin(); }}
          >
            <Text style={styles.socialBtnText}>Continue with Google</Text>
          </Pressable>
        </View>

        <Pressable style={styles.signUpLink}>
          <Text style={styles.signUpText}>No account? Sign up</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF9F7' },
  inner: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    gap: 24,
  },
  logoWrap: { alignItems: 'center', gap: 8 },
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E5E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: { fontSize: 40, color: '#007AFF' },
  appName: { fontSize: 26, fontWeight: '700', color: '#1C1C1E' },
  tagline: { fontSize: 15, color: '#8E8E93' },
  form: { gap: 10 },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E8E5E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: '#1C1C1E',
  },
  signInBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  signInBtnText: { color: '#ffffff', fontSize: 17, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E8E5E0' },
  dividerText: { fontSize: 13, color: '#8E8E93' },
  socialRow: { gap: 10 },
  socialBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E8E5E0',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  socialBtnText: { fontSize: 17, color: '#1C1C1E', fontWeight: '500' },
  signUpLink: { alignItems: 'center' },
  signUpText: { fontSize: 15, color: '#007AFF' },
});
