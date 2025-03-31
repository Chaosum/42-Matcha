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
