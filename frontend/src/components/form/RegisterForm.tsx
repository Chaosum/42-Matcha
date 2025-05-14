import {Button, Input, Stack, Text, VStack} from "@chakra-ui/react";
import {Field} from "@/components/ui/field";
import {PasswordInput} from "@/components/ui/password-input";
import {UseFormReturn} from "react-hook-form";
import {Link} from "@tanstack/react-router";
import {RiArrowRightLine} from "react-icons/ri";
import {FormEventHandler} from "react";
import {RegisterFormValues} from "@/routes/_auth/auth.register.tsx";

export function RegisterForm(props: {
  form: UseFormReturn<RegisterFormValues>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  loading: boolean;
}) {
  const {form} = props;
  const errors = form.formState.errors;

  return (
    <form onSubmit={props.onSubmit}>
      <VStack gap="4" align="center">
        <Stack gap="10" direction="row" w={"full"}>
          <Field
            label="Username"
            invalid={!!errors.username}
            errorText={errors.username?.message}
          >
            <Input
              {...form.register("username", {
                required: "Username is required",
              })}
            />
          </Field>
          <Field
            label="Birthdate"
            invalid={!!errors.birthdate}
            errorText={errors.birthdate?.message}
          >
            <Input
              type="date"
              placeholder="YYYY-MM-DD"
              {...form.register("birthdate", {
                required: "Birthdate is required",
              })}
            />
          </Field>
        </Stack>
        <Stack gap="10" direction="row">
          <Field
            label="Password"
            invalid={!!errors.password}
            errorText={errors.password?.message}
          >
            <PasswordInput
              variant="subtle"
              {...form.register("password", {
                minLength: {
                  value: 8,
                  message: "Password must have at least 8 characters",
                },
                required: "Password is required",
              })}
            />
          </Field>
          <Field
            label="Confirm password"
            invalid={!!errors.confirm_password}
            errorText={errors.confirm_password?.message}
          >
            <PasswordInput
              {...form.register("confirm_password", {
                minLength: {
                  value: 8,
                  message: "Password must have at least 8 characters",
                },
                required: "Password is required",
                validate: (val: string) => {
                  if (form.watch("password") != val) {
                    return "Passwords do not match";
                  }
                },
              })}
            />
          </Field>
        </Stack>
        <Field
          label="Email"
          invalid={!!errors.email}
          errorText={errors.email?.message}
        >
          <Input
            type="email"
            placeholder="me@example.com"
            variant="subtle"
            {...form.register("email", {
              required: "Email is required",
            })}
          />
        </Field>
        <Field
          label="Confirm email"
          invalid={!!errors.confirm_email}
          errorText={errors.confirm_email?.message}
        >
          <Input
            type="email"
            placeholder="me@example.com"
            variant="outline"
            {...form.register("confirm_email", {
              required: "Email is required",
              validate: (val: string) => {
                if (form.watch("email") != val) {
                  return "Email do not match";
                }
              },
            })}
          />
        </Field>
        <Button type="submit" size="md" cursor="pointer" disabled={props.loading}>
          Submit
        </Button>
        <Stack direction="row" align="center">
          <Text justifyContent={"center"}>Already have an account ? </Text>
          <Link to={"/auth/login"} className={"chakra-button"}>
            <Button size="xs" variant="subtle">
              Login <RiArrowRightLine/>
            </Button>
          </Link>
        </Stack>
      </VStack>
    </form>
  );
}
