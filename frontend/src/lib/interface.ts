import { createContext } from "react";

export interface UserProfile {
  username: string;
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

export enum Actor {
  SENDER,
  RECEIVER,
}

export type MessageProps = {
  id: string;
  text: string;
  timestamp: Date;
  actor: Actor;
};

export type ChatMessage = {
  SenderUsername: string;
  ReceiverUsername: string;
  Message: string;
  Timestamp: string;
};

export type Match = {
  username: string;
  name: string;
  imageUrl: string;
};
