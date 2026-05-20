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

const PALETTE = ['#F87171', '#60A5FA', '#FBBF24', '#A78BFA', '#34D399', '#F472B6', '#94A3B8', '#5B8DEF'];

export default function CategoriesScreen() {
  const categories = useFluxStore((s) => s.categories);
  const createCategory = useFluxStore((s) => s.createCategory);
  const deleteCategory = useFluxStore((s) => s.deleteCategory);
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState(PALETTE[0]!);
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Nom requis');
      return;
    }
    setSubmitting(true);
    await createCategory({ name: name.trim(), color, icon: 'tag' });
    setName('');
    setSubmitting(false);
  };

  return (
    <ScrollScreen contentClassName="pt-6">
      <Text variant="heading" className="mb-4">Catégories</Text>
      <Card>
        <Label>Nouvelle catégorie</Label>
        <Input value={name} onChangeText={setName} placeholder="ex. Voyages" />
        <Label className="mt-3">Couleur</Label>
        <View className="flex-row flex-wrap gap-2">
          {PALETTE.map((p) => (
            <Button
              key={p}
              variant="outline"
              size="sm"
              className={color === p ? 'border-primary' : ''}
              onPress={() => setColor(p)}
              accessibilityLabel={`Couleur ${p}`}
            >
              <View
                style={{ backgroundColor: p, width: 18, height: 18, borderRadius: 9 }}
                accessibilityIgnoresInvertColors
              />
            </Button>
          ))}
        </View>
        <Button fullWidth className="mt-4" disabled={submitting || !name.trim()} onPress={onSubmit}>
          <Text className="text-primary-foreground font-semibold">Ajouter</Text>
        </Button>
      </Card>

      <Text variant="title" className="mt-6 mb-3">Existantes</Text>
      <View className="gap-2">
        {categories.map((c) => (
          <Card key={c.id} className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View
                style={{ backgroundColor: c.color, width: 18, height: 18, borderRadius: 9, marginRight: 12 }}
                accessibilityIgnoresInvertColors
              />
              <Text>{c.name}</Text>
            </View>
            <Button variant="ghost" size="icon" onPress={() => deleteCategory(c.id)} accessibilityLabel="Supprimer">
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
