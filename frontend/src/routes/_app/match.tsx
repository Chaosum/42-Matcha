import { createFileRoute } from "@tanstack/react-router";
import {
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { MatchList } from "@/components/MatchList.tsx";
import { ChatOptionIcon } from "@/components/Icons.tsx";
import { Actor, Match, MessageProps } from "@/lib/interface.ts";
import { GetMatches, GetMessages } from "@/lib/query.ts";

export const Route = createFileRoute("/_app/match")({
  component: RouteComponent,
  loader: async () => {
    const Matches = await GetMatches();
    const FirstMessages = await GetMessages(Matches[0].username);
    return { Matches, FirstMessages };
  },
});

const Message = ({ message }: { message: MessageProps }) => {
  const date = new Date(message.timestamp);
  const time = date ? date.toLocaleTimeString() : "";

  return (
    <VStack
      key={message.id}
      w="fit-content"
      alignSelf={message.actor === Actor.SENDER ? "flex-end" : "flex-start"}
      gap={1}
    >
      <Flex
        py={2}
        px={4}
        bg={message.actor === Actor.SENDER ? "blue.500" : "gray.100"}
        color={message.actor === Actor.SENDER ? "white" : "gray.600"}
        borderRadius="lg"
        w="fit-content"
      >
        <Text>{message.text}</Text>
      </Flex>
      <Text
        fontSize="2xs"
        ml={2}
        color="gray.400"
        alignSelf={message.actor === Actor.SENDER ? "flex-end" : "flex-start"}
      >
        {time}
      </Text>
    </VStack>
  );
};

function MatchOption() {
  return (
    <MenuRoot positioning={{ placement: "right-start" }}>
      <MenuTrigger asChild>
        <IconButton variant="ghost" size="sm">
          <ChatOptionIcon />
        </IconButton>
      </MenuTrigger>
      <MenuContent pos="absolute" right="-115px" width={"fit-content"}>
        <MenuItem value="block" width={"fit-content"}>
          🛇
        </MenuItem>
      </MenuContent>
    </MenuRoot>
  );
}

function RouteComponent() {
  const { Matches, FirstMessages } = Route.useLoaderData();
  const messagesEndRef = useRef<HTMLDivElement>();
  const [username, setUsername] = useState<string>(Matches[0].username || "");
  const [chat, setChat] = useState<MessageProps[]>(FirstMessages || []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }

    // const currentUser = users.filter((user) => user.id === id) as Match;
    // if (currentUser) setChat(currentUser.chat);
  }, [username]);

  return (
    <VStack>
      <Heading>Match and Chat</Heading>
      <HStack
        w={"fit-content"}
        justifyContent={"center"}
        alignItems={"flex-start"}
        gap={3}
        justifySelf={"center"}
      >
        <Stack gap="2" w={"250px"}>
          {Matches.map((user: Match) => (
            <MatchList userData={user} setUsername={setUsername} />
          ))}
        </Stack>
        <Flex
          flexDirection="column"
          w="lg"
          h="100vh"
          m="auto"
          maxH="2xl"
          borderWidth="1px"
          roundedTop="lg"
        >
          <Stack
            px={4}
            py={8}
            overflowY="auto"
            scrollBehavior="smooth"
            flex={1}
            ref={messagesEndRef}
          >
            {chat && chat.map((message) => <Message message={message} />)}
          </Stack>
          <HStack p={4} bg="gray.100" position="relative">
            <Input bg="white" placeholder="Enter your text" />
            <Button colorScheme="blue">Send</Button>
            <MatchOption />
          </HStack>
        </Flex>
      </HStack>
    </VStack>
  );
}
