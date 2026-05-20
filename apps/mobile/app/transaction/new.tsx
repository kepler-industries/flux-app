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
import type { TransactionDirectionT } from '@flux/shared';

export default function NewTransaction() {
  const accounts = useFluxStore((s) => s.accounts);
  const categories = useFluxStore((s) => s.categories);
  const createTransaction = useFluxStore((s) => s.createTransaction);

  const [direction, setDirection] = React.useState<TransactionDirectionT>('EXPENSE');
  const [amount, setAmount] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [accountId, setAccountId] = React.useState<string | undefined>(accounts[0]?.id);
  const [accountToId, setAccountToId] = React.useState<string | undefined>(undefined);
  const [categoryId, setCategoryId] = React.useState<string | undefined>(undefined);
  const [date] = React.useState<Date>(new Date());
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async () => {
    const cents = toCents(Number(amount.replace(',', '.')) || 0);
    if (cents <= 0) {
      Alert.alert('Montant invalide', 'Saisis un montant supérieur à 0.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Description manquante', 'Saisis une description.');
      return;
    }
    if (!accountId) {
      Alert.alert('Compte manquant', 'Choisis un compte source.');
      return;
    }
    if (direction === 'TRANSFER' && !accountToId) {
      Alert.alert('Compte cible', 'Choisis le compte de destination.');
      return;
    }
    setSubmitting(true);
    await createTransaction({
      direction,
      amountCents: cents,
      currency: accounts.find((a) => a.id === accountId)?.currency ?? 'EUR',
      description: description.trim(),
      note: null,
      date: date.toISOString(),
      categoryId: direction === 'TRANSFER' ? null : (categoryId ?? null),
      accountFromId: direction === 'INCOME' ? null : accountId,
      accountToId: direction === 'EXPENSE' ? null : (direction === 'TRANSFER' ? accountToId! : accountId),
      recurringItemId: null,
    });
    setSubmitting(false);
    router.back();
  };

  return (
    <ScrollScreen contentClassName="pt-6">
      <Text variant="heading" className="mb-4">Nouvelle transaction</Text>

      <Card>
        <Label>Type</Label>
        <View className="flex-row gap-2">
          {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map((d) => (
            <Button
              key={d}
              variant={direction === d ? 'default' : 'outline'}
              size="sm"
              onPress={() => setDirection(d)}
              accessibilityLabel={d}
            >
              <Text
                className={
                  direction === d ? 'text-primary-foreground font-semibold' : 'text-foreground'
                }
              >
                {d === 'EXPENSE' ? 'Dépense' : d === 'INCOME' ? 'Entrée' : 'Transfert'}
              </Text>
            </Button>
          ))}
        </View>

        <Label className="mt-4">Montant (€)</Label>
        <Input
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0,00"
          accessibilityLabel="Montant"
        />

        <Label className="mt-4">Description</Label>
        <Input
          value={description}
          onChangeText={setDescription}
          placeholder="Courses, abonnement, salaire…"
          accessibilityLabel="Description"
        />

        <Label className="mt-4">
          {direction === 'TRANSFER' ? 'Compte source' : direction === 'INCOME' ? 'Compte cible' : 'Compte source'}
        </Label>
        <View className="flex-row flex-wrap gap-2">
          {accounts.map((a) => (
            <Button
              key={a.id}
              variant={accountId === a.id ? 'default' : 'outline'}
              size="sm"
              onPress={() => setAccountId(a.id)}
              accessibilityLabel={a.name}
            >
              <Text
                className={
                  accountId === a.id ? 'text-primary-foreground font-semibold' : 'text-foreground'
                }
              >
                {a.name}
              </Text>
            </Button>
          ))}
        </View>

        {direction === 'TRANSFER' && (
          <>
            <Label className="mt-4">Compte cible</Label>
            <View className="flex-row flex-wrap gap-2">
              {accounts.filter((a) => a.id !== accountId).map((a) => (
                <Button
                  key={a.id}
                  variant={accountToId === a.id ? 'default' : 'outline'}
                  size="sm"
                  onPress={() => setAccountToId(a.id)}
                  accessibilityLabel={a.name}
                >
                  <Text
                    className={
                      accountToId === a.id ? 'text-primary-foreground font-semibold' : 'text-foreground'
                    }
                  >
                    {a.name}
                  </Text>
                </Button>
              ))}
            </View>
          </>
        )}

        {direction !== 'TRANSFER' && (
          <>
            <Label className="mt-4">Catégorie</Label>
            <View className="flex-row flex-wrap gap-2">
              {categories.map((c) => (
                <Button
                  key={c.id}
                  variant={categoryId === c.id ? 'default' : 'outline'}
                  size="sm"
                  onPress={() => setCategoryId(c.id === categoryId ? undefined : c.id)}
                  accessibilityLabel={c.name}
                >
                  <Text
                    className={
                      categoryId === c.id ? 'text-primary-foreground font-semibold' : 'text-foreground'
                    }
                  >
                    {c.name}
                  </Text>
                </Button>
              ))}
            </View>
          </>
        )}
      </Card>

      <View className="flex-row gap-3 mt-6">
        <Button variant="outline" fullWidth className="flex-1" onPress={() => router.back()}>
          <Text>Annuler</Text>
        </Button>
        <Button fullWidth className="flex-1" disabled={submitting} onPress={onSubmit}>
          <Text className="text-primary-foreground font-semibold">
            {submitting ? '…' : 'Enregistrer'}
          </Text>
        </Button>
      </View>
    </ScrollScreen>
  );
}
