import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

type Mode = 'signin' | 'signup';

export function LoginScreen() {
  const { login, signUp } = useApp();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signUpDone, setSignUpDone] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password) return;
    setError(null);
    setLoading(true);
    const err = mode === 'signin'
      ? await login(email, password)
      : await signUp(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else if (mode === 'signup') {
      setSignUpDone(true);
    }
    // on signin success, AppContext's onAuthStateChange fires and sets user automatically
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSignUpDone(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>

          {/* Logo */}
          <View style={styles.logoWrap}>
            <View style={styles.logoBox}>
              <Text style={styles.logoIcon}>◎</Text>
            </View>
            <Text style={styles.appName}>Wheel Todo</Text>
            <Text style={styles.tagline}>Spin. Focus. Done.</Text>
          </View>

          {signUpDone ? (
            <View style={styles.verifyBox}>
              <Text style={styles.verifyTitle}>Check your email</Text>
              <Text style={styles.verifyBody}>
                We sent a confirmation link to {email}. Open it to activate your account, then sign in.
              </Text>
              <Pressable onPress={() => switchMode('signin')} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Back to sign in</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Form */}
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
                  onSubmitEditing={handleSubmit}
                  style={styles.input}
                />

                {error && <Text style={styles.errorText}>{error}</Text>}

                <Pressable
                  onPress={handleSubmit}
                  disabled={loading}
                  style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                >
                  {loading
                    ? <ActivityIndicator color="#ffffff" />
                    : <Text style={styles.primaryBtnText}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Text>
                  }
                </Pressable>
              </View>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social — coming soon */}
              <View style={styles.socialRow}>
                <Pressable style={styles.socialBtn} disabled>
                  <Text style={styles.socialBtnText}>Continue with Apple</Text>
                  <Text style={styles.comingSoon}>Coming soon</Text>
                </Pressable>
                <Pressable style={styles.socialBtn} disabled>
                  <Text style={styles.socialBtnText}>Continue with Google</Text>
                  <Text style={styles.comingSoon}>Coming soon</Text>
                </Pressable>
              </View>

              {/* Switch mode */}
              <Pressable onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} style={styles.switchLink}>
                <Text style={styles.switchText}>
                  {mode === 'signin' ? "No account? " : "Already have an account? "}
                  <Text style={styles.switchAction}>
                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                  </Text>
                </Text>
              </Pressable>
            </>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f2f0eb' },
  inner: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    gap: 24,
  },
  logoWrap: { alignItems: 'center', gap: 8 },
  logoBox: {
    width: 80, height: 80,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1, borderColor: '#E8E5E0',
    alignItems: 'center', justifyContent: 'center',
  },
  logoIcon: { fontSize: 40, color: '#111111' },
  appName: { fontSize: 26, fontWeight: '700', color: '#111111' },
  tagline: { fontSize: 15, color: '#8E8E93' },
  form: { gap: 10 },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#E8E5E0',
    borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 17, color: '#111111',
  },
  errorText: { fontSize: 13, color: '#D32F2F', textAlign: 'center' },
  primaryBtn: {
    backgroundColor: '#111111',
    borderRadius: 100, height: 52,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#ffffff', fontSize: 17, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E8E5E0' },
  dividerText: { fontSize: 13, color: '#8E8E93' },
  socialRow: { gap: 10 },
  socialBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#E8E5E0',
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', opacity: 0.5,
  },
  socialBtnText: { fontSize: 17, color: '#111111', fontWeight: '500' },
  comingSoon: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  switchLink: { alignItems: 'center' },
  switchText: { fontSize: 15, color: '#8E8E93' },
  switchAction: { color: '#111111', fontWeight: '600' },
  verifyBox: { gap: 12, alignItems: 'center' },
  verifyTitle: { fontSize: 20, fontWeight: '700', color: '#111111' },
  verifyBody: { fontSize: 15, color: '#8E8E93', textAlign: 'center', lineHeight: 22 },
});
