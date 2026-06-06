import { redirect } from 'next/navigation';

export default function Home() {
  // Przekierowuje każdego, kto wejdzie na adres główny, do Twojego dashboardu lub logowania
  redirect('/login'); 
}