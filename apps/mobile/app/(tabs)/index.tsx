import * as React from 'react';
import { View, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react-native';
import { ScrollScreen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useFluxStore } from '@/lib/store';
import { formatMoney } from '@flux/shared';
import { totalsForMonth, monthlySpendByCategory } from '@/lib/db';

export default function Home() {
  const accounts = useFluxStore((s) => s.accounts);
  const transactions = useFluxStore((s) => s.transactions);
  const categories = useFluxStore((s) => s.categories);
  const budgets = useFluxStore((s) => s.budgets);
  const [totals, setTotals] = React.useState({ income: 0, expense: 0 });
  const [spendByCat, setSpendByCat] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    const now = new Date();
    totalsForMonth(now).then(setTotals);
    monthlySpendByCategory(now).then(setSpendByCat);
  }, [transactions.length, budgets.length]);

  const totalBalance = React.useMemo(() => {
    return accounts.reduce((sum, a) => sum + a.initialBalanceCents, 0)
      + transactions.reduce((sum, t) => {
        if (t.deletedAt) return sum;
        if (t.direction === 'INCOME') return sum + t.amountCents;
        if (t.direction === 'EXPENSE') return sum - t.amountCents;
        return sum;
      }, 0);
  }, [accounts, transactions]);

  const recent = transactions.slice(0, 8);

  return (
    <ScrollScreen>
      <View className="mb-2 flex-row items-center justify-between">
        <View>
          <Text variant="muted">Solde total</Text>
          <Text variant="heading">{formatMoney(totalBalance)}</Text>
        </View>
        <Link href="/transaction/new" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ajouter une dépense"
            className="h-14 w-14 rounded-full bg-primary items-center justify-center active:opacity-90"
            hitSlop={8}
          >
            <Plus color="#0B0F14" size={28} />
          </Pressable>
        </Link>
      </View>

      <Card className="mt-4 flex-row gap-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <TrendingUp color="hsl(152 60% 50%)" size={16} />
            <Text variant="muted" className="text-xs">Entrées du mois</Text>
          </View>
          <Text className="text-lg font-semibold text-success">
            {formatMoney(totals.income)}
          </Text>
        </View>
        <Separator className="w-px h-full my-0" />
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <TrendingDown color="hsl(0 78% 60%)" size={16} />
            <Text variant="muted" className="text-xs">Dépenses du mois</Text>
          </View>
          <Text className="text-lg font-semibold text-destructive">
            {formatMoney(totals.expense)}
          </Text>
        </View>
      </Card>

      {budgets.length > 0 && (
        <View className="mt-6">
          <Text variant="title" className="mb-3">Budgets</Text>
          <View className="gap-3">
            {budgets.map((b) => {
              const spent = b.categoryId ? (spendByCat[b.categoryId] ?? 0) : Object.values(spendByCat).reduce((a, c) => a + c, 0);
              const ratio = b.monthlyCapCents === 0 ? 0 : spent / b.monthlyCapCents;
              const tone = ratio >= 1 ? 'destructive' : ratio >= 0.8 ? 'warning' : 'success';
              return (
                <Card key={b.id}>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="font-medium">{b.name}</Text>
                    <Text variant="muted">
                      {formatMoney(spent)} / {formatMoney(b.monthlyCapCents)}
                    </Text>
                  </View>
                  <Progress value={ratio} tone={tone} />
                </Card>
              );
            })}
          </View>
        </View>
      )}

      <View className="mt-6 flex-row items-center justify-between">
        <Text variant="title">Transactions récentes</Text>
        <Link href="/transaction/new" asChild>
          <Button variant="ghost" size="sm" accessibilityLabel="Ajouter une transaction">
            <Text className="text-primary">Ajouter</Text>
          </Button>
        </Link>
      </View>
      {recent.length === 0 ? (
        <Card className="mt-3 items-center py-8">
          <Text variant="muted">Aucune transaction. Tapez sur + pour en ajouter une.</Text>
        </Card>
      ) : (
        <View className="mt-3 gap-2">
          {recent.map((t) => {
            const cat = categories.find((c) => c.id === t.categoryId);
            const amount = formatMoney(t.amountCents, t.currency);
            const sign = t.direction === 'INCOME' ? '+' : t.direction === 'EXPENSE' ? '−' : '';
            return (
              <Card key={t.id} className="flex-row items-center justify-between py-3">
                <View className="flex-1 pr-3">
                  <Text className="font-medium" numberOfLines={1}>
                    {t.description}
                  </Text>
                  <Text variant="muted" className="text-xs mt-0.5">
                    {new Date(t.date).toLocaleDateString('fr-FR')}
                    {cat ? ` · ${cat.name}` : ''}
                  </Text>
                </View>
                <Text
                  className={
                    t.direction === 'INCOME'
                      ? 'text-success font-semibold'
                      : t.direction === 'EXPENSE'
                        ? 'text-destructive font-semibold'
                        : 'text-foreground font-semibold'
                  }
                >
                  {sign}
                  {amount}
                </Text>
              </Card>
            );
          })}
        </View>
      )}
    </ScrollScreen>
  );
}
