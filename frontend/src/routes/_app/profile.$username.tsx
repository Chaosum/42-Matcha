import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AddToHistory, CheckIsMe, GetUserProfile } from "@/lib/query.ts";
import { Profile } from "@/components/pages/Profile.tsx";
import { UserProfile } from "@/lib/interface.ts";
import { Center, VStack } from "@chakra-ui/react";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/profile/$username")({
  component: RouteComponent,
  beforeLoad: async ({ params }: { params: never }) => {
    const { username } = params as { username: string };

    if (await CheckIsMe(username)) {
      throw redirect({
        to: "/me/profile",
      });
    }
  },
  loader: async ({ params }: { params: never }) => {
    const { username } = params as { username: string };

    console.log("Loading profile for ", username);
    const profile = await GetUserProfile(username);
    if (!profile) return null;

    await AddToHistory(username);
    return profile;
  },
});

function RouteComponent() {
  const data = Route.useLoaderData() as UserProfile;

  useEffect(() => {}, [data]);

  if (!data) {
    return (
      <Center w="100%" h="100%">
        <VStack>
          <p>User not found</p>
          <Link to="/">Start Over</Link>
        </VStack>
      </Center>
    );
  }
  return <Profile data={data} isMe={false} />;
}
