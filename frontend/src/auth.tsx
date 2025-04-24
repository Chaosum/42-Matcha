import { redirect } from "@tanstack/react-router";

export function getUserToken() {
  return localStorage.getItem("token");
}

export function setUserToken(token: string | null) {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
}

export function logout() {
  setUserToken(null);
  redirect({
    to: "/auth/login",
  });
}
