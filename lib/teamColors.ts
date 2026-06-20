export const teamColors: Record<string, string> = {
  // Europa
  'Türkiye': '#DC143C',
  'Germany': '#eaed10',
  'France': '#0055A4',
  'Spain': '#AA151B',
  'England': '#CE1126',
  'Italy': '#008C45',
  'Portugal': '#FF0000',
  'Netherlands': '#e8840b',
  'Belgium': '#E6C229',
  'Croatia': '#FF0000',
  'Czechia': '#0095ff',
  'Bosnia & Herzegovina': '#16079f',
  'Scotland': '#2a0996',
  'Switzerland': '#e71e0c',
  'Sweden': '#d1c112',
  'Norway': '#d10a0a',
  // Ameryka Południowa
  'Brazil': '#009B3A',
  'Argentina': '#75AADB',
  'Uruguay': '#66B2FF',
  'Colombia': '#FCD116',
  'Ecuador': '#d8d217',

  // Ameryka Północna i Środkowa
  'USA': '#002868',
  'Mexico': '#006847',
  'Canada': '#FF0000',
  'Paraguay': '#432ca0',
  'Curaçao': '#1f099c',
  'Haiti': '#2a09e9',
  

  // Azja i Afryka
  'Japan': '#BC002D',
  'South Korea': '#d54316',
  'Morocco': '#C1272D',
  'Senegal': '#00853F',
  'Nigeria': '#008751',
  'South Africa': '#c3d711',
  'Qatar': '#3f1313',
  'Australia': '#3309a6',
  'Ivory Coast': '#cb7411',
  'Tunisia': '#d42013',
  'Cape Verde Islands': '#340a9e',
  'Egypt': '#e61b1b',
  'Saudi Arabia': '#085a08',
  'Iran': '#068e2a',
  'New Zealand': '#4119d5',
  'Iraq': '#ef0c0c',

  // Dodaj inne w razie potrzeby:
  'default': '#343638'
};
export const getTeamColor = (teamName: string): string => {
  return teamColors[teamName] || teamColors['default'];
};