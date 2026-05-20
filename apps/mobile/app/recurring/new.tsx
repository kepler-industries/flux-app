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
import type { RecurrenceUnitT, TransactionDirectionT } from '@flux/shared';

const UNITS: { key: RecurrenceUnitT; label: string }[] = [
  { key: 'DAY', label: 'jour(s)' },
  { key: 'WEEK', label: 'semaine(s)' },
  { key: 'MONTH', label: 'mois' },
  { key: 'YEAR', label: 'année(s)' },
];

export default function NewRecurring() {
  const accounts = useFluxStore((s) => s.accounts);
  const categories = useFluxStore((s) => s.categories);
  const createRecurring = useFluxStore((s) => s.createRecurring);

  const [direction, setDirection] = React.useState<TransactionDirectionT>('EXPENSE');
  const [name, setName] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [accountId, setAccountId] = React.useState<string | undefined>(accounts[0]?.id);
  const [categoryId, setCategoryId] = React.useState<string | undefined>(undefined);

  const [intervalCount, setIntervalCount] = React.useState('1');
  const [intervalUnit, setIntervalUnit] = React.useState<RecurrenceUnitT>('MONTH');
  const [monthDay, setMonthDay] = React.useState<string>('');
  const [endMode, setEndMode] = React.useState<'never' | 'date' | 'count'>('never');
  const [endDate, setEndDate] = React.useState<string>('');
  const [remainingCount, setRemainingCount] = React.useState<string>('');

  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async () => {
    const cents = toCents(Number(amount.replace(',', '.')) || 0);
    if (!name.trim() || cents <= 0 || !accountId) {
      Alert.alert('Champs requis', 'Nom, montant et compte sont obligatoires.');
      return;
    }
    setSubmitting(true);
    await createRecurring({
      name: name.trim(),
      direction,
      amountCents: cents,
      currency: accounts.find((a) => a.id === accountId)?.currency ?? 'EUR',
      categoryId: categoryId ?? null,
      accountId,
      note: null,
      intervalUnit,
      intervalCount: Math.max(1, parseInt(intervalCount, 10) || 1),
      monthDay: intervalUnit === 'MONTH' && monthDay ? Math.min(31, Math.max(1, parseInt(monthDay, 10))) : null,
      weekDay: null,
      startDate: new Date().toISOString(),
      endDate: endMode === 'date' && endDate ? new Date(endDate).toISOString() : null,
      remainingCount: endMode === 'count' && remainingCount ? Math.max(0, parseInt(remainingCount, 10)) : null,
      isPaused: false,
    });
    setSubmitting(false);
    router.back();
  };

  return (
    <ScrollScreen contentClassName="pt-6">
      <Text variant="heading" className="mb-4">Nouvelle récurrence</Text>

      <Card>
        <Label>Type</Label>
        <View className="flex-row gap-2">
          {(['EXPENSE', 'INCOME'] as const).map((d) => (
            <Button
              key={d}
              variant={direction === d ? 'default' : 'outline'}
              size="sm"
              onPress={() => setDirection(d)}
            >
              <Text
                className={
                  direction === d ? 'text-primary-foreground font-semibold' : 'text-foreground'
                }
              >
                {d === 'EXPENSE' ? 'Dépense' : 'Entrée'}
              </Text>
            </Button>
          ))}
        </View>

        <Label className="mt-4">Nom</Label>
        <Input value={name} onChangeText={setName} placeholder="Loyer, Netflix, salaire…" />

        <Label className="mt-4">Montant (€)</Label>
        <Input
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0,00"
        />

        <Label className="mt-4">Compte</Label>
        <View className="flex-row flex-wrap gap-2">
          {accounts.map((a) => (
            <Button
              key={a.id}
              variant={accountId === a.id ? 'default' : 'outline'}
              size="sm"
              onPress={() => setAccountId(a.id)}
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

        <Label className="mt-4">Catégorie</Label>
        <View className="flex-row flex-wrap gap-2">
          {categories.map((c) => (
            <Button
              key={c.id}
              variant={categoryId === c.id ? 'default' : 'outline'}
              size="sm"
              onPress={() => setCategoryId(c.id === categoryId ? undefined : c.id)}
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
      </Card>

      <Card className="mt-4">
        <Label>Fréquence</Label>
        <View className="flex-row items-center gap-2">
          <Text>Tous les</Text>
          <Input
            value={intervalCount}
            onChangeText={setIntervalCount}
            keyboardType="number-pad"
            className="w-16 text-center"
          />
          <View className="flex-row flex-wrap gap-2 flex-1">
            {UNITS.map((u) => (
              <Button
                key={u.key}
                variant={intervalUnit === u.key ? 'default' : 'outline'}
                size="sm"
                onPress={() => setIntervalUnit(u.key)}
              >
                <Text
                  className={
                    intervalUnit === u.key
                      ? 'text-primary-foreground font-semibold'
                      : 'text-foreground'
                  }
                >
                  {u.label}
                </Text>
              </Button>
            ))}
          </View>
        </View>

        {intervalUnit === 'MONTH' && (
          <>
            <Label className="mt-4">Jour du mois (1-31)</Label>
            <Input
              value={monthDay}
              onChangeText={setMonthDay}
              keyboardType="number-pad"
              placeholder="ex. 5"
            />
          </>
        )}

        <Label className="mt-4">Fin</Label>
        <View className="flex-row gap-2">
          {(['never', 'date', 'count'] as const).map((m) => (
            <Button
              key={m}
              variant={endMode === m ? 'default' : 'outline'}
              size="sm"
              onPress={() => setEndMode(m)}
            >
              <Text
                className={
                  endMode === m ? 'text-primary-foreground font-semibold' : 'text-foreground'
                }
              >
                {m === 'never' ? 'Indéfini' : m === 'date' ? 'Date' : 'Nb facturations'}
              </Text>
            </Button>
          ))}
        </View>
        {endMode === 'date' && (
          <Input
            className="mt-3"
            value={endDate}
            onChangeText={setEndDate}
            placeholder="AAAA-MM-JJ"
          />
        )}
        {endMode === 'count' && (
          <Input
            className="mt-3"
            value={remainingCount}
            onChangeText={setRemainingCount}
            keyboardType="number-pad"
            placeholder="ex. 12"
          />
        )}
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
