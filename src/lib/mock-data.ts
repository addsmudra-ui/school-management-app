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

export const MOCK_USERS: UserProfile[] = [
  {
    id: "REP001",
    phone: "9876543210",
    name: "రాహుల్ కుమార్",
    role: "reporter",
    status: "approved",
    location: { state: "Telangana", district: "Warangal", mandal: "Hanamkonda" }
  }
];

export const MOCK_NEWS: NewsPost[] = [
  {
    id: "1",
    unique_code: "54231",
    title: "హన్మకొండలో నూతన స్మార్ట్ పార్క్ ప్రారంభం",
    content: "హన్మకొండ నడిబొడ్డున స్థానిక యంత్రాంగం నూతన గ్రీన్ స్మార్ట్ పార్క్‌ను అధికారికంగా ప్రారంభించింది. ఈ పార్కులో సోలార్ లైటింగ్ మరియు ఆటోమేటెడ్ ఇరిగేషన్ సిస్టమ్స్ ఉన్నాయి, ఇది అన్ని వయసుల నివాసితులకు ఆధునిక వినోద స్థలాన్ని అందిస్తుంది.",
    image_url: "https://picsum.photos/seed/hanamkonda/800/600",
    location: { state: "Telangana", district: "Warangal", mandal: "Hanamkonda" },
    status: "approved",
    author_id: "REP001",
    author_name: "రాహుల్ కుమార్",
    author_role: "Sr. Reporter",
    author_stars: 4,
    timestamp: new Date().toISOString(),
    engagement: { 
      likes: 125, 
      comments: 2,
      commentList: [
        { id: "c1", userName: "Srinivas", text: "చాలా మంచి వార్త!", timestamp: "10 mins ago" }
      ]
    }
  }
];
