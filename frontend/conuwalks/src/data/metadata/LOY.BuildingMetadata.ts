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

export const LoyolaBuildingMetadata: Record<string, BuildingData> = {
  "VL": {
    name: "Vanier Library Building",
    address: "7141 Sherbrooke St. W.",
    category: "library",
    description: "The Vanier Library (VL) offers collaborative and silent study spaces, 22 learning spaces, and reservable group study rooms across three floors.",
    facilities: ["Accessible entrance", "Accessible building elevator"],
    openingHours: "24 hours"
  },
  "SP": {
    name: "Richard J. Renaud Science Complex",
    address: "7141 Sherbrooke St. W.",
    category: "science",
    description: "The Richard J. Renaud Science Complex (RC) is a state-of-the-art Concordia facility offering teaching spaces, offices, and laboratories for different science departments.",
    facilities: ["Accessible entrance", "Accessible building elevator", "Accessibility ramp"],
    openingHours: { weekdays: defaultWeekday, weekend: defaultWeekend }
  },
  "CJ": {
    name: "Communication Studies and Journalism Building",
    address: "7141 Sherbrooke St. W.",
    category: "arts",
    description: "The Communication Studies and Journalism Building (CJ) houses the Communication Studies and Journalism departments, a bookstore, café, lounge, and specialized media spaces, high-tech classrooms, and computer labs.",
    facilities: ["Accessible entrance", "Accessible building elevator", "Accessibility ramp", "Wheelchair lift"],
    openingHours: { weekdays: defaultWeekday, weekend: defaultWeekend }
  },
  "CC": {
    name: "Central Building",
    address: "7141 Sherbrooke St. W.",
    category: "general",
    description: "The Central Building (CC), a Loyola Campus building, features classrooms, the Guadagni Lounge, and the student-run radio station CJLO.",
    facilities: ["Accessible entrance", "Accessible building elevator", "Wheelchair lift"],
    openingHours: { weekdays: defaultWeekday, weekend: defaultWeekend }
  },
  "AD": {
    name: "Administration Building",
    address: "7141 Sherbrooke St. W.",
    category: "admin",
    description: "The Administration Building (AD), a Loyola Campus building, houses Student Services and Faculty of Arts and Science offices, connecting to the F.C. Smith and Central buildings.",
    facilities: ["Accessible entrance", "Accessible building elevator", "Accessibility ramp", "Parking"],
    openingHours: { weekdays: defaultWeekday, weekend: defaultWeekend }
  },
  "FC": {
    name: "F.C. Smith Building",
    address: "7141 Sherbrooke St. W.",
    category: "general",
    description: "The F.C. Smith Building (FC), a Loyola Campus building, houses the Loyola Chapel, classrooms, and spaces for student life and community events.",
    facilities: ["Accessible entrance", "Accessibility ramp"],
    openingHours: { weekdays: defaultWeekday, weekend: defaultWeekend }
  },
  "HU": {
    name: "Applied Science Hub",
    address: "7141 Sherbrooke St. W.",
    category: "science",
    description: "The Applied Science Hub (HU) is a LEED Gold-certified Concordia facility which includes high-tech labs, collaborative research spaces, and the District 3 Innovation Hub supporting interdisciplinary projects in agriculture, health, sustainability, and engineering.",
    facilities: ["Accessible entrance", "Accessible building elevator"],
    openingHours: { weekdays: defaultWeekday, weekend: defaultWeekend }
  }
};

export const LoyolaBuildingSearchMetadata: Record<string, { name: string; coordinates: LatLng; }> = {
  "VL": {
    name: "Vanier Library Building",
    coordinates: {latitude: 45.45885, longitude: -73.63886}
  },
  "SP": {
    name: "Richard J. Renaud Science Complex",
    coordinates: {latitude: 45.45807, longitude: -73.64158}
  },
  "CJ": {
    name: "Communication Studies and Journalism Building",
    coordinates: {latitude: 45.45732, longitude: -73.63984}
  },
  "CC": {
    name: "Central Building",
    coordinates: {latitude: 45.45827, longitude: -73.64024}
  },
  "AD": {
    name: "Administration Building",
    coordinates: {latitude: 45.45804, longitude: -73.63982}
  },
  "FC": {
    name: "F.C. Smith Building",
    coordinates: {latitude: 45.45804, longitude: -73.63982}
  },
  "HU": {
    name: "Applied Science Hub",
    coordinates: {latitude: 45.45857, longitude: -73.64183}
  },
  "BB": {
    name: "BB Annex",
    coordinates: {latitude: 45.45976, longitude: -73.63917}
  },
  "BH": {
    name: "BH Annex",
    coordinates: {latitude: 45.45971, longitude: -73.63917}
  },
  "DO": {
    name: "Stinger Dome",
    coordinates: {latitude: 45.45751, longitude: -73.63692}
  },
  "GE": {
    name: "Centre for Structural and Functional Genomics",
    coordinates: {latitude: 45.45700, longitude: -73.64042}
  },
  "HA": {
    name: "Hingston Hall, wing HA",
    coordinates: {latitude: 45.45931, longitude: -73.64171}
  },
  "HB": {
    name: "Hingston Hall, wing HB",
    coordinates: {latitude: 45.45931, longitude: -73.64171}
  },
  "HC": {
    name: "Hingston Hall, wing HC",
    coordinates: {latitude: 45.45931, longitude: -73.64171}
  },
  "JR": {
    name: "Jesuit Residence",
    coordinates: {latitude: 45.45804, longitude: -73.63982}
  },
  "PC": {
    name: "PERFORM Centre",
    coordinates: {latitude: 45.45705, longitude: -73.63822}
  },
  "PS": {
    name: "Physical Services Building",
    coordinates: {latitude: 45.45804, longitude: -73.63982}
  },
  "PT": {
    name: "Oscar Peterson Concert Hall",
    coordinates: {latitude: 45.45883, longitude: -73.63876}
  },
  "PY": {
    name: "Psychology Building",
    coordinates: {latitude: 45.45914, longitude: -73.64039}
  },
  "QA": {
    name: "Quadrangle",
    coordinates: {latitude: 45.45804, longitude: -73.63982}
  },
  "RA": {
    name: "Recreation and Athletics Complex",
    coordinates: {latitude: 45.45705, longitude: -73.63822}
  },
  "RF": {
    name: "Loyola Jesuit Hall and Conference Centre",
    coordinates: {latitude: 45.45869, longitude: -73.64111}
  },
  "SC": {
    name: "Student Centre",
    coordinates: {latitude: 45.45948, longitude: -73.63943}
  },
  "SH": {
    name: "Future Buildings Laboratory",
    coordinates: {latitude: 45.45804, longitude: -73.63982}
  },
  "SI": {
    name: "St. Ignatius of Loyola Church",
    coordinates: {latitude: 45.45771, longitude: -73.64247}
  },
  "TA": {
    name: "Terrebonne Building",
    coordinates: {latitude: 45.46002, longitude: -73.64099}
  },
  "VE": {
    name: "Vanier Extension",
    coordinates: {latitude: 45.45885, longitude: -73.63886}
  }
}