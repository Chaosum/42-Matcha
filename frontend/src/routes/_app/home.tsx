import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Dating, DownloadImage, FiltersModel } from "@/lib/query"; // Assurez-vous d'importer FiltersModel correctement depuis query.ts
import { useEffect, useState } from "react";
import { Badge, Box, Button, Card, Image, Text } from "@chakra-ui/react";
import { AxiosError } from "axios";
import { ToasterError } from "@/lib/toaster";
import { UserImage } from "@/components/UserImage";

export const Route = createFileRoute("/_app/home")({
  component: Home,
  loader: async () => {

  },
});

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
  imgData: string;
}

function Home() {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const authToken = localStorage.getItem("token") || "";

  // Paramètres par défaut pour l'appel à l'API
  const defaultFilters: FiltersModel = {
    range: 50,
    ageGap: 50,
    distanceGap: 400000,
    fameGap: 100000,
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
        defaultFilters.resultOffset += defaultFilters.resultLimit;
      }
      else {
          setError("Impossible de récupérer les profils.");
      }
    }  catch (err) {
      setError("Une erreur est survenue." + err);
    } finally {
      setLoading(false);
    }
  }
  fetchProfiles();
  },[]);
  
  console.log("profiles = ");
  if (profiles)
  {
    profiles.map( profile => (console.log(profile)));
  }
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (profiles == null)
  {
    return <div> No matching profiles </div>;
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      p={6}
      gap={8}
    >
      {profiles?.map((profile) => (
        <Box key={profile.id} maxWidth="450px">
          <Button
            variant={"plain"}
            width={"fit-content"}
            height={"fit-content"}
            onClick={async () => {
              // @ts-expect-error-error
              await navigate({ to: "/profile/" + profile.userName });
            }}
          >
            <Card.Root mt={4}>
              <Card.Header>
                <Text fontSize="xl" fontWeight="bold">
                  {profile.firstName} {profile.lastName}, {profile.age}
                </Text>
              </Card.Header>
    
              <Card.Body>
              <UserImage
                imageName={profile.profileImageUrl}
                width="400px"
                height="400px"
                borderRadius={"md"}
              />
              </Card.Body>
    
              <Card.Footer>
                <Box display="flex" flexWrap="wrap" gap="2">
                  {profile.tags.map((tag, index) => (
                    <Badge key={index} colorScheme="teal">
                      {tag}
                    </Badge>
                  ))}
                </Box>
                <Box mt={2}>
                  <Text>{profile.distance} km — {profile.fame} fame</Text>
                </Box>
              </Card.Footer>
            </Card.Root>
          </Button>
        </Box>
      ))}
    </Box>
  );  
};
