import { toaster } from "@/components/ui/toaster.tsx";

export function ToasterError(
  titre: string,
  description?: string,
  duration?: number
) {
  const s = toaster.create({
    type: "error",
    title: titre,
    description: description,
    duration: duration,
    closable: true,
    action: {
      label: "X",
      onClick: () => toaster.remove(s),
    },
  });
}

export function ToasterSuccess(
  title: string,
  description?: string,
  duration: number = 5000
) {
  const s = toaster.create({
    type: "success",
    title: title,
    description: description,
    duration: duration,
    closable: true,
    action: {
      label: "X",
      onClick: () => toaster.remove(s),
    },
  });
}

export function ToasterInfo(
  message: string,
  description?: string,
  duration?: number
) {
  const s = toaster.create({
    type: "info",
    title: message,
    description: description,
    duration: duration,
    action: {
      label: "X",
      onClick: () => toaster.remove(s),
    },
  });
}

export function ToasterWarning(
  title: string,
  description?: string,
  duration?: number
) {
  const s = toaster.create({
    type: "warning",
    title: title,
    description: description,
    duration: duration,
    action: {
      label: "X",
      onClick: () => toaster.remove(s),
    },
  });
}

export function ToasterLoading(title: string, description?: string) {
  return toaster.create({
    type: "loading",
    title: title,
    description: description,
  });
}
