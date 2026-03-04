import { LatLng } from "react-native-maps";

export type OpeningHours = {
  weekdays: string;
  weekend: string;
} | string;

export interface BuildingData {
  name: string;
  address: string;
  description: string;
  facilities: string[];
  openingHours: OpeningHours;
  category: 'library' | 'science' | 'admin' | 'arts' | 'general';
}
const defaultWeekday = "7:00 AM - 11:00 PM";
const defaultWeekend = "7:00 AM - 9:00 PM";

export const SGWBuildingMetadata: Record<string, BuildingData> = {
  "H": {
    name: "Henry F. Hall Building",
    address: "1455 De Maisonneuve Blvd. W.",
    category: "general",
    description: "The Henry F. Hall Building is a building that belongs to the Concordia University which includes classrooms, engineering and research labs, social science departments, and major student areas.",
    facilities: ["Accessible entrance", "Accessible building elevator", "Metro", "Underground Passage"],
    openingHours: { weekdays: defaultWeekday, weekend: defaultWeekend }
  },
  "LB": {
    name: "J.W. McConnell Building (Webster Library)",
    address: "1400 De Maisonneuve Blvd. W.",
    category: "library",
    description: "The Webster Library is the main library that offers study spaces, loans & returns, technology services, and reservable study rooms for Concordia students.",
    facilities: ["Accessible entrance", "Accessible building elevator", "Parking", "Metro" , "Underground Passage"],
    openingHours: "24 hours"
  },
  "LS": {
    name: "Learning Square",
    address: "1535 De Maisonneuve Blvd. W.",
    category: "general",
    description: "The LS Building is a modern facility that includes eight classrooms, welcoming up to 80 students per classroom.",
    facilities: ["Accessible entrance", "Accessible building elevator", "Accessibility ramp"],
    openingHours: { weekdays: defaultWeekday, weekend: defaultWeekend }
  },
  "EV": {
    name: "Engineering, Computer Science and Visual Arts Integrated Complex",
    address: "1515 Ste-Catherine St. W.",
    category: "science",
    description: "The EV Building contains the faculty Dean's Office, many specialized labs, as well as student areas and classrooms.",
    facilities: ["Accessible entrance", "Accessible building elevator", "Metro" , "Underground Passage"],
    openingHours: { weekdays: defaultWeekday, weekend: defaultWeekend }
  },
  "MB": {
    name: "John Molson Building",
    address: "1450 Guy St.",
    category: "general",
    description: "The JMSB building is a business school, offering many classrooms, study areas, and student services.",
    facilities: ["Accessible entrance", "Accessible building elevator", "Metro", "Underground Passage"],
    openingHours: { weekdays: defaultWeekday, weekend: defaultWeekend }
  },
  "FB": {
    name: "Faubourg Building",
    address: "1250 Guy St.",
    category: "general",
    description: "The Faubourg Building (FB) is a postmodern Concordia Building featuring labs, classrooms, offices, study spaces, student services, and most importantly the Concordia Continuing Education and the Mel Hoppenheim School of Cinema.",
    facilities: ["Accessible entrance", "Accessible building elevator", "Wheelchair lift", "Parking"],
    openingHours: { weekdays: defaultWeekday, weekend: defaultWeekend }
  },
  "FG": {
    name: "Faubourg Ste-Catherine Building",
    address: "1610 Ste-Catherine St. W.",
    category: "general",
    description: "The Faubourg Ste-Catherine Building (FG) features the Department of Education's Student Resource Center, classrooms and some restaurants.",
    facilities: ["Accessible entrance", "Accessible building elevator", "Wheelchair lift", "Accessibility ramp"],
    openingHours: { weekdays: defaultWeekday, weekend: defaultWeekend }
  },
  "CL": {
    name: "CL Annex",
    address: "1665 Ste-Catherine St. W.",
    category: "general",
    description: "The CL Annex (CL) building features classrooms and facilities that support Concordia Continuing Education programs.",
    facilities: ["Accessible entrance", "Accessible building elevator"],
    openingHours: { weekdays: defaultWeekday, weekend: defaultWeekend }
  },
  "GM": {
    name: "Guy-De Maisonneuve Building",
    address: "1550 De Maisonneuve Blvd. W.",
    category: "general",
    description: "The GM building offers many offices, classrooms, studios for Dance, Theatre and Music Departments.",
    facilities: ["Accessible entrance", "Accessible building elevator", "Metro", "Underground Passage"],
    openingHours: { weekdays: defaultWeekday, weekend: defaultWeekend }
  },
  "ER": {
    name: "ER Building",
    address: "2155 Guy St.",
    category: "general",
    description: "The ER Building is a University facility housing academic departments and research centers and institutes.",
    facilities: ["Accessible entrance", "Accessible building elevator", "Accessibility ramp"],
    openingHours: { weekdays: defaultWeekday, weekend: defaultWeekend }
  }
};

export const SGWBuildingSearchMetadata: Record<string, { name: string; coordinates: LatLng; }> = {
  "H": {
    name: "Henry F. Hall Building",
    coordinates: {latitude: 45.49722, longitude: -73.57862}
  },
  "LB": {
    name: "J.W. McConnell Building (Webster Library)",
    coordinates: {latitude: 45.48706, longitude: -73.58936}
  },
  "LS": {
    name: "Learning Square",
    coordinates: {latitude: 45.49612, longitude: -73.57954}
  },
  "EV": {
    name: "Engineering, Computer Science and Visual Arts Integrated Complex",
    coordinates: {latitude: 45.49531, longitude: -73.57783}
  },
  "MB": {
    name: "John Molson Building",
    coordinates: {latitude: 45.49544, longitude: -73.57919}
  },
  "FB": {
    name: "Faubourg Building",
    coordinates: {latitude: 45.49480, longitude: -73.57762}
  },
  "FG": {
    name: "Faubourg Ste-Catherine Building",
    coordinates: {latitude: 45.49428, longitude: -73.57834}
  },
  "CL": {
    name: "CL Annex",
    coordinates: {latitude: 45.49425, longitude: -73.57910}
  },
  "GM": {
    name: "Guy-De Maisonneuve Building",
    coordinates: {latitude: 45.49557, longitude: -73.57823}
  },
  "ER": {
    name: "ER Building",
    coordinates: {latitude: 45.49624, longitude: -73.58013}
  },
  "B": {
    name: "B Annex",
    coordinates: {latitude: 45.49786, longitude: -73.57948}
  },
  "CI": {
    name: "CI Annex",
    coordinates: {latitude: 45.49742, longitude: -73.57993}
  },
  "D": {
    name: "D Annex",
    coordinates: {latitude: 45.49779, longitude: -73.57932}
  },
  "EN": {
    name: "EN Annex",
    coordinates: {latitude: 45.49686, longitude: -73.57956}
  },
  "FA": {
    name: "FA Annex",
    coordinates: {latitude: 45.49683, longitude: -73.57948}
  },
  "GA": {
    name: "Grey Nuns Annex",
    coordinates: {latitude: 45.49397, longitude: -73.57814}
  },
  "GN": {
    name: "Grey Nuns Building",
    coordinates: {latitude: 45.49403, longitude: -73.57642}
  },
  "GS": {
    name: "GS Building",
    coordinates: {latitude: 45.49668, longitude: -73.58119}
  },
  "K": {
    name: "K Annex",
    coordinates: {latitude: 45.49782, longitude: -73.57940}
  },
  "LD": {
    name: "LD Building",
    coordinates: {latitude: 45.49670, longitude: -73.57727}
  },
  "M": {
    name: "M Annex",
    coordinates: {latitude: 45.49735, longitude: -73.57976}
  },
  "MI": {
    name: "MI Annex",
    coordinates: {latitude: 45.49735, longitude: -73.57976}
  },
  "MU": {
    name: "MU Annex",
    coordinates: {latitude: 45.49790, longitude: -73.57955}
  },
  "P": {
    name: "P Annex",
    coordinates: {latitude: 45.49667, longitude: -73.57917}
  },
  "PR": {
    name: "PR Annex",
    coordinates: {latitude: 45.49698, longitude: -73.57983}
  },
  "Q": {
    name: "Q Annex",
    coordinates: {latitude: 45.49663, longitude: -73.57910}
  },
  "R": {
    name: "R Annex",
    coordinates: {latitude: 45.49675, longitude: -73.57938}
  },
  "RR": {
    name: "RR Annex",
    coordinates: {latitude: 45.49673, longitude: -73.57932}
  },
  "S": {
    name: "S Annex",
    coordinates: {latitude: 45.49738, longitude: -73.57984}
  },
  "SB": {
    name: "Samuel Bronfman Building",
    coordinates: {latitude: 45.49658, longitude: -73.58607}
  },
  "T": {
    name: "T Annex",
    coordinates: {latitude: 45.49670, longitude: -73.57924}
  },
  "TD": {
    name: "Toronto-Dominion Building",
    coordinates: {latitude: 45.49516, longitude: -73.57841}
  },
  "V": {
    name: "V Annex",
    coordinates: {latitude: 45.49702, longitude: -73.57991}
  },
  "VA": {
    name: "Visual Arts Building",
    coordinates: {latitude: 45.49552, longitude: -73.57379}
  },
  "X": {
    name: "X Annex",
    coordinates: {latitude: 45.49688, longitude: -73.57967}
  },
  "Z": {
    name: "Z Annex",
    coordinates: {latitude: 45.49693, longitude: -73.57974}
  }
}