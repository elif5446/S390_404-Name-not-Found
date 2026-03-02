const getTodayAt = (hours: number, minutes: number) => {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

const getFromNow = (minutesToAdd: number) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutesToAdd);
  return date.toISOString();
};

export const MOCK_CALENDAR_EVENTS = [
  {
    id: "mock-event-1",
    summary: "COMP 371 - Computer Graphics",
    start: { dateTime: getTodayAt(9, 0) },
    end: { dateTime: getTodayAt(10, 15) },
    location: "SGW MB-S1.230",
    status: "confirmed",
  },
  {
    id: "mock-event-2",
    summary: "COMP 346 - Operating Systems",
    start: { dateTime: getTodayAt(10, 30) },
    end: { dateTime: getTodayAt(11, 45) },
    location: "H 820",
    status: "confirmed",
  },
  {
    id: "mock-event-3",
    summary: "ENGR 202 - Sustainable Development",
    start: { dateTime: getTodayAt(13, 0) },
    end: { dateTime: getTodayAt(14, 15) },
    location: "SGW H-937",
    status: "confirmed",
  },
  {
    id: "mock-event-4",
    summary: "SOEN 357 - UI/UX Design",
    start: { dateTime: getTodayAt(15, 30) },
    end: { dateTime: getTodayAt(17, 0) },
    location: "MB 1.210",
    status: "confirmed",
  },
  {
    id: "mock-event-5",
    summary: "COMP 363 - Databases",
    start: { dateTime: getFromNow(5) },
    end: { dateTime: getFromNow(65) },
    location: "SGW H-937",
    status: "confirmed",
  },
  {
    id: 'mock-event-6',
    summary: 'SOEN 390 - Software Engineering Team Project',
    start: { dateTime: getFromNow(5) },
    end: { dateTime: getFromNow(65) },
    location: 'H-820', 
    status: 'confirmed',
  },
  {
    id: 'mock-event-7',
    summary: 'COMP 346 - Operating Systems',
    start: { dateTime: getFromNow(10) },
    end: { dateTime: getFromNow(70) },
    location: 'SGW MB-S1.230', 
    status: 'confirmed',
  },
  {
    id: 'mock-event-8',
    summary: 'COMP 345 - Advanced C++',
    start: { dateTime: getTodayAt(9, 0) },
    end: { dateTime: getTodayAt(10, 15) },
    location: 'SGW MB-S1.210', 
    status: 'confirmed',
  }
];
