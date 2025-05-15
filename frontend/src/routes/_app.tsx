import {
  createFileRoute,
  Outlet,
  ParsedLocation,
  redirect, useLoaderData,
} from "@tanstack/react-router";
import Navbar from "@/components/navigation/Navbar.tsx";
import {Box} from "@chakra-ui/react";
import {GetMeProfile} from "@/lib/query.ts";
import {ProfileStatus} from "@/lib/interface.ts";
import {getUserToken} from "@/auth.tsx";
import {logger} from "@/lib/logger.ts";

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
  beforeLoad: async () => {
    if (!getUserToken()) {
      throw redirect({
        to: "/auth/login",
      });
    }
  },
  loader: async ({location}: { location: ParsedLocation }) => {
    const profile = await GetMeProfile();
    if (!profile) return;

    const search = new URLSearchParams(location.search);
    logger.log(profile.status);

    if (
      profile.status === ProfileStatus.INFO &&
      location.pathname !== "/me/edit-info"
    ) {
      throw redirect({
        to: "/me/edit-info",
      });
    } else if (
      profile.status === ProfileStatus.IMAGES &&
      location.pathname !== "/me/edit-images"
    ) {
      throw redirect({
        to: "/me/edit-images",
      });
    } else if (
      profile.status === ProfileStatus.COMPLETED &&
      !search.get("fromProfile") &&
      location.pathname === "/me/edit-images"
    ) {
      throw redirect({
        to: "/home",
      });
    }

    return profile;
  },
});

function RouteComponent() {
  return (
    <>
      <Navbar/>
      <Box flexGrow="1" p={5}>
        <Outlet/>
      </Box>
    </>
  );
}
