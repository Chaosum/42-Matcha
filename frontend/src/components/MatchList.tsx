import {
  Text,
  HStack,
  Circle,
  Float,
  Button,
  IconButton,
} from "@chakra-ui/react";
import { Avatar } from "@/components/ui/avatar";
import { useNavigate } from "@tanstack/react-router";
import { ConversationIcon } from "@/components/Icons.tsx";
import { Match } from "@/lib/interface.ts";

export function MatchList({
  userData,
  setUsername,
}: {
  userData: Match;
  setUsername: (value: string) => void;
}) {
  const navigate = useNavigate();
  return (
    <HStack
      key={userData.username}
      gap="4"
      w={"250px"}
      h="fit-content"
      rounded="md"
      p={2}
      borderWidth="1px"
      borderColor="gray.200"
    >
      <Button
        variant={"ghost"}
        onClick={async () => {
          // @ts-expect-error-error
          await navigate({ to: "/profile/" + userData.username });
        }}
      >
        <Avatar name={userData.name} size="lg" src={userData.imageUrl}>
          <Float placement="bottom-end" offsetX="1" offsetY="1">
            <Circle
              bg="green.500"
              size="8px"
              outline="0.2em solid"
              outlineColor="bg"
            />
          </Float>
        </Avatar>
      </Button>
      <Text fontWeight="medium">{userData.name}</Text>
      <IconButton
        variant={"ghost"}
        onClick={() => {
          setUsername(userData.username);
        }}
      >
        <ConversationIcon />
      </IconButton>
    </HStack>
  );
}
