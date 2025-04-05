import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button, Card, Flex, Stack, Text } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { LoginForm } from "@/components/form/LoginForm.tsx";
import { toaster } from "@/components/ui/toaster.tsx";
import { ToasterError, ToasterSuccess } from "@/lib/toaster.ts";
import { RiArrowRightLine } from "react-icons/ri";
import { setUserToken } from "@/auth.tsx";

export const Route = createFileRoute("/_auth/auth/login")({
  component: RouteComponent,
});

export interface LoginFormValues {
  username: string;
  password: string;
}

interface LoginResponse {
  token?: string;
  id?: string;
  error?: string;
  message?: string;
}

async function TryLogin(data: LoginFormValues): Promise<LoginResponse> {
  try {
    const response = await fetch("http://localhost:5163/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return response.json();
  } catch (e) {
    console.error(e);
    return { error: "Erreur", message: "Erreur serveur" };
  }
}

function RouteComponent() {
  const navigate = useNavigate();
  const form = useForm<LoginFormValues>();

  const onSubmit = form.handleSubmit(async (data) => {
    const t = toaster.loading({ title: "Connexion en cours..." });
    const result = await TryLogin(data);
    toaster.remove(t);

    if (result.error) {
      ToasterError("Erreur", result.message);
    }

    if (result.token) {
      ToasterSuccess("Vous êtes connecté !");
      setUserToken(result.token);
      await navigate({
        to: "/home",
      });
    }
  });

  return (
    <Flex
      justifyContent="center"
      alignItems="center"
      direction="column"
      gap={2}
    >
      <Card.Root maxW="lg" minWidth={{ base: "sm" }}>
        <Card.Header alignItems="center">
          <Card.Title>Sign in</Card.Title>
        </Card.Header>
        <Card.Body justifyContent="center">
          <LoginForm form={form} onSubmit={onSubmit} />
        </Card.Body>
        <Card.Footer justifyContent="center">
          <Stack direction="column" align="center">
            <Text>You do not have an account ? </Text>
            <Link to={"/auth/register"} className={"chakra-button"}>
              <Button size="xs" variant="subtle">
                Register <RiArrowRightLine />
              </Button>
            </Link>
          </Stack>
        </Card.Footer>
      </Card.Root>
    </Flex>
  );
}
