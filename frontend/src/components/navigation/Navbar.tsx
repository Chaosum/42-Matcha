import {
  Box,
  Button,
  MenuItem,
  Stack,
  MenuRoot,
  MenuTrigger,
  MenuContent,
  Text,
  Grid,
  useLocaleContext,
} from "@chakra-ui/react";
import {
  useColorMode,
  useColorModeValue,
} from "@/components/ui/color-mode.tsx";
import {
  DefaultAvatar,
  MoonIcon,
  NotificationIcon,
  SunIcon,
} from "@/components/Icons.tsx";
import { Link, useNavigate } from "@tanstack/react-router";
import { getUserToken, setUserToken } from "@/auth.tsx";
import {
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { useEffect, useState } from "react";
import { Notification, WsMessage } from "@/lib/websocket.ts";
import useWebSocket from "react-use-websocket";

function AppLogo() {
  return (
    <Box w="100%" display="flex" justifyContent={"center"}>
      <Link to={"/home"} preload={false}>
        MATCHA
      </Link>
    </Box>
  );
}

function DarkModeButton(props: {
  onClick: () => void;
  colorMode: string | undefined;
}) {
  return (
    <Button onClick={props.onClick} variant="ghost" w={"40px"} h={"40px"}>
      {props.colorMode === "light" ? <MoonIcon /> : <SunIcon />}
    </Button>
  );
}

export function NavbarAuth() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <>
      <Box bg={useColorModeValue("gray.100", "gray.900")} px={5} py={2}>
        <Grid templateColumns="repeat(3, 1fr)" gap="6" alignItems={"center"}>
          <Box />
          <AppLogo />
          <Stack direction={"row"} justifyContent={"end"}>
            <DarkModeButton onClick={toggleColorMode} colorMode={colorMode} />
            <Button variant="ghost" p="0" w={"40px"} h={"40px"}>
              <Link to={"/auth/login"} className={"w-full h-full"}>
                <DefaultAvatar />
              </Link>
            </Button>
          </Stack>
        </Grid>
      </Box>
    </>
  );
}

export default function Navbar() {
  const { colorMode, toggleColorMode } = useColorMode();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [ringNotif, setRingNotif] = useState(false);

  useWebSocket("ws://localhost:5163/sse/" + getUserToken(), {
    heartbeat: {
      returnMessage: "pong",
      timeout: 60000, // 1 minute, if no response is received, the connection will be closed
      interval: 25000, // every 25 seconds, a ping message will be sent
    },
    shouldReconnect: () => true,
    onOpen: () => {
      console.log("opened");
    },
    onClose: () => {
      console.log("closed");
    },
    onMessage: (event) => {
      console.log("OnMessage: ", event);
      if (!event.data) return;
      if (event.data === "pong") return;

      // Parse the incoming message
      const wsMessage = JSON.parse(event.data) as WsMessage;
      if (wsMessage.message === "notifications") {
        const newNotifs = wsMessage.data as Notification[];
        setNotifications([...newNotifs]);
      }
      if (wsMessage.message === "new_notification") {
        const notification = wsMessage.data as Notification;
        setNotifications((prevNotifs) => {
          return [notification, ...prevNotifs];
        });
        setRingNotif(true);
      }
    },
  });

  useEffect(() => {
    console.log(notifications);
  }, [notifications]);

  return (
    <>
      <Box bg={useColorModeValue("gray.100", "gray.900")} px={5} py={2}>
        <Grid templateColumns="repeat(3, 1fr)" gap="6" alignItems={"center"}>
          <Box />
          <AppLogo />
          <Stack direction={"row"} justifyContent={"end"}>
            <DarkModeButton onClick={toggleColorMode} colorMode={colorMode} />
            <NotificationButton
              colorMode={colorMode}
              notifications={notifications}
              ringNotif={ringNotif}
              setRingNotif={setRingNotif}
            />
            <NavbarMenu />
          </Stack>
        </Grid>
      </Box>
    </>
  );
}

function NotificationButton({
  notifications,
  ringNotif,
  setRingNotif,
}: {
  colorMode: string | undefined;
  notifications: Notification[];
  ringNotif: boolean;
  setRingNotif: (value: boolean) => void;
}) {
  const local = useLocaleContext();
  const bgContent = useColorModeValue("white", "gray.800");
  const bgNotifications = useColorModeValue("gray.100", "gray.700");
  const bgRing = useColorModeValue("black", "white");

  return (
    <PopoverRoot positioning={{ placement: "bottom-end" }}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          alignSelf={"center"}
          onClick={() => {
            setRingNotif(false);
          }}
        >
          <NotificationIcon color={ringNotif ? "red" : bgRing} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        w={"max-content"}
        maxW={"500px"}
        maxH={"400px"}
        bg={bgContent}
        overflowY="auto"
        scrollBehavior="auto"
      >
        <PopoverArrow />
        <PopoverBody>
          <PopoverTitle p={1}>Notifications</PopoverTitle>
          <Stack gap={2} p={2}>
            {notifications.length > 0 ? (
              notifications.map((notification, index) => {
                const date = new Date(notification.timestamp);
                const time = date ? date.toLocaleTimeString(local.locale) : "";
                return (
                  <Box
                    key={index}
                    p={3}
                    borderWidth={1}
                    borderRadius="md"
                    w={"100%"}
                    bg={bgNotifications}
                  >
                    <Text textStyle={"md"} pb={1}>
                      {notification.content}
                    </Text>
                    <Text textStyle={"xs"}>{time}</Text>
                  </Box>
                );
              })
            ) : (
              <Box p={2}>No notifications</Box>
            )}
          </Stack>
        </PopoverBody>
      </PopoverContent>
    </PopoverRoot>
  );
}

const NavbarMenu = () => {
  const navigate = useNavigate();

  return (
    <MenuRoot>
      <MenuTrigger asChild position="relative">
        <Button variant="ghost" p="0" w={"40px"} h={"40px"}>
          <DefaultAvatar />
        </Button>
      </MenuTrigger>
      <MenuContent pos="absolute" top={"56px"} right={"12px"}>
        <MenuItem
          value="Profile"
          onClick={async () => {
            console.log("Navigate to profile");
            await navigate({ to: "/me/profile" });
          }}
        >
          Profile
        </MenuItem>
        <MenuItem
          value="History"
          onClick={async () => {
            await navigate({ to: "/history" });
          }}
        >
          History
        </MenuItem>
        <MenuItem
          value="Match"
          onClick={async () => {
            await navigate({ to: "/match" });
          }}
        >
          Matches
        </MenuItem>
        <MenuItem
          value="logout"
          onClick={async () => {
            setUserToken(null);
            await navigate({ to: "/auth/login" });
          }}
        >
          Logout
        </MenuItem>
      </MenuContent>
    </MenuRoot>
  );
};
