import { AuthUser } from '../../auth/models/auth-user.model';
export interface Profile extends AuthUser {
  id: string;
  name: string;
  initial: string;
  role: string;
  email?: string;
  profileImage?: string;
}

export interface ProfileDetails {
  whereToGo?: string;
  myWork?: string;
  spendTime?: string;
  pets?: string;
  bornDecade?: string;
  school?: string;
  uselessSkill?: string;
  funFact?: string;
  favoriteSong?: string;
  obsessedWith?: string;
  biographyTitle?: string;
  languages?: string;
  whereILive?: string;
  aboutMe?: string;
  profileImage?: string;
}

export interface Trip {
  id: string;
  destination: string;
  checkIn: Date;
  checkOut: Date;
  propertyName: string;
  propertyImage: string;
  status: 'completed' | 'upcoming' | 'cancelled';
}

export interface Connection {
  id: string;
  name: string;
  profileImage?: string;
  initial: string;
  connectedDate: Date;
  mutualConnections: number;
}