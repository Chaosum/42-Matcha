import axios, {AxiosError} from "axios";
import {useNavigate} from "@tanstack/react-router";
import {getUserToken, setUserToken} from "@/auth.tsx";
import {ToasterError} from "@/lib/toaster.ts";
import {useEffect, useRef} from "react";
import {logger} from "@/lib/logger.ts";

export const instance = axios.create({
  baseURL: "http://localhost:5163",
});

export const ResponseInterceptor = () => {
  const navigate = useNavigate();
  const interceptorId = useRef<number | null>(null);

  useEffect(() => {
    interceptorId.current = instance.interceptors.response.use(
      undefined,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          logger.log("Unauthorized, logging out...");
          if (getUserToken()) ToasterError("Vous n'êtes pas connecté");
          setUserToken(null);
          await navigate({to: "/auth/login"});
          return Promise.reject();
        }
        logger.log(error);
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
