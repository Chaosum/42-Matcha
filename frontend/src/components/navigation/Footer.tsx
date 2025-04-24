import { Stack, Text, VisuallyHidden } from "@chakra-ui/react";
import { FaGithub } from "react-icons/fa";
import { ReactNode } from "react";
import { useColorModeValue } from "@/components/ui/color-mode.tsx";
import { LinkButton } from "@/components/ui/link-button.tsx";

const SocialButton = ({
  children,
  label,
  href,
}: {
  children: ReactNode;
  label: string;
  href: string;
}) => {
  return (
    <LinkButton
      bg={useColorModeValue("blackAlpha.100", "whiteAlpha.100")}
      rounded={"full"}
      w={8}
      h={8}
      cursor={"pointer"}
      display={"inline-flex"}
      alignItems={"center"}
      justifyContent={"center"}
      transition={"background 0.3s ease"}
      _hover={{
        bg: useColorModeValue("blackAlpha.200", "whiteAlpha.200"),
      }}
      href={href}
    >
      <VisuallyHidden>{label}</VisuallyHidden>
      {children}
    </LinkButton>
  );
};

export default function Footer() {
  return (
    <Stack
      py={4}
      px={8}
      direction={{ base: "column", md: "row" }}
      justifyContent={{ base: "center", md: "space-between" }}
      align={{ base: "center", md: "center" }}
      bg={useColorModeValue("gray.50", "gray.900")}
      color={useColorModeValue("gray.700", "gray.200")}
    >
      <Text>© 2022 Chakra Templates. All rights reserved</Text>
      <SocialButton
        label={"Github"}
        href={"https://github.com/cybattis/42-Matcha"}
      >
        <FaGithub />
      </SocialButton>
    </Stack>
  );
}
