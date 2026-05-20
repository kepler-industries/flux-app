import * as React from 'react';
import { View, Alert } from 'react-native';
import { router } from 'expo-router';
import { ScrollScreen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { syncBoth } from '@/lib/sync';

export default function SignIn() {
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async () => {
    if (!email.trim() || password.length < 8) {
      Alert.alert('Champs invalides', 'Email valide + mot de passe ≥ 8 caractères.');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await authClient.signIn.email({ email: email.trim(), password });
      } else {
        await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.trim().split('@')[0]!,
        });
      }
      await syncBoth();
      router.back();
    } catch (e) {
      Alert.alert('Erreur', String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: 'flux://auth-callback',
      });
      await syncBoth();
      router.back();
    } catch (e) {
      Alert.alert('Google', String(e));
    }
  };

  const onApple = async () => {
    try {
      await authClient.signIn.social({
        provider: 'apple',
        callbackURL: 'flux://auth-callback',
      });
      await syncBoth();
      router.back();
    } catch (e) {
      Alert.alert('Apple', String(e));
    }
  };

  return (
    <ScrollScreen contentClassName="pt-8">
      <Text variant="heading" className="mb-1">
        {mode === 'signin' ? 'Connexion' : 'Créer un compte'}
      </Text>
      <Text variant="muted" className="mb-5 leading-snug">
        Optionnel — sert uniquement à sauvegarder vos données dans le cloud Flux.
      </Text>

      <Card>
        {mode === 'signup' && (
          <>
            <Label>Nom</Label>
            <Input value={name} onChangeText={setName} placeholder="Votre nom" autoCapitalize="words" />
          </>
        )}
        <Label className={mode === 'signup' ? 'mt-4' : ''}>Email</Label>
        <Input
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="vous@exemple.com"
          autoComplete="email"
        />
        <Label className="mt-4">Mot de passe</Label>
        <Input
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="8 caractères minimum"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
        />
        <Button fullWidth className="mt-4" disabled={submitting} onPress={onSubmit}>
          <Text className="text-primary-foreground font-semibold">
            {submitting ? '…' : mode === 'signin' ? 'Se connecter' : 'Créer le compte'}
          </Text>
        </Button>
        <Button
          variant="ghost"
          fullWidth
          className="mt-2"
          onPress={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
        >
          <Text className="text-primary">
            {mode === 'signin' ? 'Pas de compte ? Créer' : 'Déjà inscrit ? Se connecter'}
          </Text>
        </Button>
      </Card>

      <View className="flex-row items-center my-5">
        <View className="flex-1 h-px bg-border" />
        <Text variant="muted" className="mx-3">ou</Text>
        <View className="flex-1 h-px bg-border" />
      </View>

      <View className="gap-2">
        <Button fullWidth variant="outline" onPress={onGoogle} accessibilityLabel="Continuer avec Google">
          <Text>Continuer avec Google</Text>
        </Button>
        <Button fullWidth variant="outline" onPress={onApple} accessibilityLabel="Continuer avec Apple">
          <Text>Continuer avec Apple</Text>
        </Button>
      </View>

      <Button fullWidth variant="ghost" className="mt-4" onPress={() => router.back()}>
        <Text variant="muted">Plus tard</Text>
      </Button>
    </ScrollScreen>
  );
}
