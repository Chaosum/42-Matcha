import { createFileRoute } from "@tanstack/react-router";
import {
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { MatchList } from "@/components/MatchList.tsx";
import { Actor, Match } from "@/lib/interface.ts";
import { GetMatches, GetMessages } from "@/lib/query.ts";
import useWebSocket from "react-use-websocket";
import { getUserToken } from "@/auth.tsx";
import { ChatMessage, WsMessage } from "@/lib/Websocket.ts";

export const Route = createFileRoute("/_app/match")({
  component: RouteComponent,
  loader: async () => {
    const Matches = await GetMatches();
    // const FirstMessages = await GetMessages(Matches[0].username);
    return { Matches, FirstMessages: [] };
  },
});

function RouteComponent() {
  const { Matches, FirstMessages } = Route.useLoaderData();
  const [username, setUsername] = useState<string>(Matches[0]?.username || "");
  const [newMessage, setNewMessage] = useState<string>("");
  const [chat, setChat] = useState<ChatMessage[]>(FirstMessages || []);
  const messagesEndRef = useRef<HTMLDivElement>();

  const { sendMessage, readyState } = useWebSocket("ws://localhost:5163/ws", {
    heartbeat: {
      returnMessage: "pong",
      timeout: 60000, // 1 minute, if no response is received, the connection will be closed
      interval: 25000, // every 25 seconds, a ping message will be sent
    },
    shouldReconnect: () => true,
    onOpen: () => {
      console.log("opened");
      const connection = {
        Message: "connection",
        Data: "Bearer " + getUserToken(),
      };
      sendMessage(JSON.stringify(connection));
    },
    onClose: () => {
      console.log("closed");
    },
    onMessage: (event) => {
      // console.log("OnMessage: ", event);
      if (!event.data) return;
      if (event.data === "pong") {
        console.log("pong");
        return;
      }

      // Parse the incoming message
      const wsMessage = JSON.parse(event.data) as WsMessage;
      if (wsMessage.Message !== "chat") return;

      const chatMessage = wsMessage.Data as ChatMessage;
      console.log(chatMessage);

      setChat((prevChat) => {
        // Check if the message is from the current user
        if (chatMessage.SenderUsername === username) {
          return [...prevChat, chatMessage];
        } else {
          return prevChat;
        }
      });
    },
  });

  function handleMessage(message: string, receiverUsername: string) {
    if (readyState === 1) {
      const chatMessage: ChatMessage = {
        SenderUsername: "silverfish829",
        ReceiverUsername: receiverUsername,
        Message: message,
        Timestamp: Date.now().toString(),
      };

      const wsMessage: WsMessage = {
        Message: "chat",
        Data: chatMessage,
      };

      try {
        console.log("sending message: ", wsMessage);
        sendMessage(JSON.stringify(wsMessage));
        console.log("message sent");
        setChat((prevChat) => [...prevChat, chatMessage]);
      } catch (error) {
        console.error(error);
      }
    }
  }

  // useEffect(() => {}, [chat]);

  useEffect(() => {
    // Get messages for the selected user
    // Set the chat state with the messages

    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [username]);

  if (!Matches || Matches.length === 0) {
    return (
      <VStack gap={4} justifyContent={"center"} alignItems={"center"}>
        <Heading>Match and Chat</Heading>
        <Text>You have no Match</Text>
      </VStack>
    );
  }

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
          {Matches.map((user: Match, index) => (
            <MatchList key={index} userData={user} setUsername={setUsername} />
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
            {chat.map((message, index) => (
              <Message key={index} message={message} username={username} />
            ))}
          </Stack>
          <HStack p={4} bg="gray.100" position="relative">
            <Input
              bg="white"
              placeholder="Enter your text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <Button
              colorScheme="blue"
              onClick={() => handleMessage(newMessage, username)}
            >
              Send
            </Button>
          </HStack>
        </Flex>
      </HStack>
    </VStack>
  );
}

const Message = ({
  message,
  username,
}: {
  message: ChatMessage;
  username: string;
}) => {
  const date = new Date(message.Timestamp); // TODO: fix this
  console.log(date);
  const time = date ? date.toLocaleTimeString() : "";
  console.log(time);
  const isSender =
    message.SenderUsername === username ? Actor.SENDER : Actor.RECEIVER;

  return (
    <VStack
      w="fit-content"
      alignSelf={isSender ? "flex-end" : "flex-start"}
      gap={1}
    >
      <Flex
        py={2}
        px={4}
        bg={isSender ? "blue.500" : "gray.100"}
        color={isSender ? "white" : "gray.600"}
        borderRadius="lg"
        w="fit-content"
      >
        <Text>{message.Message}</Text>
      </Flex>
      <Text
        fontSize="2xs"
        ml={2}
        color="gray.400"
        alignSelf={isSender ? "flex-end" : "flex-start"}
      >
        {time}
      </Text>
    </VStack>
  );
};
