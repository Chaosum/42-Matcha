import { createFileRoute } from "@tanstack/react-router";
import { Button, Flex, HStack, Image, VStack } from "@chakra-ui/react";
import { LikeIcon, ProfileIcon, SkipIcon } from "@/components/Icons.tsx";

export const Route = createFileRoute("/_app/dating")({
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
        <HStack gap={20} justifyContent={"center"}>
          <Button variant={"ghost"}>
            <SkipIcon />
          </Button>
          <Button variant={"ghost"}>
            <ProfileIcon />
          </Button>
          <Button variant={"ghost"}>
            <LikeIcon />
          </Button>
        </HStack>
      </Flex>
    </VStack>
  );
}
