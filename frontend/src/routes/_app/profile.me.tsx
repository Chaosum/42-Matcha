import { createFileRoute } from "@tanstack/react-router";
import { UserProfile } from "@/lib/interface.ts";
import { MyRooterContext } from "@/routes/__root.tsx";
import { GetMeProfile } from "@/lib/query.ts";
import { Profile } from "@/components/pages/Profile.tsx";

export const Route = createFileRoute("/_app/profile/me")({
  component: RouteComponent,
  loader: async ({ context }: { context: MyRooterContext }) =>
    await GetMeProfile(context.auth),
});

function RouteComponent() {
  const data = Route.useLoaderData() as UserProfile;
  return <Profile data={data} isMe={true} />;
}
