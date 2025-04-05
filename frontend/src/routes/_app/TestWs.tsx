import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import { Button } from "@/components/ui/button.tsx";
import { getUserToken } from "@/auth.tsx";

export const Route = createFileRoute("/_app/TestWs")({
  component: RouteComponent,
});

function RouteComponent() {
  const [receiverId, setReceiverId] = useState("");

  const handleChange = (event) => {
    setReceiverId(event.target.value);
  };

  const { sendMessage, lastMessage, readyState } = useWebSocket(
    "ws://localhost:5163/ws",
    {
      heartbeat: {
        returnMessage: "pong",
        timeout: 60000, // 1 minute, if no response is received, the connection will be closed
        interval: 25000, // every 25 seconds, a ping message will be sent
      },
      shouldReconnect: (closeEvent) => true,
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
        console.log("message received: ", event.data);
        const message = JSON.parse(event.data);
      },
    }
  );

  useEffect(() => {}, []);

  function handleMessage(message: string, receiverUsername: string) {
    if (readyState === 1) {
      const chatMessage: ChatMessage = {
        ReceiverUsername: receiverUsername,
        Message: message,
        Timestamp: Date.now().toString(),
      };

      const wsMessage = {
        Message: "chat",
        Data: chatMessage,
      };

      try {
        console.log("sending message: ", wsMessage);
        sendMessage(JSON.stringify(wsMessage));
        console.log("message sent");
      } catch (error) {
        console.error(error);
      }
    }
  }

  return (
    <>
      <div>Hello "/_app/TestWs"!</div>
      <div>WebSocket status: {readyState}</div>
      <div>Last message: {lastMessage?.data}</div>
      <input
        type="text"
        id="receiverId"
        name="receiverId"
        onChange={handleChange}
        value={receiverId}
      />
      <Button
        onClick={() => handleMessage("Test message hello!", receiverUsername)}
      >
        Send
      </Button>
    </>
  );
}
