import { createFileRoute } from "@tanstack/react-router";
import { Flex, Image, VStack } from "@chakra-ui/react";

export const Route = createFileRoute("/_app/home")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <VStack justifyContent={"center"}>
      <Flex justifyContent={"center"} direction={"column"}>
        <Image
          src="https://wallpapercave.com/uwp/uwp4261619.png"
          alt="Naruto vs Sasuke"
          aspectRatio={4 / 5}
          width="md"
        />
      </Flex>
    </VStack>
  );
}
