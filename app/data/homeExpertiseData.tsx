import { ReactNode } from 'react';

interface ExpertiseData {
  title: string;
  description: string;
  backgroundImage: string;
  icon: ReactNode;
}

const expertiseData: ExpertiseData[] = [
  {
    title: "Production Vidéo",
    description: "Captez l'attention avec des vidéos percutantes qui racontent votre histoire.",
    backgroundImage: "/images/expertises/video-bg.jpg",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 md:h-7 md:w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="black"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    title: "Photographie",
    description: "Sublimez votre image avec des photos qui captent l'essence de votre marque.",
    backgroundImage: "/images/expertises/photo-bg.jpg",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 md:h-7 md:w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="black"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        />
      </svg>
    ),
  },
  {
    title: "Stratégie Digitale",
    description: "Gestion de vos réseaux sociaux avec une stratégie cohérente de branding.",
    backgroundImage: "/images/expertises/social-bg.jpg",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 md:h-7 md:w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="black"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    title: "Création Web",
    description: "Démarquez-vous avec des interfaces web et mobile innovantes.",
    backgroundImage: "/images/expertises/web-bg.jpg",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 md:h-7 md:w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="black"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
];

export default expertiseData; 