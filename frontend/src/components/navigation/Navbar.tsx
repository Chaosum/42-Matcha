import {
  Box,
  Button,
  MenuItem,
  Stack,
  MenuRoot,
  MenuTrigger,
  MenuContent,
  Image,
  Grid,
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
import { setUserToken } from "@/auth.tsx";
import {
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { Route } from "@/routes/_app/profile.edit-images.tsx";
import { useContext, useEffect, useState } from "react";
import { DownloadImage } from "@/lib/query.ts";
import { UserContext } from "@/lib/interface.ts";

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

  return (
    <>
      <Box bg={useColorModeValue("gray.100", "gray.900")} px={5} py={2}>
        <Grid templateColumns="repeat(3, 1fr)" gap="6" alignItems={"center"}>
          <Box />
          <AppLogo />
          <Stack direction={"row"} justifyContent={"end"}>
            <DarkModeButton onClick={toggleColorMode} colorMode={colorMode} />
            <NotificationButton />
            <NavbarMenu />
          </Stack>
        </Grid>
      </Box>
    </>
  );
}

function NotificationButton() {
  return (
    <PopoverRoot>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" alignSelf={"center"}>
          <NotificationIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverBody>
          <PopoverTitle>Notifications</PopoverTitle>
        </PopoverBody>
      </PopoverContent>
    </PopoverRoot>
  );
}

const NavbarMenu = () => {
  const navigate = useNavigate({ from: Route.fullPath });
  const image = useContext(UserContext)?.profileData?.images[0];
  const [avatar, setAvatar] = useState<string>("");

  useEffect(() => {
    async function fetchAvatar() {
      if (!image) return;
      return await DownloadImage(image)
        .then((res) => {
          setAvatar(res.data);
        })
        .catch(async (error) => {
          console.error(error);
        });
    }

    fetchAvatar().then();
  }, [image]);

  useEffect(() => {}, [avatar]);

  return (
    <MenuRoot>
      <MenuTrigger asChild position="relative">
        <Button variant="ghost" p="0" w={"40px"} h={"40px"}>
          {avatar ? (
            <Image
              src={avatar}
              alt="Avatar"
              w={"100%"}
              h={"100%"}
              fit={"cover"}
              borderRadius={"full"}
            />
          ) : (
            <DefaultAvatar />
          )}
        </Button>
      </MenuTrigger>
      <MenuContent pos="absolute" top={"56px"} right={"12px"}>
        <MenuItem
          value="Profile"
          onClick={async () => {
            console.log("Navigate to profile");
            await navigate({ to: "/profile/me" });
          }}
        >
          Profile
        </MenuItem>
        <MenuItem
          value="Likes & Views"
          onClick={async () => {
            await navigate({ to: "/likes" });
          }}
        >
          Likes
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
