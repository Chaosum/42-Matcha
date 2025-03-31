import { createFileRoute } from "@tanstack/react-router";
import { GetUserProfile } from "@/lib/query.ts";
import { MyRooterContext } from "@/routes/__root.tsx";
import { Profile } from "@/components/pages/Profile.tsx";
import { UserProfile } from "@/lib/interface.ts";

export const Route = createFileRoute("/_app/profile/$username")({
  component: RouteComponent,
  loader: async ({
    context,
    params,
  }: {
    context: MyRooterContext;
    params: never;
  }) => {
    const { username } = params as { username: string };
    return await GetUserProfile(username, context.auth);
  },
});

function RouteComponent() {
  const data = Route.useLoaderData() as UserProfile;
  return <Profile data={data} isMe={false} />;
}
