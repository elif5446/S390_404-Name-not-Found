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
