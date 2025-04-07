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
import { useEffect, useState } from "react";
import { DownloadImage } from "@/lib/query.ts";
import { AxiosError } from "axios";

export function MatchList({
  userData,
  setUsername,
}: {
  userData: Match;
  setUsername: (value: string) => void;
}) {
  const navigate = useNavigate();
  const isOnline = true; // TODO: Replace with actual online status check
  const [image, setImage] = useState<string>("");

  useEffect(() => {
    DownloadImage(userData.imageUrl)
      .then((data) => {
        setImage(data.data);
      })
      .catch((error: AxiosError) => {
        console.error(error);
      });
  });

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
        variant={"plain"}
        onClick={async () => {
          // @ts-expect-error-error
          await navigate({ to: "/profile/" + userData.username });
        }}
      >
        <Avatar name={userData.name} size="lg" src={image}>
          <Float placement="bottom-end" offsetX="1" offsetY="1">
            <Circle
              bg={isOnline ? "green.400" : "grey.400"}
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
