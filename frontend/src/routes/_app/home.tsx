import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {Dating} from "@/lib/query"; // Assurez-vous d'importer FiltersModel correctement depuis query.ts
import {useEffect, useState} from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  createListCollection,
  NumberInput,
  Portal,
  Select,
  Text,
  Flex, Input, Field
} from "@chakra-ui/react";
import {UserImage} from "@/components/UserImage";
import {FiltersModel, Profile} from "@/lib/interface.ts";
import {logger} from "@/lib/logger.ts";

export const Route = createFileRoute("/_app/home")({
  component: Home,
  loader: async () => {

  },
});

function Home() {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ageGap, setAgeGap] = useState<number>(50);
  const [distanceGap, setDistanceGap] = useState<number>(500);
  const [fameGap, setFameGap] = useState<number>(1000);
  const [sortBy, setsortBy] = useState<string[]>(["distance"]);
  const [resultOffset, setResultOffset] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  const navigate = useNavigate();

  const authToken = localStorage.getItem("token") || "";

  // Paramètres par défaut pour l'appel à l'API
  const fetchProfiles = async () => {
    try {
      const filters: FiltersModel = {
        range: 50,
        ageGap: ageGap,
        distanceGap: distanceGap,
        fameGap: fameGap,
        sortBy: sortBy[0],
        resultLimit: 10,
        resultOffset: resultOffset
      };
      const result = await Dating(filters, authToken);
      if (result) {
        setProfiles(result.profiles);
        setTotalCount(result.totalCount);
        logger.log("totalCount = ", totalCount);
      } else {
        setError("Impossible de récupérer les profils.");
      }
    } catch (err) {
      setError("Une erreur est survenue." + err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfiles();
  }, [resultOffset]);

  useEffect(() => {
  }, [profiles])

  logger.log("profiles = ");
  if (profiles) {
    profiles.map(profile => (logger.log(profile)));
  }
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (profiles == null) {
    return <div> No matching profiles </div>;
  }
  const sortOptions = createListCollection({
    items: [
      {value: "distance", label: "Distance"},
      {value: "birth_date", label: "Birth Date"},
      {value: "fame", label: "Fame"},
      {value: "common_tags", label: "Common Tags"},
    ],
  })

  return (
    <Flex direction="column"
          alignItems="center"
          justifyContent={"center"}
          gap={4}>
      <Flex direction={"row"}
            alignItems={"center"}
            justifyContent={"center"}
            gap={4}
            mwxW={"1000px"}>
        <NumberInput.Root defaultValue="50"
                          min={0}
                          max={100}
                          clampValueOnBlur
                          value={ageGap.toString()}
                          onValueChange={(e) => {
                            if (isNaN(parseInt(e.value)))
                              setAgeGap(0);
                            else
                              setAgeGap(parseInt(e.value));
                          }}>
          <NumberInput.Label>Age gap</NumberInput.Label>
          <NumberInput.Input/>
        </NumberInput.Root>
        <NumberInput.Root defaultValue="50"
                          min={0}
                          max={2000}
                          maxWidth="150px"
                          clampValueOnBlur
                          value={distanceGap.toString()}
                          onValueChange={(e) => {
                            if (isNaN(parseInt(e.value)))
                              setDistanceGap(0);
                            else
                              setDistanceGap(parseInt(e.value))
                          }}>
          <NumberInput.Label/>
          <NumberInput.ValueText> Distance gap </NumberInput.ValueText>
          <NumberInput.Input/>
        </NumberInput.Root>
        <NumberInput.Root min={0}
                          max={10000}
                          maxWidth="150px"
                          clampValueOnBlur
                          defaultValue={"50"}
                          value={fameGap.toString()}
                          onValueChange={(e) => {
                            if (isNaN(parseInt(e.value)))
                              setFameGap(0);
                            else
                              setFameGap(parseInt(e.value))
                          }}>
          <NumberInput.Label/>
          <NumberInput.ValueText> Fame gap </NumberInput.ValueText>
          <NumberInput.Input/>
        </NumberInput.Root>
        <Select.Root collection={sortOptions}
                     defaultValue={["distance"]}
                     value={sortBy}
                     maxWidth="200px"
                     onValueChange={(e) => setsortBy(e.value)}
        >
          <Select.HiddenSelect/>
          <Select.Label> Sort By </Select.Label>
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText/>
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator/>
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {sortOptions.items.map((sortOption) => (
                  <Select.Item item={sortOption} key={sortOption.value}>
                    {sortOption.label}
                    <Select.ItemIndicator/>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
        <Button mt={6}
                onClick={async () => {
                  if (resultOffset == 0) {
                    await fetchProfiles();
                  } else {
                    setResultOffset(0);
                  }
                }}>Apply</Button>
      </Flex>
      <Flex
        direction="row"
        alignItems="center"
        justifyContent="center"
        gap={4}
      >
        <Button
          width={"fit-content"}
          height={"fit-content"}
          onClick={async () => {
            logger.log("pouet1", resultOffset, totalCount);
            if (resultOffset - 10 >= 0) {
              setResultOffset(prev => prev - 10);
            }
          }}>
          ←
        </Button>
        <Box></Box>
        <Button
          width={"fit-content"}
          height={"fit-content"}
          onClick={async () => {
            if (resultOffset + 10 <= totalCount) {
              setResultOffset(prev => prev + 10);
            }
          }}>
          →
        </Button>
      </Flex>
      <Flex
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
                await navigate({to: "/profile/" + profile.userName});
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
      </Flex>
    </Flex>
  );
}
