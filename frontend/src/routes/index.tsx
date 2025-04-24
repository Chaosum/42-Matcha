import {
  createFileRoute,
  ParsedLocation,
  redirect,
} from "@tanstack/react-router";
import { MyRooterContext } from "./__root";
import { getUserToken } from "@/auth.tsx";

export const Route = createFileRoute("/")({
  component: Index,
  beforeLoad: async ({
    location,
  }: {
    context: MyRooterContext;
    location: ParsedLocation;
  }) => {
    console.log("Index layout");
    console.log("Location: ", location);
    if (!getUserToken()) {
      console.log("User is not authenticated");
      throw redirect({
        to: "/auth/login",
      });
    } else if (location.pathname !== "/home") {
      console.log("User is authenticated");
      throw redirect({
        to: "/home",
      });
    }
  },
});

function Index() {
  return <></>;
}
