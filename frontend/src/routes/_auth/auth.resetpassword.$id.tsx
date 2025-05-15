import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {FormEvent, useState} from "react";
import {ResetPasswordRequest, VerifyForgottenPassword} from "@/lib/query.ts";
import {Center, Input, VStack, Text} from "@chakra-ui/react";
import {Button} from "@/components/ui/button.tsx";
import {ToasterError, ToasterSuccess} from "@/lib/toaster.ts";
import {logger} from "@/lib/logger.ts";
import { toaster } from "@/components/ui/toaster";

export const Route = createFileRoute("/_auth/auth/resetpassword/$id")({
  loader: async ({params}) => {
    const {id} = params;

    if (await VerifyForgottenPassword(id))
      return {id};
    else {
      return null;
    }
  },
  component: ResetPassword,
});


function ResetPassword() {
  const navigate = useNavigate();
  const {id} = Route.useLoaderData();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!id) {
    return (
      <div className="text-red-500">
        Le lien de réinitialisation du mot de passe est invalide ou a expiré.
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);

    if (password !== confirmPassword) {
      ToasterError("Erreur", "Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    const response = await ResetPasswordRequest(id, password, confirmPassword);
    if (response)
      ToasterSuccess("Password modified with success")
      await navigate({to: "/auth/login"});
    setLoading(false);
  };

  return (
    <Center minH="100%">
      <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 space-y-4">
        <VStack gap={4}>
          <Text className="text-xl font-semibold">Réinitialisation du mot de passe</Text>

          <Input
            type="password"
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-4 py-2"
            required
          />

          <Input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border px-4 py-2"
            required
          />

          <Button
            size="sm"
            type="submit"
            disabled={loading}
            className={"chakra-button"}
          >
            {loading ? "in progress..." : "Validate"}
          </Button>
        </VStack>
      </form>
    </Center>
  );
}