import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GetHistory } from "@/lib/query.ts";
import { Button, Heading, Text, VStack } from "@chakra-ui/react";
import { History } from "@/lib/interface.ts";

export const Route = createFileRoute("/_app/history")({
  component: RouteComponent,
  loader: async () => {
    return (await GetHistory()) as History[];
  },
});

function RouteComponent() {
  const history = Route.useLoaderData();
  const navigate = useNavigate();

  if (!history || history.length === 0) {
    return (
      <VStack gap={4} justifyContent={"center"} alignItems={"center"}>
        <Heading>History</Heading>
        <Text>No history</Text>
      </VStack>
    );
  }

  return (
    <VStack gap={4} justifyContent={"center"} alignItems={"center"}>
      <Heading>History</Heading>
      {history.map((item: History, index) => (
        <Button
          key={index}
          w={"300px"}
          gap={2}
          alignItems={"center"}
          borderWidth="1px"
          borderColor="gray.200"
          p={2}
          variant={"plain"}
          aria-label="View Profile"
          onClick={async () => {
            // @ts-ignore
            await navigate({ to: "/profile/" + item.username });
          }}
        >
          <Text fontSize="lg" w={"100%"}>
            {item.name}
          </Text>
        </Button>
      ))}
    </VStack>
  );
}
