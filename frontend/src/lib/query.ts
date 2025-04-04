import axios, {AxiosError} from "axios";
import {IAuthContext} from "@/auth.tsx";
import {redirect} from "@tanstack/react-router";
import {ToasterError, ToasterSuccess} from "@/lib/toaster.ts";
import {UserProfileFormValue} from "@/routes/_app/profile.edit-info.tsx";
import {Tags, UserProfile} from "@/lib/interface.ts";

export async function GetMeProfile(auth: IAuthContext) {
  const response = await axios.get("/UserProfile/Me", {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + auth.token,
    },
  });

  console.log(response.data);

  if (response.status === 401) {
    ToasterError("Erreur", "Vous n'êtes pas connecté");
    await auth.logout();
    throw redirect({
      to: "/auth/login",
    });
  }

  if (response.status !== 200) {
    ToasterError("Erreur", "Impossible de récupérer le profil");
    return null;
  }

  return response.data as UserProfile;
}

export async function GetUserProfile(username: string, auth: IAuthContext) {
  const response = await axios.get("/UserProfile/Get/" + username, {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + auth.token,
    },
  });

  if (response.status === 401) {
    ToasterError("Erreur", "Vous n'êtes pas connecté");
    await auth.logout();
    throw redirect({
      to: "/auth/login",
    });
  }

  if (response.status !== 200) {
    ToasterError("Erreur", "Impossible de récupérer le profil");
    return null;
  }

  return response.data as UserProfile;
}

export async function UpdateProfile(
  auth: IAuthContext,
  data: UserProfileFormValue
) {

  const profile = await axios
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
        Authorization: "Bearer " + auth.token,
      },
    }
  )
  .then((res) => {
    return res;
  })
  .catch(async (err) => {
    console.log(err);
    if (err.status === 401) await auth.logout();
    return err.response;
  });

  if (profile.status !== 200) {
    return profile;
  }

  return await axios
  .post(
    "/Tags/Update", {
      tags: data.tags,
    },
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Bearer " + auth.token,
      },
    }
  )
  .then((res) => {
    return res;
  })
  .catch(async (err) => {
    if (err.status === 401) await auth.logout();
    return err;
  });
}

export async function FetchTagsList(auth: IAuthContext): Promise<Tags[]> {
  const token = "Bearer " + auth.token;
  try {
    const res = await axios.get("/Tags/GetList", {
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        Authorization: token,
      },
    });
    return res.data as Tags[];
  } catch (err) {
    if (err.status === 401) await auth.logout();
    console.log(err);
    ToasterError("Erreur serveur", "Impossible de récupérer la liste des tags");
    return [];
  }
}

export async function DownloadImage(imageName: string) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("imageName", imageName);

  return axios
  .post("/UserPicture/Get/", formData, {
    headers: {
      Authorization: "Bearer " + token,
    },
  })
}

export async function DeleteImage(position: number) {
  const token = localStorage.getItem("token");

  return axios
  .delete("/UserPicture/Delete/" + position, {
    headers: {
      Authorization: "Bearer " + token,
    },
  });
}

export async function UploadToServer(file: File, position: number) {
  const formData = new FormData();

  formData.append("Position", position.toString());
  formData.append("Data", file);

  const token = localStorage.getItem("token");

  return await axios
  .post("/UserPicture/Upload", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Bearer " + token,
    },
  })
  .then((result) => {
    console.log(result);
    ToasterSuccess("Image uploaded successfully");
    return result.data;
  })
  .catch((error: AxiosError<string>) => {
    if (error.response) ToasterError(error.response.data);
    else ToasterError("An error occured");
    return null;
  });
}

export async function ValidateProfile() {
  const token = localStorage.getItem("token");

  return axios
  .get("/UserProfile/UpdateProfileStatus/", {
    headers: {
      Authorization: "Bearer " + token,
    },
  })
  .then((response) => {
    ToasterSuccess(response.data);
    return true;
  })
  .catch((err) => {
    ToasterError(err.detail);
    return false;
  });
}

export type FiltersModel = {
  id: string;
  range: number;
  ageGap: number;
  distanceGap: number;
  fameGap: number;
  sortBy: string;
  resultOffset: number;
  resultLimit: number;
};

export async function Dating(params: FiltersModel, authToken: string) {
  try {
    // Effectuer l'appel à l'API avec POST et les bons headers
    const response = await axios.post(
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
      console.log("Profiles matching filters: ", response.data);
      return response.data; // Retourner les profils récupérés
    } else {
      console.error("Failed to retrieve profiles.");
      return null;
    }
  } catch (error) {
    console.error("Error during API call", error);
    return null; // Retourner null en cas d'erreur
  }
}