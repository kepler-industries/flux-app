import * as React from 'react';
import { View, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Plus, Pause, Play, Trash2 } from 'lucide-react-native';
import { ScrollScreen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFluxStore } from '@/lib/store';
import { describeRecurrence, formatMoney, nextOccurrenceAfter } from '@flux/shared';

export default function Recurring() {
  const recurring = useFluxStore((s) => s.recurring);
  const accounts = useFluxStore((s) => s.accounts);
  const updateRecurring = useFluxStore((s) => s.updateRecurring);
  const deleteRecurring = useFluxStore((s) => s.deleteRecurring);

  const items = recurring.filter((r) => !r.deletedAt);

  return (
    <ScrollScreen>
      <View className="flex-row items-center justify-between mb-4">
        <Text variant="heading">Récurrent</Text>
        <Link href="/recurring/new" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nouvelle dépense récurrente"
            className="h-12 w-12 rounded-full bg-primary items-center justify-center"
          >
            <Plus color="#0B0F14" size={24} />
          </Pressable>
        </Link>
      </View>

      {items.length === 0 ? (
        <Card className="items-center py-8">
          <Text variant="muted" className="text-center">
            Ajoutez une dépense récurrente (loyer, abonnement Netflix…) — Flux la créera automatiquement aux échéances.
          </Text>
        </Card>
      ) : (
        <View className="gap-3">
          {items.map((r) => {
            const acc = accounts.find((a) => a.id === r.accountId);
            const next = nextOccurrenceAfter({
              startDate: r.startDate,
              intervalUnit: r.intervalUnit,
              intervalCount: r.intervalCount,
              monthDay: r.monthDay,
              weekDay: r.weekDay,
              endDate: r.endDate,
              isPaused: r.isPaused,
            }, new Date());
            return (
              <Card key={r.id}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="font-medium">{r.name}</Text>
                    <Text variant="muted" className="text-xs mt-0.5">
                      {describeRecurrence({
                        intervalUnit: r.intervalUnit,
                        intervalCount: r.intervalCount,
                        monthDay: r.monthDay,
                        weekDay: r.weekDay,
                      })}
                      {acc ? ` · ${acc.name}` : ''}
                    </Text>
                    {next && !r.isPaused && (
                      <Text variant="muted" className="text-xs mt-0.5">
                        Prochaine : {next.toLocaleDateString('fr-FR')}
                      </Text>
                    )}
                  </View>
                  <Text
                    className={
                      r.direction === 'INCOME'
                        ? 'text-success font-semibold'
                        : 'text-destructive font-semibold'
                    }
                  >
                    {r.direction === 'INCOME' ? '+' : '−'}
                    {formatMoney(r.amountCents, r.currency)}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between mt-3">
                  {r.isPaused ? (
                    <Badge tone="warning">
                      <Text className="text-xs">En pause</Text>
                    </Badge>
                  ) : (
                    <View />
                  )}
                  <View className="flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => updateRecurring(r.id, { isPaused: !r.isPaused })}
                      accessibilityLabel={r.isPaused ? 'Reprendre' : 'Mettre en pause'}
                    >
                      {r.isPaused ? <Play color="white" size={14} /> : <Pause color="white" size={14} />}
                      <Text className="ml-1 text-xs">{r.isPaused ? 'Reprendre' : 'Pause'}</Text>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => deleteRecurring(r.id)}
                      accessibilityLabel="Supprimer"
                    >
                      <Trash2 color="hsl(0 78% 60%)" size={14} />
                    </Button>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </ScrollScreen>
  );
}
