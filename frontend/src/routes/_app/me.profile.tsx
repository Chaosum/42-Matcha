import {createFileRoute} from "@tanstack/react-router";
import {GetMeProfile} from "@/lib/query.ts";
import {UserProfile} from "@/lib/interface.ts";
import {Profile} from "@/components/pages/Profile.tsx";
import {useEffect, useState} from "react";
import {logger} from "@/lib/logger.ts";

export const Route = createFileRoute("/_app/me/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const [data, setData] = useState<UserProfile>(null);

  useEffect(() => {
    GetMeProfile().then((res: UserProfile) => setData(res));
  }, []);

  useEffect(() => {
    logger.log("Data", data);
  }, [data]);

  if (!data) {
    return <></>;
  }

  return <Profile data={data} isMe={true}/>;
}
