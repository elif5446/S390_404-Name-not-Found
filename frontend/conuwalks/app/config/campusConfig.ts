export type Campus = {
  id: string;
  name: string;
  defaultRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
};

export const CAMPUSES: Campus[] = [
  {
    id: 'sgw',
    name: 'SGW Campus',
    defaultRegion: {
      latitude: 45.4972,
      longitude: -73.5789,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    },
  },
  {
    id: 'loyola',
    name: 'Loyola Campus',
    defaultRegion: {
      latitude: 45.4582,
      longitude: -73.6402,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    },
  },
];
