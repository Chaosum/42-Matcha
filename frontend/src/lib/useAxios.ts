import axios, { AxiosError } from "axios";
import { useNavigate } from "@tanstack/react-router";
import { getUserToken, setUserToken } from "@/auth.tsx";
import { ToasterError } from "@/lib/toaster.ts";
import { useEffect, useRef } from "react";

export const instance = axios.create({
  baseURL: "http://localhost:5163",
});

export const ResponseInterceptor = () => {
  const navigate = useNavigate();
  const interceptorId = useRef<number | null>(null);

  useEffect(() => {
    if (navigate === undefined) {
      console.error("useNavigate is undefined");
      return;
    }

    interceptorId.current = instance.interceptors.response.use(
      undefined,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          console.log("Unauthorized, logging out...");
          if (getUserToken()) ToasterError("Vous n'êtes pas connecté");
          setUserToken(null);
          await navigate({ to: "/auth/login" });
          return Promise.reject();
        }
        console.log(error);
        return Promise.reject(error);
      }
    );

    return () => {
      if (interceptorId.current)
        instance.interceptors.response.eject(interceptorId.current);
    };
  }, [navigate]);

  return null;
};
