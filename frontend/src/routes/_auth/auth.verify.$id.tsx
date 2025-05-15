import {
  createFileRoute,
  getRouteApi,
  useNavigate,
} from "@tanstack/react-router";
import {Center, VStack, Text} from "@chakra-ui/react";
import {useEffect, useState} from "react";
import {logger} from "@/lib/logger.ts";
import { ToasterError, ToasterSuccess } from "@/lib/toaster";

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
      </VStack>
    </Center>
  );
}

function ErrorComponent({error}: { error: Error }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('')

  useEffect(() => {
    logger.log(error.message);
    // Rediriger vers /auth/not-verify après une erreur
    navigate({to: "/auth/not-verify"}).then(() =>
      logger.log("Redirected); to /auth/not-verify")
    );
  }, [error.message, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await fetch(
        'http://localhost:5163/Auth/sendverificationlink/',
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({Email: email}),
        },
      )
      ToasterSuccess('Success', 'email sent if correct')
      await navigate({to: '/auth/login'})
    } catch (err) {
      ToasterError('Error', 'An error occurred while sending the verification link.')
      await navigate({to: '/auth/login'})
    }
  }

  return (
    <Flex justify="center" align="center" h="100%">
      <Card.Root maxW="lg" minW={{base: 'sm'}}>
        <Card.Header>
          <Text fontSize="xl" fontWeight="bold">
            Get a new verification link
          </Text>
        </Card.Header>
        <Card.Body>
          <form onSubmit={handleSubmit}>
            <Stack>
              <div>
                <Text fontWeight="semibold" mb={1}>
                  Email Address
                </Text>
                <Input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button type="submit" colorScheme="blue">
                Send Link
              </Button>
            </Stack>
          </form>
        </Card.Body>
      </Card.Root>
    </Flex>
  );
}
