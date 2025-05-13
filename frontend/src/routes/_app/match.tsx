import { createFileRoute } from "@tanstack/react-router";
import {
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
  useLocaleContext,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { MatchList } from "@/components/MatchList.tsx";
import { Actor, Match } from "@/lib/interface.ts";
import { GetMatches } from "@/lib/query.ts";
import useWebSocket from "react-use-websocket";
import { getUserToken } from "@/auth.tsx";
import { ChatMessage, WsMessage } from "@/lib/websocket.ts";
import { useTheme } from "next-themes";
import { logger } from "@/lib/logger.ts";

export const Route = createFileRoute("/_app/match")({
  component: RouteComponent,
  loader: async () => {
    return await GetMatches();
  },
});

function RouteComponent() {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>();
  const matches = Route.useLoaderData();
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [username, setUsername] = useState<string>(matches[0]?.username || "");
  const [newMessage, setNewMessage] = useState<string>("");
  const [keydown, setKeydown] = useState(false);

  const { sendMessage, readyState } = useWebSocket("ws://localhost:5163/ws", {
    heartbeat: {
      returnMessage: "pong",
      timeout: 60000, // 1 minute, if no response is received, the connection will be closed
      interval: 25000, // every 25 seconds, a ping message will be sent
    },
    shouldReconnect: () => true,
    onOpen: () => {
      logger.log("opened");
      const connection = {
        Message: "connection",
        Data: "Bearer " + getUserToken(),
      };
      sendMessage(JSON.stringify(connection));
    },
    onClose: () => {
      logger.log("closed");
    },
    onMessage: (event) => {
      // logger.log("OnMessage: ", event);
      if (!event.data) return;
      if (event.data === "pong") {
        logger.log("pong");
        return;
      }

      // Parse the incoming message
      const wsMessage = JSON.parse(event.data) as WsMessage;
      if (wsMessage.message === "channel history") {
        logger.log("channel history: ", wsMessage.data);
        const history = wsMessage.data as ChatMessage[];
        setChat(history);
      } else if (wsMessage.message === "chat") {
        const chatMessage = wsMessage.data as ChatMessage;
        logger.log(chatMessage);

        setChat((prevChat) => {
          return [...prevChat, chatMessage];
        });
      }
    },
  });

  function handleMessage(message: string, receiverUsername: string) {
    if (!message || readyState !== 1) return;

    const chatMessage: ChatMessage = {
      receiverUsername: receiverUsername,
      content: message,
      timestamp: new Date(),
    };

    const wsMessage: WsMessage = {
      message: "chat",
      data: chatMessage,
    };

    try {
      logger.log("sending message: ", wsMessage);
      sendMessage(JSON.stringify(wsMessage));
      logger.log("message sent");
      setChat((prevChat) => [...prevChat, chatMessage]);
    } catch (error) {
      console.error(error);
    }
    setNewMessage("");
  }

  useEffect(() => {
    if (username) {
      const channel = {
        Message: "channel",
        Data: username,
      };
      sendMessage(JSON.stringify(channel));
    }
  }, [username]);

  useEffect(() => {
    if (keydown) {
      handleMessage(newMessage, username);
      setKeydown(false);
    }

    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [chat, keydown]);

  if (!matches || matches.length === 0) {
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
          {matches.map((user: Match, index) => (
            <MatchList
              key={index}
              userData={user}
              username={username}
              setUsername={setUsername}
            />
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
            scrollBehavior="auto"
            flex={1}
            ref={messagesEndRef}
          >
            {chat.map((message, index) => (
              <Message key={index} message={message} username={username} />
            ))}
          </Stack>
          <HStack p={4} bg="gray.100" position="relative">
            <Input
              bg={theme.theme === "light" ? "white" : "gray.700"}
              colorScheme="blue"
              placeholder="Enter your text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setKeydown(true);
              }}
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
  const local = useLocaleContext();
  const date = new Date(message.timestamp);
  const time = date ? date.toLocaleTimeString(local.locale) : "";

  const isSender =
    message.receiverUsername !== username ? Actor.SENDER : Actor.RECEIVER;

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
        <Text>{message.content}</Text>
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
