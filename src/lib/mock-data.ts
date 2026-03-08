export const STATES = ["Telangana", "Andhra Pradesh"];

export const LOCATIONS_BY_STATE: Record<string, Record<string, string[]>> = {
  "Telangana": {
    "Warangal": ["Hanamkonda", "Kazipet", "Inavole", "Wardhannapet", "Dharmasagar"],
    "Hyderabad": ["Ameerpet", "Banjara Hills", "Kukatpally", "Secunderabad", "Mehdipatnam"],
    "Rangareddy": ["Gachibowli", "Madhapur", "Kondapur", "Serilingampally", "Rajendranagar"],
    "Karimnagar": ["Karimnagar", "Thimmapur", "Ganneruvaram", "Choppadandi", "Manakondur"],
    "Nizamabad": ["Nizamabad", "Armoor", "Bodhan", "Balkonda"],
    "Khammam": ["Khammam", "Wyra", "Sathupalli", "Madhira"],
    "Mahabubnagar": ["Mahabubnagar", "Jadcherla", "Devarkadra", "Narayanpet"]
  },
  "Andhra Pradesh": {
    "Visakhapatnam": ["Gajuwaka", "Madhurawada", "Seethammadhara", "Pendurthi"],
    "Vijayawada": ["Patamata", "Governorpet", "Bhavanipuram", "Gunadala"],
    "Guntur": ["Amaravati", "Tenali", "Narasaraopet", "Bapatla"]
  }
};

export const LOCATIONS = {
  ...LOCATIONS_BY_STATE["Telangana"],
  ...LOCATIONS_BY_STATE["Andhra Pradesh"]
};

export type Comment = {
  id: string;
  userName: string;
  text: string;
  timestamp: string;
};

export type ReporterRole = 'Reporter' | 'Sr. Reporter' | 'Desk Incharge';

export type UserProfile = {
  id: string;
  phone: string;
  name: string;
  role: 'user' | 'reporter' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  location?: {
    state: string;
    district: string;
    mandal: string;
  };
  photo?: string;
};

export type NewsPost = {
  id: string;
  unique_code: string;
  title: string;
  content: string;
  image_url: string;
  location: {
    state: string;
    district: string;
    mandal: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  author_id: string;
  author_name: string;
  author_role?: ReporterRole;
  author_stars?: number;
  timestamp: any;
  engagement: {
    likes: number;
    comments: number;
    commentList: Comment[];
  };
};

export const MOCK_USERS: UserProfile[] = [];

export const MOCK_NEWS: NewsPost[] = [];