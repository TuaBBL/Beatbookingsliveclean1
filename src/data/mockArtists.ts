export interface Artist {
  id: string;
  name: string;
  role: string;
  genre: string;
  city: string;
  state: string;
  country: string;
  imageUrl: string;
  socials: {
    youtube?: boolean;
    instagram?: boolean;
    facebook?: boolean;
    soundcloud?: boolean;
    spotify?: boolean;
  };
  trending?: number;
  isDemo?: boolean;
  bio?: string;
}

export const mockArtists: Artist[] = [
  {
    id: '1',
    name: 'Neon Pulse',
    role: 'DJ',
    genre: 'Electronic',
    city: 'Sydney',
    state: 'NSW',
    country: 'Australia',
    imageUrl: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=400',
    socials: { youtube: true, instagram: true, spotify: true },
    trending: 1
  },
  {
    id: '2',
    name: 'Bass Empire',
    role: 'Producer',
    genre: 'Bass Music',
    city: 'Melbourne',
    state: 'VIC',
    country: 'Australia',
    imageUrl: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=400',
    socials: { instagram: true, soundcloud: true, spotify: true },
    trending: 2
  },
  {
    id: '3',
    name: 'Aurora Beats',
    role: 'DJ',
    genre: 'House',
    city: 'Brisbane',
    state: 'QLD',
    country: 'Australia',
    imageUrl: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=400',
    socials: { youtube: true, instagram: true, facebook: true, spotify: true },
    trending: 3
  },
  {
    id: '4',
    name: 'Voltage Sound',
    role: 'Live Act',
    genre: 'Techno',
    city: 'Perth',
    state: 'WA',
    country: 'Australia',
    imageUrl: 'https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg?auto=compress&cs=tinysrgb&w=400',
    socials: { instagram: true, soundcloud: true }
  },
  {
    id: '5',
    name: 'Crimson Wave',
    role: 'DJ',
    genre: 'Drum & Bass',
    city: 'Adelaide',
    state: 'SA',
    country: 'Australia',
    imageUrl: 'https://images.pexels.com/photos/2111015/pexels-photo-2111015.jpeg?auto=compress&cs=tinysrgb&w=400',
    socials: { youtube: true, instagram: true, spotify: true }
  },
  {
    id: '6',
    name: 'Echo Chamber',
    role: 'Producer',
    genre: 'Ambient',
    city: 'Gold Coast',
    state: 'QLD',
    country: 'Australia',
    imageUrl: 'https://images.pexels.com/photos/1699161/pexels-photo-1699161.jpeg?auto=compress&cs=tinysrgb&w=400',
    socials: { soundcloud: true, spotify: true }
  },
  {
    id: '7',
    name: 'Riptide Records',
    role: 'DJ',
    genre: 'Trance',
    city: 'Canberra',
    state: 'ACT',
    country: 'Australia',
    imageUrl: 'https://images.pexels.com/photos/1763067/pexels-photo-1763067.jpeg?auto=compress&cs=tinysrgb&w=400',
    socials: { instagram: true, facebook: true, spotify: true }
  },
  {
    id: '8',
    name: 'Static Dreams',
    role: 'Live Act',
    genre: 'Progressive',
    city: 'Hobart',
    state: 'TAS',
    country: 'Australia',
    imageUrl: 'https://images.pexels.com/photos/1644888/pexels-photo-1644888.jpeg?auto=compress&cs=tinysrgb&w=400',
    socials: { youtube: true, instagram: true }
  },
  {
    id: '9',
    name: '频率 Frequency',
    role: 'DJ',
    genre: 'Deep House',
    city: 'Darwin',
    state: 'NT',
    country: 'Australia',
    imageUrl: 'https://images.pexels.com/photos/1864642/pexels-photo-1864642.jpeg?auto=compress&cs=tinysrgb&w=400',
    socials: { instagram: true, spotify: true }
  },
  {
    id: '10',
    name: 'Sonic Drift',
    role: 'Producer',
    genre: 'Dubstep',
    city: 'Newcastle',
    state: 'NSW',
    country: 'Australia',
    imageUrl: 'https://images.pexels.com/photos/1587927/pexels-photo-1587927.jpeg?auto=compress&cs=tinysrgb&w=400',
    socials: { youtube: true, soundcloud: true, spotify: true }
  },
  {
    id: '11',
    name: 'Wave Theory',
    role: 'DJ',
    genre: 'Minimal',
    city: 'Wollongong',
    state: 'NSW',
    country: 'Australia',
    imageUrl: 'https://images.pexels.com/photos/1708912/pexels-photo-1708912.jpeg?auto=compress&cs=tinysrgb&w=400',
    socials: { instagram: true, facebook: true }
  },
  {
    id: '12',
    name: 'Midnight Cascade',
    role: 'Live Act',
    genre: 'Hip Hop',
    city: 'Geelong',
    state: 'VIC',
    country: 'Australia',
    imageUrl: 'https://images.pexels.com/photos/2479312/pexels-photo-2479312.jpeg?auto=compress&cs=tinysrgb&w=400',
    socials: { youtube: true, instagram: true, spotify: true }
  }
];

export const genres = [
  'All Genres',
  'Electronic',
  'House',
  'Techno',
  'Trance',
  'Drum & Bass',
  'Dubstep',
  'Bass Music',
  'Deep House',
  'Progressive',
  'Minimal',
  'Ambient',
  'Hip Hop'
];

export const categories = [
  'All Categories',
  'DJ',
  'Producer',
  'Live Act'
];

export const australianStates = [
  'All States',
  'NSW',
  'VIC',
  'QLD',
  'SA',
  'WA',
  'TAS',
  'NT',
  'ACT'
];
