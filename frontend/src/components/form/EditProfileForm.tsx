import {
  Button,
  CheckboxGroup,
  Field,
  Fieldset,
  Flex,
  HStack,
  Input,
  Stack,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import {Controller, useController, UseFormReturn} from "react-hook-form";
import {FormEventHandler, useEffect, useState} from "react";
import {
  GetAddressFromCoordinates,
  GetCoordinates,
  useCoordinate,
} from "@/lib/useCoordinate.ts";
import {Radio, RadioGroup} from "@/components/ui/radio.tsx";
import {UserProfileFormValue} from "@/routes/_app/me.edit-info.tsx";
import {Tags, UserProfile} from "@/lib/interface.ts";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {AddNewTag, UpdateEmail} from "@/lib/query.ts";

export function EditProfileForm(props: {
  profile: UserProfile;
  form: UseFormReturn<UserProfileFormValue>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  tagsData: Tags[];
}) {
  const {tagsData, form, profile, onSubmit} = props;
  const {control, register, setValue, formState} = form;
  const errors = formState.errors;
  const initCoordinates = useCoordinate();
  const [address, setAddress] = useState<string>("");
  const [newTag, setNewTag] = useState<string>("");
  const [email, setEmail] = useState<string>(profile.email);

  console.log("EditProfileForm", profile.status);

  const tags = useController({
    control,
    name: "tags",
    defaultValue: [],
    rules: {
      validate: (value: number[]) => {
        if (value.length < 1) {
          return "At least one tag is required";
        }
        if (value.length > 5) {
          return "You can't have more than 5 tags";
        }
        return true;
      },
    },
  });

  const invalidTags = !!errors.tags;

  useEffect(() => {
    if (!profile.coordinates) {
      if (!initCoordinates) return;
      console.log("Init coordinates:", initCoordinates);

      if (initCoordinates.access) {
        setValue(
          "coordinates",
          initCoordinates.latitude.toString() +
          "," +
          initCoordinates.longitude.toString()
        );
        GetAddressFromCoordinates(
          initCoordinates.latitude,
          initCoordinates.longitude
        ).then((address) => {
          if (!address) return;
          console.log("Address from coordinates:", address);
          setAddress(address);
        });
      }
    } else {
      setAddress(profile.address);
      setValue("address", profile.address);
      const coordinates = profile.coordinates
      .substring(6, profile.coordinates.length - 2)
      .split(" ");
      setValue("coordinates", coordinates[0] + "," + coordinates[1], {
        shouldValidate: true,
      });
    }
  }, [initCoordinates]);

  useEffect(() => {
    setValue("address", address);
  }, [address]);

  async function addNewTag() {
    if (newTag.length === 0) return;
    const result = await AddNewTag(newTag);
    if (!result) return;
    setNewTag("");
    tagsData.push(result);
  }

  return (
    <form onSubmit={onSubmit}>
      {profile.status !== 0 ? (
        <Flex
          direction={"column"}
          gap={2}
          justifyContent={"left"}
          alignItems={"flex-start"}
          pb={4}
        >
          <div>Email</div>
          <Flex
            direction={"row"}
            gap={2}
            justifyContent={"center"}
            alignItems={"center"}
          >
            <Input
              w={"300px"}
              type={"email"}
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                await UpdateEmail(email);
              }}
            >
              Update
            </Button>
          </Flex>
        </Flex>
      ) : null}
      <VStack gap="4" align="center">
        <Fieldset.Root>
          <Stack gap="5" direction="column" w={"full"}>
            <Fieldset.Content>
              <HStack gap="4">
                <Field.Root required invalid={!!errors.firstName}>
                  <Field.Label>
                    First name
                    <Field.RequiredIndicator/>
                  </Field.Label>
                  <Input {...register("firstName")} />
                  <Field.ErrorText>{errors.firstName?.message}</Field.ErrorText>
                </Field.Root>
                <Field.Root required invalid={!!errors.lastName}>
                  <Field.Label>
                    Last name
                    <Field.RequiredIndicator/>
                  </Field.Label>
                  <Input {...register("lastName")} />
                  <Field.ErrorText>{errors.lastName?.message}</Field.ErrorText>
                </Field.Root>
              </HStack>
              <Controller
                name="gender"
                defaultValue={1}
                control={control}
                render={() => (
                  <RadioGroup defaultValue="1">
                    <HStack gap="6">
                      <Radio value="1">Male</Radio>
                      <Radio value="2">Female</Radio>
                    </HStack>
                  </RadioGroup>
                )}
              />
              <Controller
                name="sexualOrientation"
                control={control}
                defaultValue={1}
                render={() => (
                  <RadioGroup defaultValue="1">
                    <HStack gap="6">
                      <Radio value="1">Hetero</Radio>
                      <Radio value="2">Homo</Radio>
                      <Radio value="3">Bi</Radio>
                    </HStack>
                  </RadioGroup>
                )}
              />
              {profile.status !== 0 ? (
                <Field.Root required invalid={!!errors.coordinates}>
                  <Field.Label>
                    City
                    <Field.RequiredIndicator/>
                  </Field.Label>
                  <Input
                    value={address}
                    onBlur={async () => {
                      if (address != profile.address) {
                        console.log("On blur:", address);
                        const result = await GetCoordinates(address);
                        console.log(
                          result?.latitude.toString() +
                          "," +
                          result?.longitude.toString()
                        );
                        setValue(
                          "coordinates",
                          result?.latitude.toString() +
                          "," +
                          result?.longitude.toString(),
                          {
                            shouldValidate: true,
                          }
                        );
                      }
                    }}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setValue("address", e.target.value, {
                        shouldValidate: true,
                      });
                    }}
                  />
                  <Field.ErrorText>
                    {errors.coordinates?.message}
                  </Field.ErrorText>
                </Field.Root>
              ) : null}
              <Field.Root invalid={!!errors.biography}>
                <Field.Label>Profile bio</Field.Label>
                <Textarea placeholder="I am ..." {...register("biography")} />
                <Field.ErrorText>{errors.biography?.message}</Field.ErrorText>
              </Field.Root>
            </Fieldset.Content>
            <Fieldset.Legend>Tags</Fieldset.Legend>
            <Flex gap={2} alignItems={"center"}>
              <Input
                maxW={"200px"}
                placeholder="Add a tag"
                onChange={(e) => {
                  setNewTag(e.target.value);
                }}
              />
              <Button onClick={() => addNewTag()}>+</Button>
            </Flex>
            <CheckboxGroup
              invalid={invalidTags}
              value={tags.field.value.map((v) => v.toString())}
              onValueChange={(e) => {
                console.log("Tags field value:", e);
                tags.field.onChange(e.map((v) => parseInt(v)));
              }}
              name={tags.field.name}
            >
              <Fieldset.Content>
                <Flex
                  wrap="wrap"
                  maxW={"2xl"}
                  gap={2}
                  justifyContent={"flex-start"}
                >
                  {tagsData.length > 0
                    ? tagsData.map((tag: Tags) => (
                      <Checkbox
                        key={tag.id}
                        value={tag.id.toString()}
                        minW={"100px"}
                      >
                        {tag.name}
                      </Checkbox>
                    ))
                    : null}
                </Flex>
              </Fieldset.Content>
            </CheckboxGroup>
            {invalidTags && (
              <Fieldset.ErrorText>
                {tags.fieldState.error?.message}
              </Fieldset.ErrorText>
            )}
          </Stack>
          <Button type="submit" size="md" cursor="pointer">
            Save
          </Button>
        </Fieldset.Root>
      </VStack>
    </form>
  );
}
