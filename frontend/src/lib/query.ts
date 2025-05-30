import {AxiosError, AxiosResponse} from "axios";
import {getUserToken} from "@/auth.tsx";
import {ToasterError, ToasterSuccess} from "@/lib/toaster.ts";
import {UserProfileFormValue} from "@/routes/_app/me.edit-info.tsx";
import {
  FiltersModel,
  LikeResponse,
  Match,
  Tags,
  UserProfile,
} from "@/lib/interface.ts";
import {instance} from "@/lib/useAxios.ts";
import {logger} from "@/lib/logger.ts";

export async function GetMeProfile() {
  logger.log("GetMeProfile");
  return await instance
  .get("/UserProfile/Me", {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getUserToken(),
    },
  })
  .then((response: AxiosResponse<UserProfile>) => {
    logger.log(response.data);
    return response.data;
  })
  .catch((err: AxiosError) => {
    logger.log(err.code + ": " + err.message);
    return null;
  });
}

export async function GetUserProfile(username: string) {
  logger.log("GetUserProfile", username);

  return await instance
  .get("/UserProfile/Get/" + username, {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getUserToken(),
    },
  })
  .then((response: AxiosResponse<UserProfile>) => {
    logger.log(response.data);
    return response.data;
  })
  .catch((err) => {
    logger.log(err.code + ": " + err.message);
    if (err.status === 404) {
      ToasterError("Utilisateur introuvable");
    }
    return null;
  });
}

export async function CheckIsMe(username: string) {
  return await instance
  .get("/UserProfile/CheckIsMe/" + username, {
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
      Authorization: "Bearer " + getUserToken(),
    },
  })
  .then((response: AxiosResponse) => {
    logger.log(response.data);
    return response.data as boolean;
  })
  .catch((err: AxiosError) => {
    logger.log(err.code + ": " + err.message);
    return true;
  });
}

export async function UpdateProfile(data: UserProfileFormValue) {
  const profile = await instance
  .post(
    "/UserProfile/Update",
    {
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      sexualOrientation: data.sexualOrientation,
      biography: data.biography,
      coordinates: data.coordinates,
      address: data.address,
    },
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Bearer " + getUserToken(),
      },
    }
  )
  .then((res: AxiosResponse) => {
    return res;
  })
  .catch(async (err: AxiosError) => {
    if (err.response) {
      ToasterError("Erreur", err.response.data);
    }
    return err.response;
  });

  if (profile?.status !== 200) {
    return profile;
  }

  return await instance
  .post(
    "/Tags/Update",
    {
      tags: data.tags,
    },
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Bearer " + getUserToken(),
      },
    }
  )
  .then(async (err: AxiosError) => {
    if (err.response) {
      ToasterError("Erreur", err.response.data);
    }
    return err.response;
  })
}

export async function FetchTagsList(): Promise<Tags[]> {
  return await instance
  .get("/Tags/GetList", {
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
      Authorization: "Bearer " + getUserToken(),
    },
  })
  .then((res: AxiosResponse<Tags[]>) => {
    logger.log(res.data);
    return res.data;
  })
  .catch((err: AxiosError) => {
    if (err.response?.status !== 401) {
      ToasterError("Impossible de récupérer la liste des tags");
    }
    return [] as Tags[];
  });
}

export async function DownloadImage(imageName: string) {
  const formData = new FormData();
  formData.append("imageName", imageName);

  return instance.post("/UserPicture/Get/", formData, {
    headers: {
      Authorization: "Bearer " + getUserToken(),
    },
  });
}

export async function DeleteImage(position: number) {
  return instance.delete("/UserPicture/Delete/" + position, {
    headers: {
      Authorization: "Bearer " + getUserToken(),
    },
  });
}

export async function UploadToServer(file: File, position: number) {
  const formData = new FormData();
  formData.append("Position", position.toString());
  formData.append("Data", file);

  return await instance
  .post("/UserPicture/Upload", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Bearer " + getUserToken(),
    },
  })
  .then((result) => {
    logger.log(result);
    ToasterSuccess("Image uploaded successfully");
    return result.data;
  })
  .catch((error: AxiosError<string>) => {
    if (error.status != 401 && error.status != 500)
      ToasterError(error?.response?.data);
    else logger.error(error);
    return "";
  });
}

export async function ValidateProfile() {
  return instance
  .get("/UserProfile/UpdateProfileStatus/", {
    headers: {
      Authorization: "Bearer " + getUserToken(),
    },
  })
  .then((response) => {
    ToasterSuccess(response.data);
    return true;
  })
  .catch((err: AxiosError) => {
    if (err.response?.status === 400) {
      ToasterError("Erreur", err.response.data);
    }
    return false;
  });
}

export async function LikeUser(username: string, liked: boolean) {
  return instance
  .post(
    "/Match/Like/",
    {
      username: username,
      liked: liked,
    },
    {
      headers: {
        Authorization: "Bearer " + getUserToken(),
      },
    }
  )
  .then((res: AxiosResponse<LikeResponse>) => {
    return res.data;
  })
  .catch((err) => {
    ToasterError(err.detail);
    return null;
  });
}

export async function BlockUser(username: string, blocked: boolean) {
  return instance
  .post(
    "/Match/Block/",
    {
      username: username,
      isBlocked: blocked,
    },
    {
      headers: {
        Authorization: "Bearer " + getUserToken(),
      },
    }
  )
  .then(() => {
    return true;
  })
  .catch((err) => {
    ToasterError(err.detail);
    return false;
  });
}

export async function ReportUser(username: string) {
  return instance
  .post(
    "/Match/Report/",
    {
      username: username,
    },
    {
      headers: {
        Authorization: "Bearer " + getUserToken(),
      },
    }
  )
  .then(() => {
    ToasterSuccess("User reported");
    return true;
  })
  .catch((err: AxiosError<string>) => {
    ToasterError(err.response?.data || "An error occured");
    return false;
  });
}

export async function GetMatches() {
  return await instance
  .get("/Match/GetList", {
    headers: {
      Authorization: "Bearer " + getUserToken(),
    },
  })
  .then((response: AxiosResponse<Match[]>) => {
    logger.log(response.data);
    return response.data;
  })
  .catch((err: AxiosError) => {
    ToasterError(err.message);
    return [] as Match[];
  });
}

export async function AddNewTag(tagName: string) {
  const formData = new FormData();
  formData.append("tag", tagName);

  return await instance
  .post("/Tags/AddToList", formData, {
    headers: {
      Authorization: "Bearer " + getUserToken(),
    },
  })
  .then((res) => {
    ToasterSuccess("Tag added successfully");
    return {
      id: res.data as number,
      name: tagName,
    } as Tags;
  })
  .catch((err) => {
    ToasterError(err.response.data);
    return null;
  });
}

export async function AddToHistory(username: string) {
  return await instance
  .get("/History/AddVisite/" + username, {
    headers: {
      Authorization: "Bearer " + getUserToken(),
    },
  })
  .then(() => {
    return true;
  })
  .catch(() => {
    return false;
  });
}

export async function GetHistory() {
  return await instance
  .get("/History/Get", {
    headers: {
      Authorization: "Bearer " + getUserToken(),
    },
  })
  .then((response) => {
    return response.data;
  })
  .catch((err) => {
    ToasterError(err.message);
    return [];
  });
}

export async function UpdateEmail(email: string) {
  const formData = new FormData();
  formData.append("email", email);

  return await instance
  .post("/UserProfile/UpdateEmail", formData, {
    headers: {
      Authorization: "Bearer " + getUserToken(),
    },
  })
  .then(() => {
    ToasterSuccess("Email updated successfully");
    return true;
  })
  .catch((err) => {
    ToasterError(err.message);
    return false;
  });
}

export async function Dating(params: FiltersModel, authToken: string) {
  try {
    // Effectuer l'appel à l'API avec POST et les bons headers
    const response = await instance.post(
      "/App/Dating", // L'URL de ton endpoint
      params, // Le corps de la requête avec les données de FiltersModel
      {
        headers: {
          "Content-Type": "application/json", // Spécifier le type de contenu JSON
          Authorization: `Bearer ${authToken}`, // Passer le token d'authentification dans l'en-tête
        },
      }
    );

    // Vérifier la réponse
    if (response.status === 200) {
      logger.log("Profiles matching filters: ", response.data);
      return response.data; // Retourner les profils récupérés
    } else {
      logger.error("Failed to retrieve profiles.");
      return null;
    }
  } catch (error) {
    return null;
  }
}

export async function VerifyForgottenPassword(id: string) {
  return await instance
  .post("/auth/verifyForgottenPassword/" + id, {})
  .then(() => {
    return true;
  })
  .catch(() => {
    ToasterError("Erreur", "Lien invalide");
    return false;
  });
}

export async function ResetPasswordRequest(id: string, password: string, confirmPassword: string) {
  return await instance
  .post("Auth/ResetPassword/" + id, {
    password: password,
    confirmPassword: confirmPassword,
  }, {
    headers: {
      "Content-Type": "application/json",
    },
  })
  .then((res: AxiosResponse) => {
    return res;
  })
  .catch((err: AxiosError) => {
    return false;
  });
}
