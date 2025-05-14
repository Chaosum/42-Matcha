import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_auth/auth/forgottenpassword.$id")({
  
  loader: async ({ params }) => {
    const { id } = params;
    const response = await fetch(`http://localhost:5163/Auth/Login/VerifyForgottenPassword/${id}`, {
      method: "POST",
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage);
    }

    return { id };
  },
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const { id } = Route.useLoaderData();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5163/Auth/Login/ResetPassword/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userPassword: password, PasswordVerification: confirmPassword }),
      });

      if (!response.ok) {
        const message = await response.text();
        setError(message);
      } else {
        navigate({ to: "/_auth/auth/login" });
      }
    } catch (err: any) {
      setError("Erreur serveur. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 space-y-4">
      <h2 className="text-xl font-semibold">Réinitialisation du mot de passe</h2>

      <input
        type="password"
        placeholder="Nouveau mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border px-4 py-2"
        required
      />

      <input
        type="password"
        placeholder="Confirmer le mot de passe"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="w-full border px-4 py-2"
        required
      />

      {error && <div className="text-red-500">{error}</div>}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 w-full"
      >
        {loading ? "in progress..." : "validate"}
      </button>
    </form>
  );
}