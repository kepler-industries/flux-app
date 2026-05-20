import * as React from 'react';
import { View, Alert } from 'react-native';
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

export default function NewAccount() {
  const createAccount = useFluxStore((s) => s.createAccount);
  const [name, setName] = React.useState('');
  const [kind, setKind] = React.useState<(typeof KIND_OPTIONS)[number]['key']>('CHECKING');
  const [balance, setBalance] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Nom requis');
      return;
    }
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
    setSubmitting(false);
    router.back();
  };

  return (
    <ScrollScreen contentClassName="pt-6">
      <Text variant="heading" className="mb-4">Nouveau compte</Text>
      <Card>
        <Label>Nom</Label>
        <Input value={name} onChangeText={setName} placeholder="Livret A, Vacances 2026…" />
        <Label className="mt-4">Type</Label>
        <View className="flex-row flex-wrap gap-2">
          {KIND_OPTIONS.map((opt) => (
            <Button
              key={opt.key}
              variant={kind === opt.key ? 'default' : 'outline'}
              size="sm"
              onPress={() => setKind(opt.key)}
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
        <Input value={balance} onChangeText={setBalance} keyboardType="decimal-pad" placeholder="0,00" />
      </Card>
      <View className="flex-row gap-3 mt-6">
        <Button variant="outline" fullWidth className="flex-1" onPress={() => router.back()}>
          <Text>Annuler</Text>
        </Button>
        <Button fullWidth className="flex-1" disabled={submitting} onPress={onSubmit}>
          <Text className="text-primary-foreground font-semibold">
            {submitting ? '…' : 'Créer'}
          </Text>
        </Button>
      </View>
    </ScrollScreen>
  );
}
