import {
  Text,
  HStack,
  Button,
  IconButton,
  Float,
  Status,
} from "@chakra-ui/react";
import { Avatar } from "@/components/ui/avatar";
import { useNavigate } from "@tanstack/react-router";
import { ConversationIcon } from "@/components/Icons.tsx";
import { Match } from "@/lib/interface.ts";
import { useEffect, useState } from "react";
import { DownloadImage } from "@/lib/query.ts";
import { AxiosError } from "axios";
import { useTheme } from "next-themes";

export function MatchList({
  userData,
  username,
  setUsername,
}: {
  userData: Match;
  username: string;
  setUsername: (value: string) => void;
}) {
  const theme = useTheme().theme;
  const navigate = useNavigate();
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

  function backgroundColor() {
    if (username === userData.username) {
      if (theme === "dark") {
        return "gray.700";
      }
      if (theme === "light") {
        return "gray.200";
      }
    } else {
      if (theme === "dark") {
        return "gray.800";
      }
      if (theme === "light") {
        return "white";
      }
    }
  }

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
      bg={backgroundColor()}
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
            <Status.Root colorPalette={userData.isOnline ? "green" : "red"}>
              <Status.Indicator />
            </Status.Root>
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
