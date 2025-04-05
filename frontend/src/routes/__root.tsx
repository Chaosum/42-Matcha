import {
  Link,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { Center, Flex, VStack } from "@chakra-ui/react";
import Footer from "@/components/navigation/Footer.tsx";

export interface MyRooterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRooterContext>()({
  component: RootComponent,
  notFoundComponent: () => {
    return (
      <Center w="100%" h="100%">
        <VStack w="100vw">
          <p>Error 404</p>
          <Link to="/">Start Over</Link>
        </VStack>
      </Center>
    );
  },
  errorComponent: ({ error }) => {
    return (
      <Center w="100%" h="100%">
        <VStack>
          <p>Error: {error.message}</p>
          <Link to="/">Start Over</Link>
        </VStack>
      </Center>
    );
  },
});

function RootComponent() {
  return (
    <Flex direction="column" h={"100vh"} w={"100vw"}>
      <Outlet />
      <ReactQueryDevtools buttonPosition="bottom-left" />
      <TanStackRouterDevtools position="bottom-right" />
      <Footer />
    </Flex>
  );
}
