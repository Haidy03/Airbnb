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
  firstName?: string; 
  lastName?: string;
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
  id: string | number;
  type?: 'Property' | 'Experience';
  status: string;
  totalPrice?: number;
  
  title?: string;
  propertyName?: string;
  propertyTitle?: string;
  experienceTitle?: string;
  destination?: string;
  city?: string;

  imageUrl?: string;
  image?: string;
  propertyImage?: string;
  experienceImage?: string;

  propertyId?: string | number;
  experienceId?: string | number;

  checkIn?: Date | string;
  startDate?: Date | string;
  date?: Date | string;
  
  checkOut?: Date | string;
  endDate?: Date | string;
}

export interface Connection {
  id: string;
  name: string;
  profileImage?: string;
  initial: string;
  connectedDate: Date;
  mutualConnections: number;
}