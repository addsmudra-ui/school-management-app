
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
    author_id: "rep-3",
    author_name: "Anjali",
    author_role: "Reporter",
    author_stars: 5,
    timestamp: new Date().toISOString(),
    likes: 200,
    commentsCount: 22
  },
  {
    id: "demo-4",
    unique_code: "10024",
    title: "ఆర్మూర్ లో కబడ్డీ పోటీలు ప్రారంభం",
    content: "నిజామాబాద్ జిల్లా ఆర్మూర్ మండల కేంద్రంలో రాష్ట్ర స్థాయి కబడ్డీ పోటీలు ఘనంగా ప్రారంభమయ్యాయి. స్థానిక ఎమ్మెల్యే హాజరయ్యారు.",
    image_url: "https://picsum.photos/seed/sports/800/600",
    location: { state: "Telangana", district: "Nizamabad", mandal: "Armoor" },
    status: "approved",
    author_id: "rep-4",
    author_name: "Naresh",
    author_role: "Reporter",
    author_stars: 2,
    timestamp: new Date().toISOString(),
    likes: 45,
    commentsCount: 2
  },
  {
    id: "demo-5",
    unique_code: "10025",
    title: "వైరా చెరువుకు జలకళ, పర్యాటకుల సందడి",
    content: "ఖమ్మం జిల్లా వైరా చెరువు పూర్తి స్థాయిలో నిండటంతో సందర్శకులు క్యూ కడుతున్నారు. పడవ ప్రయాణం అందరినీ ఆకట్టుకుంటోంది.",
    image_url: "https://picsum.photos/seed/lake/800/600",
    location: { state: "Telangana", district: "Khammam", mandal: "Wyra" },
    status: "approved",
    author_id: "rep-5",
    author_name: "Manasa",
    author_role: "Sr. Reporter",
    author_stars: 4,
    timestamp: new Date().toISOString(),
    likes: 310,
    commentsCount: 18
  },
  {
    id: "demo-6",
    unique_code: "10026",
    title: "జడ్చర్ల ఐటీ పార్కులో కొత్త కంపెనీల రాక",
    content: "మహబూబ్ నగర్ జిల్లా జడ్చర్లలో ఉన్న ఐటీ పార్కుకు మరిన్ని కొత్త పరిశ్రమలు రానున్నాయి. వేలాది మంది యువతకు ఉపాధి లభిస్తుంది.",
    image_url: "https://picsum.photos/seed/tech/800/600",
    location: { state: "Telangana", district: "Mahabubnagar", mandal: "Jadcherla" },
    status: "approved",
    author_id: "rep-6",
    author_name: "Vikas",
    author_role: "Desk Incharge",
    author_stars: 5,
    timestamp: new Date().toISOString(),
    likes: 150,
    commentsCount: 30
  },
  {
    id: "demo-7",
    unique_code: "10027",
    title: "గాజువాకలో పర్యావరణ పరిరక్షణ ర్యాలీ",
    content: "విశాఖపట్నం జిల్లా గాజువాకలో పర్యావరణాన్ని కాపాడదాం అనే నినాదంతో విద్యార్థులు భారీ ర్యాలీ నిర్వహించారు. చెట్లు నాటాలని కోరారు.",
    image_url: "https://picsum.photos/seed/nature/800/600",
    location: { state: "Andhra Pradesh", district: "Visakhapatnam", mandal: "Gajuwaka" },
    status: "approved",
    author_id: "rep-7",
    author_name: "Prasad",
    author_role: "Reporter",
    author_stars: 3,
    timestamp: new Date().toISOString(),
    likes: 92,
    commentsCount: 5
  },
  {
    id: "demo-8",
    unique_code: "10028",
    title: "పటమట రైతు బజార్లో కూరగాయల ధరలు తగ్గుముఖం",
    content: "విజయవాడ పటమట రైతు బజార్లో ఈరోజు కూరగాయల ధరలు సామాన్యులకు అందుబాటులో ఉన్నాయి. వినియోగదారుల రద్దీ పెరిగింది.",
    image_url: "https://picsum.photos/seed/market/800/600",
    location: { state: "Andhra Pradesh", district: "Vijayawada", mandal: "Patamata" },
    status: "approved",
    author_id: "rep-8",
    author_name: "Sandhya",
    author_role: "Reporter",
    author_stars: 4,
    timestamp: new Date().toISOString(),
    likes: 115,
    commentsCount: 8
  },
  {
    id: "demo-9",
    unique_code: "10029",
    title: "అమరావతి రోడ్ల వెడల్పు పనుల పరిశీలన",
    content: "గుంటూరు జిల్లా అమరావతిలో జరుగుతున్న రోడ్ల వెడల్పు పనులను అధికారులు ఈరోజు క్షేత్రస్థాయిలో పరిశీలించి వేగవంతం చేయాలని ఆదేశించారు.",
    image_url: "https://picsum.photos/seed/road/800/600",
    location: { state: "Andhra Pradesh", district: "Guntur", mandal: "Amaravati" },
    status: "approved",
    author_id: "rep-9",
    author_name: "Kalyan",
    author_role: "Sr. Reporter",
    author_stars: 4,
    timestamp: new Date().toISOString(),
    likes: 180,
    commentsCount: 12
  },
  {
    id: "demo-10",
    unique_code: "10030",
    title: "గచ్చిబౌలిలో ఐటీ ఉద్యోగుల రక్తదాన శిబిరం",
    content: "హైదరాబాద్ గచ్చిబౌలి ప్రాంతంలో ఐటీ ఉద్యోగులు స్వచ్ఛందంగా రక్తదాన శిబిరం నిర్వహించారు. సుమారు 500 మంది పాల్గొని రక్తాన్ని అందించారు.",
    image_url: "https://picsum.photos/seed/blood/800/600",
    location: { state: "Telangana", district: "Rangareddy", mandal: "Gachibowli" },
    status: "approved",
    author_id: "rep-10",
    author_name: "Sneha",
    author_role: "Reporter",
    author_stars: 5,
    timestamp: new Date().toISOString(),
    likes: 420,
    commentsCount: 45
  }
];
