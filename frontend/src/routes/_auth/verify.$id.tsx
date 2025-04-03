import { createFileRoute, getRouteApi, useNavigate} from '@tanstack/react-router';
import { Center, VStack, Text } from '@chakra-ui/react';
import { useEffect } from 'react';

// Création de la route avec un loader
export const Route = createFileRoute('/_auth/verify/$id')({
  loader: async ({ params }) => {
    const { id } = params; // Extraire l'ID des paramètres
    const response = await fetch(`http://localhost:5163/Auth/VerifyAccount/${id}`, {
      method: 'POST',
    });
    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage); // Lever une erreur si la requête échoue
    }

    const data = await response.text(); // Récupérer les données
    return { data }; // Retourner les données pour les utiliser dans le composant
  },
  component: RouteComponent,
  errorComponent: ErrorComponent,
});

// Récupération de l'API de la route
const routeApi = getRouteApi('/auth/verify/$id');

// Composant principal de la route
function RouteComponent() {
  const { data } = routeApi.useLoaderData() as { data: string }; // Utiliser les données du loader

  return (
    <Center minH="100vh">
      <VStack>
        <Text fontSize="lg" color="green.500">
          Account verified succesfuly
        </Text>
      </VStack>
    </Center>
  );
}

function ErrorComponent({ error }: { error: Error }) {
   const navigate = useNavigate();
  useEffect(() => {
     // Rediriger vers /auth/not-verify après une erreur
     navigate({ to: '/auth/not-verify' });
   }, [navigate]);

  return (
    <Center minH="100vh">
      <VStack>
        <Text fontSize="lg" color="red.500">
          Redirecting to /auth/not-verify...
        </Text>
      </VStack>
    </Center>
  );
}