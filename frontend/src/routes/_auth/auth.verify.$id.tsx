import {
  createFileRoute,
  getRouteApi,
  useNavigate,
  Link
} from "@tanstack/react-router";
import {Center, VStack, Text} from "@chakra-ui/react";
import {logger} from "@/lib/logger.ts";

// Création de la route avec un loader
export const Route = createFileRoute("/_auth/auth/verify/$id")({
  loader: async ({params}) => {
    const {id} = params; // Extraire l'ID des paramètres
    const response = await fetch(
      `http://localhost:5163/Auth/VerifyAccount/${id}`,
      {
        method: "POST",
      }
    );
    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage); // Lever une erreur si la requête échoue
    }

    const data = await response.text(); // Récupérer les données
    return {data}; // Retourner les données pour les utiliser dans le composant
  },
  component: RouteComponent,
  errorComponent: ErrorComponent,
});

// Récupération de l'API de la route
const routeApi = getRouteApi("/_auth/auth/verify/$id");

// Composant principal de la route
function RouteComponent() {
  const {data} = routeApi.useLoaderData() as { data: string }; // Utiliser les données du loader
  logger.log(data);

  return (
    <Center minH="100%">
      <VStack>
        <Text fontSize="lg" color="green.500">
          Account verified successfully
        </Text>
        <Link to="/">Login</Link>
      </VStack>
    </Center>
  );
}

function ErrorComponent({error}: { error: Error }) {
  const navigate = useNavigate();

  return (
    <Center minH="100%">
      <VStack>
        <Text fontSize="lg" color="red.500">
          Lien non valide ou expiré.
        </Text>
        <Link to="/">Login</Link>
      </VStack>
    </Center>
  );
}
