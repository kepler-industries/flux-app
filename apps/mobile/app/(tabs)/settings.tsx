import * as React from 'react';
import { View, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { ChevronRight, LogIn, LogOut, RefreshCw, Tag, PieChart } from 'lucide-react-native';
import { ScrollScreen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { authClient, useSession } from '@/lib/auth-client';
import { syncBoth } from '@/lib/sync';
import { useFluxStore } from '@/lib/store';

export default function Settings() {
  const session = useSession();
  const categories = useFluxStore((s) => s.categories);
  const budgets = useFluxStore((s) => s.budgets);
  const [syncing, setSyncing] = React.useState(false);

  const onSync = async () => {
    setSyncing(true);
    try {
      await syncBoth();
      Alert.alert('Synchronisation', 'Vos données ont été synchronisées.');
    } catch (e) {
      Alert.alert('Erreur', String(e));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ScrollScreen>
      <Text variant="heading" className="mb-4">Réglages</Text>

      <Card className="mb-5">
        <Text variant="label" className="mb-2">Sauvegarde cloud</Text>
        {session?.data?.user ? (
          <>
            <Text className="font-medium">{session.data.user.email}</Text>
            <Text variant="muted" className="text-xs mt-0.5">
              Connecté — vos données peuvent être sauvegardées.
            </Text>
            <Button
              fullWidth
              variant="outline"
              className="mt-4"
              disabled={syncing}
              onPress={onSync}
              accessibilityLabel="Synchroniser"
            >
              <RefreshCw color="white" size={16} />
              <Text className="ml-2">{syncing ? 'Synchronisation…' : 'Synchroniser maintenant'}</Text>
            </Button>
            <Button
              fullWidth
              variant="ghost"
              className="mt-2"
              onPress={async () => {
                await authClient.signOut();
              }}
              accessibilityLabel="Se déconnecter"
            >
              <LogOut color="hsl(0 78% 60%)" size={16} />
              <Text className="ml-2 text-destructive">Se déconnecter</Text>
            </Button>
          </>
        ) : (
          <>
            <Text variant="muted" className="leading-snug">
              L&apos;authentification est facultative et sert uniquement à sauvegarder vos données.
              Vos dépenses restent stockées sur votre appareil.
            </Text>
            <Button
              fullWidth
              variant="default"
              className="mt-4"
              onPress={() => router.push('/signin')}
              accessibilityLabel="Activer la sauvegarde"
            >
              <LogIn color="#0B0F14" size={16} />
              <Text className="ml-2 font-semibold text-primary-foreground">
                Activer la sauvegarde
              </Text>
            </Button>
          </>
        )}
      </Card>

      <Card className="mb-5">
        <Text variant="label" className="mb-2">Données</Text>
        <Link href="/category/new" asChild>
          <Button variant="ghost" fullWidth className="justify-between">
            <View className="flex-row items-center">
              <Tag color="hsl(220 9% 65%)" size={18} />
              <Text className="ml-3">Catégories ({categories.length})</Text>
            </View>
            <ChevronRight color="hsl(220 9% 65%)" size={18} />
          </Button>
        </Link>
        <Separator />
        <Link href="/budget/new" asChild>
          <Button variant="ghost" fullWidth className="justify-between">
            <View className="flex-row items-center">
              <PieChart color="hsl(220 9% 65%)" size={18} />
              <Text className="ml-3">Budgets ({budgets.length})</Text>
            </View>
            <ChevronRight color="hsl(220 9% 65%)" size={18} />
          </Button>
        </Link>
      </Card>

      <Card>
        <Text variant="label" className="mb-2">À propos</Text>
        <Text className="font-medium">Flux</Text>
        <Text variant="muted" className="text-xs mt-0.5">
          v0.1.0 · Local-first · Open-source
        </Text>
      </Card>
    </ScrollScreen>
  );
}
