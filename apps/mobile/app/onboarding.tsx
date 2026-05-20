import * as React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ScrollScreen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useFluxStore } from '@/lib/store';
import { toCents } from '@flux/shared';

const KIND_OPTIONS = [
  { key: 'CHECKING', label: 'Compte courant', color: '#5B8DEF' },
  { key: 'SAVINGS', label: 'Épargne', color: '#34D399' },
  { key: 'CASH', label: 'Liquide', color: '#FBBF24' },
  { key: 'POT', label: 'Cagnotte', color: '#F472B6' },
  { key: 'OTHER', label: 'Autre', color: '#94A3B8' },
] as const;

export default function Onboarding() {
  const [name, setName] = React.useState('Compte courant');
  const [kind, setKind] = React.useState<(typeof KIND_OPTIONS)[number]['key']>('CHECKING');
  const [balance, setBalance] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const createAccount = useFluxStore((s) => s.createAccount);
  const createCategory = useFluxStore((s) => s.createCategory);
  const completeOnboarding = useFluxStore((s) => s.completeOnboarding);

  const onContinue = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    const color = KIND_OPTIONS.find((k) => k.key === kind)?.color ?? '#5B8DEF';
    await createAccount({
      name: name.trim(),
      kind,
      color,
      icon: 'wallet',
      initialBalanceCents: toCents(Number(balance.replace(',', '.')) || 0),
      currency: 'EUR',
    });
    // Seed a small set of default categories so the user has something to pick.
    const defaults = [
      { name: 'Alimentation', color: '#F87171', icon: 'utensils' },
      { name: 'Transport', color: '#60A5FA', icon: 'car' },
      { name: 'Logement', color: '#FBBF24', icon: 'home' },
      { name: 'Loisirs', color: '#A78BFA', icon: 'gamepad' },
      { name: 'Santé', color: '#34D399', icon: 'heart' },
      { name: 'Abonnements', color: '#F472B6', icon: 'repeat' },
    ];
    for (const c of defaults) {
      await createCategory({ name: c.name, color: c.color, icon: c.icon });
    }
    await completeOnboarding();
    setSubmitting(false);
    router.replace('/(tabs)');
  };

  return (
    <ScrollScreen contentClassName="pt-12">
      <View className="mb-6">
        <Text variant="heading" className="text-foreground">
          Bienvenue dans Flux
        </Text>
        <Text variant="muted" className="mt-2 leading-snug">
          Configurez votre premier compte Flux — un clone virtuel d&apos;un compte réel ou
          d&apos;une cagnotte. Vous pourrez en ajouter d&apos;autres ensuite.
        </Text>
      </View>

      <Card>
        <Label>Nom du compte</Label>
        <Input
          value={name}
          onChangeText={setName}
          placeholder="Ex. Compte courant, Livret A…"
          autoCapitalize="sentences"
          accessibilityLabel="Nom du compte"
        />

        <Label className="mt-4">Type</Label>
        <View className="flex-row flex-wrap gap-2">
          {KIND_OPTIONS.map((opt) => (
            <Button
              key={opt.key}
              variant={kind === opt.key ? 'default' : 'outline'}
              size="sm"
              onPress={() => setKind(opt.key)}
              accessibilityLabel={`Choisir ${opt.label}`}
            >
              <Text
                className={
                  kind === opt.key ? 'text-primary-foreground font-semibold' : 'text-foreground'
                }
              >
                {opt.label}
              </Text>
            </Button>
          ))}
        </View>

        <Label className="mt-4">Solde initial (€)</Label>
        <Input
          value={balance}
          onChangeText={setBalance}
          keyboardType="decimal-pad"
          placeholder="0,00"
          accessibilityLabel="Solde initial"
        />
      </Card>

      <Button
        fullWidth
        className="mt-6"
        size="lg"
        disabled={submitting || !name.trim()}
        onPress={onContinue}
        accessibilityLabel="Continuer"
      >
        <Text className="text-primary-foreground font-semibold text-base">
          {submitting ? 'Création…' : 'Continuer'}
        </Text>
      </Button>

      <Text variant="muted" className="mt-6 text-center">
        Vos données restent stockées sur votre appareil. Vous pourrez activer une sauvegarde
        cloud plus tard depuis les réglages.
      </Text>
    </ScrollScreen>
  );
}
