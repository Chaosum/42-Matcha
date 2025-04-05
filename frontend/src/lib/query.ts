import axios, { AxiosError, AxiosResponse } from "axios";
import { getUserToken, setUserToken } from "@/auth.tsx";
import { ToasterError, ToasterSuccess } from "@/lib/toaster.ts";
import { UserProfileFormValue } from "@/routes/_app/profile.edit-info.tsx";
import { Match, Message, Tags, UserProfile } from "@/lib/interface.ts";

axios.defaults.baseURL = "http://localhost:5163";
axios.interceptors.response.use(
  (res: AxiosResponse) => {
    return res; // Simply return the response
  },
  async (err) => {
    const status = err.response ? err.response.status : null;

    if (status === 401) {
      console.log("Unauthorized, logging out...");
      setUserToken(null);
    }

    if (status === 403 && err.response.data) {
      return Promise.reject(err.response.data);
    }

    return Promise.reject(err);
  }
);

export async function GetMeProfile() {
  return await axios
    .get("/UserProfile/Me", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getUserToken(),
      },
    })
    .then((response) => {
      console.log(response.data);
      return response.data as UserProfile;
    })
    .catch((err) => {
      console.log(err);
      if (err.status !== 200) {
        ToasterError("Erreur", "Impossible de récupérer le profil");
      }
      return null;
    });
}

export async function GetUserProfile(username: string) {
  return await axios
    .get("/UserProfile/Get/" + username, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getUserToken(),
      },
    })
    .then((response) => {
      console.log(response.data);
      return response.data as UserProfile;
    })
    .catch((err) => {
      console.log(err);
      if (err.status !== 200) {
        ToasterError("Erreur", "Impossible de récupérer le profil");
      }
      return null;
    });
}

export async function UpdateProfile(data: UserProfileFormValue) {
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
          Authorization: "Bearer " + getUserToken(),
        },
      }
    )
    .then((res) => {
      return res;
    })
    .catch(async (err) => {
      console.log(err);
      return err.response;
    });

  if (profile.status !== 200) {
    return profile;
  }

  return await axios
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
    .then((res) => {
      return res;
    })
    .catch(async (err) => {
      // if (err.status === 401) await auth.logout();
      return err;
    });
}

export async function FetchTagsList(): Promise<Tags[]> {
  try {
    const res = await axios.get("/Tags/GetList", {
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        Authorization: "Bearer " + getUserToken(),
      },
    });
    return res.data as Tags[];
  } catch (err) {
    console.log(err);
    ToasterError("Erreur serveur", "Impossible de récupérer la liste des tags");
    return [];
  }
}

export async function DownloadImage(imageName: string) {
  const formData = new FormData();
  formData.append("imageName", imageName);

  return axios.post("/UserPicture/Get/", formData, {
    headers: {
      Authorization: "Bearer " + getUserToken(),
    },
  });
}

export async function DeleteImage(position: number) {
  return axios.delete("/UserPicture/Delete/" + position, {
    headers: {
      Authorization: "Bearer " + getUserToken(),
    },
  });
}

export async function UploadToServer(file: File, position: number) {
  const formData = new FormData();

  formData.append("Position", position.toString());
  formData.append("Data", file);

  return await axios
    .post("/UserPicture/Upload", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Bearer " + getUserToken(),
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
  return axios
    .get("/UserProfile/UpdateProfileStatus/", {
      headers: {
        Authorization: "Bearer " + getUserToken(),
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

export async function LikeUser(username: string, liked: boolean) {
  return axios
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
    .then(() => {
      return true;
    })
    .catch((err) => {
      ToasterError(err.detail);
      return false;
    });
}

export async function BlockUser(username: string, blocked: boolean) {
  return axios
    .post(
      "/Match/Block/",
      {
        username: username,
        blocked: blocked,
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

export async function GetMatches() {
  return await axios
    .get("/Match/GetList", {
      headers: {
        Authorization: "Bearer " + getUserToken(),
      },
    })
    .then((response: AxiosResponse<Match[]>) => {
      console.log(response.data);
      return response.data;
    })
    .catch((err: AxiosError) => {
      ToasterError(err.message);
      return [] as Match[];
    });
}

export async function GetMessages(username: string) {
  return await axios
    .get("/Chat/GetMessages/" + username, {
      headers: {
        Authorization: "Bearer " + getUserToken(),
      },
    })
    .then((response: AxiosResponse<Message[]>) => {
      console.log(response.data);
      return response.data;
    })
    .catch((err: AxiosError) => {
      ToasterError(err.message);
      return [];
    });
}
