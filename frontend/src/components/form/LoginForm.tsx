import { Button, Input, VStack } from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { UseFormReturn } from "react-hook-form";
import { FormEventHandler } from "react";
import { LoginFormValues } from "@/routes/_auth/auth.login.tsx";

export function LoginForm(props: {
  form: UseFormReturn<LoginFormValues>;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  const { form } = props;
  const errors = form.formState.errors;

  return (
    <form onSubmit={props.onSubmit}>
      <VStack gap="4" align="center" maxW="lg">
        <Field
          label="Username"
          invalid={!!errors.username}
          errorText={errors.username?.message}
        >
          <Input
            {...form.register("username", { required: "Username is required" })}
          />
        </Field>
        <Field
          label="Password"
          invalid={!!errors.password}
          errorText={errors.password?.message}
        >
          <PasswordInput
            {...form.register("password", { required: "Password is required" })}
          />
        </Field>
        <Button type="submit" size="md" cursor="pointer">
          Submit
        </Button>
      </VStack>
    </form>
  );
}
