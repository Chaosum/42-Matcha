import { createFileRoute } from "@tanstack/react-router";
import { Dating, FiltersModel } from "@/lib/query"; // Assurez-vous d'importer FiltersModel correctement depuis query.ts
import { useEffect, useState } from "react";

interface Profile {
  id: number;
  userName: string;
  firstName: string;
  lastName: string;
  age: number;
  address: string;
  tags: string[];
  distance: number;
  fame: number;
  profileImageUrl: string;
}

const HomeComponent = () => {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const authToken = localStorage.getItem("token") || "";

  // Paramètres par défaut pour l'appel à l'API
  const defaultFilters: FiltersModel = {
    id: "user-id-123", // Exemple d'ID utilisateur
    range: 50,
    ageGap: 50,
    distanceGap: 600,
    fameGap: 10000,
    sortBy: "distance",
    resultLimit: 10,
    resultOffset: 0
  };

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const result = await Dating(defaultFilters, authToken);
        if (result) {
          setProfiles(result);
          defaultFilters.resultOffset = defaultFilters.resultOffset + defaultFilters.resultLimit;
        } else {
          setError("Impossible de récupérer les profils.");
        }
      } catch (err) {
        setError("Une erreur est survenue." + err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (    <div>
    <h1>Profiles</h1>
    {profiles ? (
      <ul>
        {profiles.map((profile) => (
          <li key={profile.id}>
            <img
              src={profile.profileImageUrl}
              alt={`${profile.firstName} ${profile.lastName}`}
              width={50}
              height={50}
            />
            <p>{profile.firstName} {profile.lastName}</p>
            <p>Age: {profile.age}</p>
            <p>Fame: {profile.fame}</p>
            <p>Tags: {profile.tags.join(", ")}</p>
          </li>
        ))}
      </ul>
    ) : (
      <p>No profiles found.</p>
    )}
  </div> );
};

export const Route = createFileRoute("/_app/home")({
  component: HomeComponent,
});