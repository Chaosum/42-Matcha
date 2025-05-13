import {
  createFileRoute,
  ParsedLocation,
  redirect,
} from "@tanstack/react-router";
import { MyRooterContext } from "./__root";
import { getUserToken } from "@/auth.tsx";
import { logger } from "@/lib/logger.ts";

export const Route = createFileRoute("/")({
  component: Index,
  beforeLoad: async ({
    location,
  }: {
    context: MyRooterContext;
    location: ParsedLocation;
  }) => {
    if (!getUserToken()) {
      logger.log("User is not authenticated");
      throw redirect({
        to: "/auth/login",
      });
    } else if (location.pathname !== "/home") {
      logger.log("User is authenticated");
      throw redirect({
        to: "/home",
      });
    }
  },
});

function Index() {
  return <></>;
}
