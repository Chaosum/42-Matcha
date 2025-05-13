import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/me_")({
  component: RouteComponent,
});

function RouteComponent() {
  return <></>;
}
