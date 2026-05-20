import { Redirect } from 'expo-router';
import { useFluxStore } from '@/lib/store';

export default function Index() {
  const hasOnboarded = useFluxStore((s) => s.hasOnboarded);
  return <Redirect href={hasOnboarded ? '/(tabs)' : '/onboarding'} />;
}
