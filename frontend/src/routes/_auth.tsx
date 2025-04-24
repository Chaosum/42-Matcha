import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { NavbarAuth } from "@/components/navigation/Navbar.tsx";
import { Box } from "@chakra-ui/react";
import { getUserToken } from "@/auth.tsx";

export const Route = createFileRoute("/_auth")({
  component: RouteComponent,
  beforeLoad: async () => {
    if (getUserToken()) {
      console.info("User is authenticated");
      throw redirect({
        to: "/home",
      });
    }
  },
});

function RouteComponent() {
  return (
    <>
      <NavbarAuth />
      <Box flexGrow="1" p={5}>
        <Outlet />
      </Box>
    </>
  );
}
