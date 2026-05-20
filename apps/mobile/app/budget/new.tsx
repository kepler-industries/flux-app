import * as React from 'react';
import { View, Alert } from 'react-native';
import { router } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { ScrollScreen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useFluxStore } from '@/lib/store';
import { formatMoney, toCents } from '@flux/shared';

export default function BudgetsScreen() {
  const budgets = useFluxStore((s) => s.budgets);
  const categories = useFluxStore((s) => s.categories);
  const createBudget = useFluxStore((s) => s.createBudget);
  const deleteBudget = useFluxStore((s) => s.deleteBudget);
  const [name, setName] = React.useState('');
  const [cap, setCap] = React.useState('');
  const [categoryId, setCategoryId] = React.useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Nom requis');
      return;
    }
    const capCents = toCents(Number(cap.replace(',', '.')) || 0);
    if (capCents <= 0) {
      Alert.alert('Plafond invalide');
      return;
    }
    setSubmitting(true);
    await createBudget({
      name: name.trim(),
      categoryId: categoryId ?? null,
      monthlyCapCents: capCents,
      currency: 'EUR',
    });
    setName('');
    setCap('');
    setCategoryId(undefined);
    setSubmitting(false);
  };

  return (
    <ScrollScreen contentClassName="pt-6">
      <Text variant="heading" className="mb-4">Budgets</Text>
      <Card>
        <Label>Nom</Label>
        <Input value={name} onChangeText={setName} placeholder="ex. Restaurants" />
        <Label className="mt-3">Plafond mensuel (€)</Label>
        <Input value={cap} onChangeText={setCap} keyboardType="decimal-pad" placeholder="0,00" />
        <Label className="mt-3">Catégorie (optionnel)</Label>
        <View className="flex-row flex-wrap gap-2">
          <Button
            variant={categoryId === undefined ? 'default' : 'outline'}
            size="sm"
            onPress={() => setCategoryId(undefined)}
          >
            <Text
              className={
                categoryId === undefined ? 'text-primary-foreground font-semibold' : 'text-foreground'
              }
            >
              Toutes
            </Text>
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              variant={categoryId === c.id ? 'default' : 'outline'}
              size="sm"
              onPress={() => setCategoryId(c.id)}
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
        <Button fullWidth className="mt-4" disabled={submitting} onPress={onSubmit}>
          <Text className="text-primary-foreground font-semibold">Ajouter</Text>
        </Button>
      </Card>

      <Text variant="title" className="mt-6 mb-3">Existants</Text>
      <View className="gap-2">
        {budgets.map((b) => (
          <Card key={b.id} className="flex-row items-center justify-between">
            <View>
              <Text>{b.name}</Text>
              <Text variant="muted" className="text-xs">{formatMoney(b.monthlyCapCents, b.currency)} / mois</Text>
            </View>
            <Button variant="ghost" size="icon" onPress={() => deleteBudget(b.id)} accessibilityLabel="Supprimer">
              <Trash2 color="hsl(0 78% 60%)" size={18} />
            </Button>
          </Card>
        ))}
      </View>

      <Button variant="outline" fullWidth className="mt-6" onPress={() => router.back()}>
        <Text>Fermer</Text>
      </Button>
    </ScrollScreen>
  );
}
