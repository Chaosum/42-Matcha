import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/auth_")({
  component: RouteComponent,
  beforeLoad: async () => {
    redirect({
      to: "/auth/login",
    });
  },
});

function RouteComponent() {
  return <></>;
}
