import * as React from 'react';
import { View, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Plus, Wallet, PiggyBank, Banknote, HandCoins, MoreHorizontal } from 'lucide-react-native';
import { ScrollScreen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { useFluxStore } from '@/lib/store';
import { formatMoney } from '@flux/shared';
import { accountBalance } from '@/lib/db';

const kindIcon = {
  CHECKING: Wallet,
  SAVINGS: PiggyBank,
  CASH: Banknote,
  POT: HandCoins,
  OTHER: MoreHorizontal,
} as const;

export default function Accounts() {
  const accounts = useFluxStore((s) => s.accounts);
  const [balances, setBalances] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, number> = {};
      for (const a of accounts) next[a.id] = await accountBalance(a.id);
      if (!cancelled) setBalances(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [accounts]);

  return (
    <ScrollScreen>
      <View className="flex-row items-center justify-between mb-4">
        <Text variant="heading">Comptes</Text>
        <Link href="/account/new" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nouveau compte"
            className="h-12 w-12 rounded-full bg-primary items-center justify-center"
          >
            <Plus color="#0B0F14" size={24} />
          </Pressable>
        </Link>
      </View>

      {accounts.length === 0 ? (
        <Card className="items-center py-8">
          <Text variant="muted">Aucun compte. Créez-en un pour démarrer.</Text>
        </Card>
      ) : (
        <View className="gap-3">
          {accounts.map((a) => {
            const Icon = kindIcon[a.kind] ?? Wallet;
            return (
              <Card key={a.id} className="flex-row items-center">
                <View
                  className="h-12 w-12 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: `${a.color}22` }}
                >
                  <Icon color={a.color} size={22} />
                </View>
                <View className="flex-1">
                  <Text className="font-medium">{a.name}</Text>
                  <Text variant="muted" className="text-xs mt-0.5">
                    {kindLabel(a.kind)}
                  </Text>
                </View>
                <Text className="font-semibold">
                  {formatMoney(balances[a.id] ?? a.initialBalanceCents, a.currency)}
                </Text>
              </Card>
            );
          })}
        </View>
      )}
    </ScrollScreen>
  );
}

function kindLabel(kind: string) {
  switch (kind) {
    case 'CHECKING':
      return 'Compte courant';
    case 'SAVINGS':
      return 'Épargne';
    case 'CASH':
      return 'Liquide';
    case 'POT':
      return 'Cagnotte';
    default:
      return 'Autre';
  }
}
