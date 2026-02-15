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
