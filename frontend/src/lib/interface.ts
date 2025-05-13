import {createContext} from "react";

export interface UserProfile {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  biography: string;
  coordinates: string;
  address: string;
  tags: Array<number>;
  isVerified: boolean;
  profilePercentage: number;
  fameRating: number;
  images: string[];
  gender: number;
  sexualOrientation: number;
  status: number;
  isLiked: boolean;
  isMatched: boolean;
  isBlocked: boolean;
  isBan: boolean;
  isOnline: boolean;
  lastSeen: Date;
}

export interface Tags {
  id: number;
  name: string;
}

export enum ProfileStatus {
  INFO = 0,
  IMAGES = 1,
  COMPLETED = 2,
}

export interface IUserContext {
  profileData: UserProfile;
  setProfileData: (user: UserProfile) => void;
}

export const UserContext = createContext<IUserContext | null>(null);

export type Match = {
  username: string;
  name: string;
  imageUrl: string;
  isOnline: boolean;
};

export enum Actor {
  SENDER,
  RECEIVER,
}

export type History = {
  name: string;
  username: string;
};

export type FiltersModel = {
  range: number;
  ageGap: number;
  distanceGap: number;
  fameGap: number;
  sortBy: string;
  resultOffset: number;
  resultLimit: number;
};

export type LikeResponse = {
  matchStatus: boolean;
  message: string;
}

export interface Profile {
  id: number;
  userName: string;
  firstName: string;
  lastName: string;
  age: number;
  address: string;
  tags: string[];
  distance: number;
  fame: number;
  profileImageUrl: string;
  imgData: string;
}