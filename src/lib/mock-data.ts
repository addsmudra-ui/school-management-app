
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
  timestamp: any;
};

export type ReporterRole = 'Reporter' | 'Sr. Reporter' | 'Desk Incharge';

export type UserProfile = {
  id: string;
  phone?: string;
  email?: string;
  name: string;
  role: 'user' | 'reporter' | 'admin' | 'editor';
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
  visibility?: 'live' | 'hidden';
  rejection_reason?: string;
  author_id: string;
  author_name: string;
  author_role?: ReporterRole;
  author_stars?: number;
  timestamp: any;
  likes: number;
  commentsCount: number;
};

export const MOCK_USERS: UserProfile[] = [];

export const MOCK_NEWS: NewsPost[] = [
  {
    id: "demo-1",
    unique_code: "10021",
    title: "హన్మకొండలో భారీ వర్షాలు, జనజీవనం అస్తవ్యస్తం",
    content: "హన్మకొండ నగరంలో గత రాత్రి కురిసిన భారీ వర్షం కారణంగా లోతట్టు ప్రాంతాలు జలమయమయ్యాయి. అధికారులు సహాయక చర్యలు చేపట్టారు.",
    image_url: "https://picsum.photos/seed/hanamkonda/800/600",
    location: { state: "Telangana", district: "Warangal", mandal: "Hanamkonda" },
    status: "approved",
    visibility: "live",
    author_id: "rep-1",
    author_name: "Suresh Kumar",
    author_role: "Sr. Reporter",
    author_stars: 4,
    timestamp: new Date().toISOString(),
    likes: 120,
    commentsCount: 15
  },
  {
    id: "demo-2",
    unique_code: "10022",
    title: "బంజారాహిల్స్ లో కొత్త ట్రాఫిక్ నిబంధనలు",
    content: "హైదరాబాద్ బంజారాహిల్స్ ప్రాంతంలో ట్రాఫిక్ సమస్యను తగ్గించడానికి పోలీసులు కొత్త రూల్స్ ప్రవేశపెట్టారు. వాహనదారులు గమనించగలరు.",
    image_url: "https://picsum.photos/seed/hyderabad/800/600",
    location: { state: "Telangana", district: "Hyderabad", mandal: "Banjara Hills" },
    status: "approved",
    visibility: "live",
    author_id: "rep-2",
    author_name: "Ravi Teja",
    author_role: "Reporter",
    author_stars: 3,
    timestamp: new Date().toISOString(),
    likes: 85,
    commentsCount: 4
  },
  {
    id: "demo-3",
    unique_code: "10023",
    title: "తిమ్మాపూర్ రైతులకు శుభవార్త, ఎరువుల పంపిణీ",
    content: "కరీంనగర్ జిల్లా తిమ్మాపూర్ మండలంలో రైతులకు సబ్సిడీపై ఎరువుల పంపిణీ కార్యక్రమం ప్రారంభమైంది. వ్యవసాయ అధికారులు పాల్గొన్నారు.",
    image_url: "https://picsum.photos/seed/agriculture/800/600",
    location: { state: "Telangana", district: "Karimnagar", mandal: "Thimmapur" },
    status: "approved",
    visibility: "live",
    author_id: "rep-3",
    author_name: "Anjali",
    author_role: "Reporter",
    author_stars: 5,
    timestamp: new Date().toISOString(),
    likes: 200,
    commentsCount: 22
  }
];
