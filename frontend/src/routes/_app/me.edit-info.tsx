import {
  createFileRoute,
  useLoaderData,
  useNavigate,
} from "@tanstack/react-router";
import {ToasterLoading, ToasterSuccess} from "@/lib/toaster.ts";
import {useForm} from "react-hook-form";
import {toaster} from "@/components/ui/toaster.tsx";
import {VStack} from "@chakra-ui/react";
import {EditProfileForm} from "@/components/form/EditProfileForm.tsx";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {ProfileStatus, Tags, UserProfile} from "@/lib/interface.ts";
import {FetchTagsList, GetMeProfile, UpdateProfile} from "@/lib/query.ts";
import {useEffect} from "react";
import {logger} from "@/lib/logger.ts";

export const Route = createFileRoute("/_app/me/edit-info")({
  component: RouteComponent,
  loader: async () => {
    const profile = (await GetMeProfile()) as UserProfile;
    const tags = (await FetchTagsList()) as Tags[];

    return {profile, tags};
  },
});

const formSchema = z.object({
  firstName: z.string().nonempty({
    message: "First name is required",
  }),
  lastName: z.string().nonempty({
    message: "Last name is required",
  }),
  gender: z.number(),
  sexualOrientation: z.number(),
  biography: z.string().nonempty({
    message: "Biography is required",
  }),
  coordinates: z.string(),
  address: z.string().nonempty({
    message: "Address is required",
  }),
  tags: z
  .array(z.number())
  .min(1, {
    message: "At least one tag is required",
  })
  .max(5, {
    message: "Maximum of 5 tags",
  }),
});
export type UserProfileFormValue = z.infer<typeof formSchema>;

function RouteComponent() {
  const navigate = useNavigate({from: Route.fullPath});
  const {profile, tags} = useLoaderData(Route.id) as {
    profile: UserProfile;
    tags: Tags[];
  };

  const form = useForm<UserProfileFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      biography: profile?.biography || "",
      coordinates: profile?.coordinates || "",
      address: profile?.address || "",
      tags: profile?.tags ? Object.values(profile.tags) : [],
      gender: profile?.gender || 1,
      sexualOrientation: profile?.sexualOrientation || 1,
    },
  });

  const onSubmit = form.handleSubmit(async (data: UserProfileFormValue) => {
    const isCreation = profile.status !== ProfileStatus.COMPLETED;

    logger.log(data);

    const t = ToasterLoading(
      "Chargement",
      isCreation
        ? "Création de compte en cours..."
        : "Mise à jour du profil en cours..."
    );
    const result = await UpdateProfile(data);
    toaster.remove(t);

    if (result.status === 200) {
      ToasterSuccess("Profil mis à jour avec succès");
      if (isCreation) await navigate({to: "/me/edit-images"});
      else await navigate({to: "/me/profile"});
    }
  });

  useEffect(() => {
    form.setValue("firstName", profile.firstName);
    form.setValue("lastName", profile.lastName);
    form.setValue("biography", profile.biography);
    form.setValue("coordinates", profile.coordinates);
    form.setValue("address", profile.address);
    form.setValue("tags", Object.values(profile.tags));
    form.setValue("gender", profile.gender || 1);
    form.setValue("sexualOrientation", profile.sexualOrientation || 1);
  }, [profile]);

  return (
    <VStack gap={6} align={"center"}>
      <EditProfileForm
        profile={profile}
        form={form}
        onSubmit={onSubmit}
        tagsData={tags}
      />
    </VStack>
  );
}
