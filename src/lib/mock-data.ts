export const LOCATIONS = {
  Warangal: ["Hanamkonda", "Kazipet", "Inavole", "Wardhannapet", "Dharmasagar"],
  Hyderabad: ["Ameerpet", "Banjara Hills", "Kukatpally", "Secunderabad", "Mehdipatnam"],
  Rangareddy: ["Gachibowli", "Madhapur", "Kondapur", "Serilingampally", "Rajendranagar"],
  Karimnagar: ["Karimnagar", "Thimmapur", "Ganneruvaram", "Choppadandi", "Manakondur"],
  Nizamabad: ["Nizamabad", "Armoor", "Bodhan", "Balkonda", "Dichpally"],
  Khammam: ["Khammam", "Wyra", "Madhira", "Sathupally", "Bonakal"],
  Mahabubnagar: ["Mahabubnagar", "Jadcherla", "Devarkadra", "Badepalle", "Bhoothpur"]
};

export type Comment = {
  id: string;
  userName: string;
  text: string;
  timestamp: string;
};

export type NewsPost = {
  id: string;
  unique_code: string;
  title: string;
  content: string;
  image_url: string;
  location: {
    mandal: string;
    district: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  author_id: string;
  author_name: string;
  timestamp: string;
  engagement: {
    likes: number;
    comments: number;
    commentList: Comment[];
  };
};

export const MOCK_NEWS: NewsPost[] = [
  {
    id: "1",
    unique_code: "54231",
    title: "హన్మకొండలో నూతన స్మార్ట్ పార్క్ ప్రారంభం",
    content: "హన్మకొండ నడిబొడ్డున స్థానిక యంత్రాంగం నూతన గ్రీన్ స్మార్ట్ పార్క్‌ను అధికారికంగా ప్రారంభించింది. ఈ పార్కులో సోలార్ లైటింగ్ మరియు ఆటోమేటెడ్ ఇరిగేషన్ సిస్టమ్స్ ఉన్నాయి, ఇది అన్ని వయసుల నివాసితులకు ఆధునిక వినోద స్థలాన్ని అందిస్తుంది. పర్యావరణ హితమైన సౌకర్యాలతో ఈ పార్కును తీర్చిదిద్దారు.",
    image_url: "https://picsum.photos/seed/hanamkonda/800/600",
    location: { mandal: "Hanamkonda", district: "Warangal" },
    status: "approved",
    author_id: "REP001",
    author_name: "రాహుల్ కుమార్",
    timestamp: new Date().toISOString(),
    engagement: { 
      likes: 125, 
      comments: 2,
      commentList: [
        { id: "c1", userName: "Srinivas", text: "చాలా మంచి వార్త!", timestamp: "10 mins ago" },
        { id: "c2", userName: "Anitha", text: "మా పిల్లలు ఇక్కడ ఆడుకోవడానికి ఇష్టపడతారు.", timestamp: "5 mins ago" }
      ]
    }
  },
  {
    id: "2",
    unique_code: "88293",
    title: "కాజీపేట జంక్షన్ ఆధునీకరణ పనులు ప్రారంభం",
    content: "కాజీపేట రైల్వే జంక్షన్ ఆధునీకరణ పనులు ఈ ఉదయం ప్రారంభమయ్యాయి. ఈ ప్రాజెక్ట్ ప్రయాణీకుల సౌకర్యాలను మెరుగుపరచడం మరియు రాబోయే రెండేళ్లలో మరిన్ని హై-స్పీడ్ రైళ్లను సమర్థవంతంగా నిర్వహించడానికి ప్లాట్‌ఫారమ్ సామర్థ్యాన్ని విస్తరించడం లక్ష్యంగా పెట్టుకుంది. రైల్వే శాఖ భారీ నిధులు కేటాయించింది.",
    image_url: "https://picsum.photos/seed/kazipet/800/600",
    location: { mandal: "Kazipet", district: "Warangal" },
    status: "approved",
    author_id: "REP001",
    author_name: "రాహుల్ కుమార్",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    engagement: { 
      likes: 85, 
      comments: 1,
      commentList: [
        { id: "c3", userName: "Raju", text: "అభివృద్ధి జరుగుతోంది!", timestamp: "1 hour ago" }
      ]
    }
  },
  {
    id: "3",
    unique_code: "12044",
    title: "అమీర్‌పేటలో నిత్యావసర వస్తువుల ధరలు స్థిరం",
    content: "వారాల తరబడి హెచ్చుతగ్గుల తర్వాత, అమీర్‌పేట హోల్‌సేల్ మార్కెట్లలో నిత్యావసర వస్తువుల ధరలు చివరకు స్థిరపడ్డాయి. ఇది పండుగ సీజన్‌కు ముందు స్థానిక వినియోగదారులకు మరియు చిన్న తరహా రిటైలర్లకు ఎంతో ఊరటనిస్తుంది. కూరగాయల ధరలు కూడా తగ్గుముఖం పట్టాయి.",
    image_url: "https://picsum.photos/seed/market/800/600",
    location: { mandal: "Ameerpet", district: "Hyderabad" },
    status: "approved",
    author_id: "REP002",
    author_name: "స్నేహ రెడ్డి",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    engagement: { 
      likes: 230, 
      comments: 0,
      commentList: []
    }
  },
  {
    id: "4",
    unique_code: "33102",
    title: "గచ్చిబౌలిలో సాఫ్ట్‌వేర్ ఇంజనీర్ల కొత్త స్టార్టప్ హబ్",
    content: "గచ్చిబౌలిలో ఐటీ రంగం మరింత విస్తరిస్తోంది. యువ సాఫ్ట్‌వేర్ ఇంజనీర్ల కోసం ప్రత్యేకంగా ఒక నూతన స్టార్టప్ హబ్ ప్రారంభించబడింది. ఇది స్థానిక నిరుద్యోగులకు ఉపాధి అవకాశాలను కల్పిస్తుంది. ప్రభుత్వం కూడా దీనికి పూర్తి మద్దతు ఇస్తోంది.",
    image_url: "https://picsum.photos/seed/startup/800/600",
    location: { mandal: "Gachibowli", district: "Rangareddy" },
    status: "approved",
    author_id: "REP003",
    author_name: "కిరణ్ వర్మ",
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    engagement: { 
      likes: 450, 
      comments: 3,
      commentList: [
        { id: "c4", userName: "Mahesh", text: "అద్భుతమైన అవకాశం!", timestamp: "2 hours ago" },
        { id: "c5", userName: "Kavya", text: "దీని వల్ల చాలా మందికి లాభం కలుగుతుంది.", timestamp: "1 hour ago" }
      ]
    }
  },
  {
    id: "5",
    unique_code: "99120",
    title: "కరీంనగర్‌లో భారీ వర్షాలు - లోతట్టు ప్రాంతాలు జలమయం",
    content: "గత రెండు రోజులుగా కురుస్తున్న భారీ వర్షాల కారణంగా కరీంనగర్ నగరంలోని పలు లోతట్టు ప్రాంతాలు జలమయమయ్యాయి. అధికారులు సహాయక చర్యలు చేపట్టారు. ప్రజలు అప్రమత్తంగా ఉండాలని కలెక్టర్ ఆదేశించారు. చెరువులు అలుగు పోస్తున్నాయి.",
    image_url: "https://picsum.photos/seed/rain/800/600",
    location: { mandal: "Karimnagar", district: "Karimnagar" },
    status: "approved",
    author_id: "REP004",
    author_name: "ప్రసాద్ గౌడ్",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    engagement: { 
      likes: 310, 
      comments: 5,
      commentList: [
        { id: "c6", userName: "Ganesh", text: "అందరూ జాగ్రత్తగా ఉండండి.", timestamp: "3 hours ago" }
      ]
    }
  },
  {
    id: "6",
    unique_code: "22045",
    title: "నిజామాబాద్‌లో ఉచిత వైద్య శిబిరం",
    content: "నిజామాబాద్ జిల్లా కేంద్రంలో స్థానిక స్వచ్ఛంద సంస్థ ఆధ్వర్యంలో రేపు ఉచిత వైద్య శిబిరం నిర్వహించబడుతుంది. నిపుణులైన వైద్యులు పరీక్షలు చేసి మందులు ఉచితంగా పంపిణీ చేస్తారు. గ్రామీణ ప్రజలు ఈ అవకాశాన్ని వినియోగించుకోవాలి.",
    image_url: "https://picsum.photos/seed/medical/800/600",
    location: { mandal: "Nizamabad", district: "Nizamabad" },
    status: "approved",
    author_id: "REP005",
    author_name: "వెంకట్ రావు",
    timestamp: new Date(Date.now() - 18000000).toISOString(),
    engagement: { 
      likes: 190, 
      comments: 2,
      commentList: []
    }
  },
  {
    id: "7",
    unique_code: "77651",
    title: "ఖమ్మంలో వ్యవసాయ అభివృద్ధిపై రైతు వేదిక సమావేశం",
    content: "ఖమ్మం జిల్లా వైరా మండలంలో రైతు వేదిక ఆధ్వర్యంలో ఆధునిక వ్యవసాయ పద్ధతులపై అవగాహన సదస్సు నిర్వహించారు. సాగులో కొత్త మెళకువలు మరియు విత్తనాల ఎంపిక గురించి శాస్త్రవేత్తలు వివరించారు. రైతులు ఉత్సాహంగా పాల్గొన్నారు.",
    image_url: "https://picsum.photos/seed/farming/800/600",
    location: { mandal: "Wyra", district: "Khammam" },
    status: "approved",
    author_id: "REP006",
    author_name: "శివ కుమార్",
    timestamp: new Date(Date.now() - 21600000).toISOString(),
    engagement: { 
      likes: 140, 
      comments: 1,
      commentList: [
        { id: "c7", userName: "Laxman", text: "రైతులకు చాలా ఉపయోగకరం.", timestamp: "5 hours ago" }
      ]
    }
  },
  {
    id: "8",
    unique_code: "44012",
    title: "మహబూబ్‌నగర్‌లో కొత్త టెక్స్‌టైల్ పార్క్ ఏర్పాటు",
    content: "మహబూబ్‌నగర్ జిల్లా జడ్చర్ల మండలంలో ప్రభుత్వం కొత్త టెక్స్‌టైల్ పార్క్ ఏర్పాటుకు రంగం సిద్ధం చేసింది. దీని వల్ల సుమారు 5000 మందికి ప్రత్యక్షంగా మరియు పరోక్షంగా ఉపాధి లభిస్తుంది. స్థానిక చేనేత కార్మికులకు ఇది మంచి వార్త.",
    image_url: "https://picsum.photos/seed/textile/800/600",
    location: { mandal: "Jadcherla", district: "Mahabubnagar" },
    status: "approved",
    author_id: "REP007",
    author_name: "మహేష్ యాదవ్",
    timestamp: new Date(Date.now() - 25200000).toISOString(),
    engagement: { 
      likes: 275, 
      comments: 4,
      commentList: []
    }
  }
];
