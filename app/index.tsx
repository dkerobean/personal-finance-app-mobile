import { Redirect } from 'expo-router';

export default function Index() {
  // For now, redirect to registration screen
  // Later this will check auth state and redirect appropriately
  return <Redirect href="/(auth)/register" />;
}