export const translations = {
  fr: {
    title: "Thomas Prud'homme",
    subtitle: "Apprenti CFC Informaticien",
    subtitleDetail: "Exploitation & Infrastructure · 2ème année",
    location: "Arc lémanique, Suisse",
    available: "Disponible dès juillet 2026",
    links: {
      github: { label: "GitHub", desc: "Mes projets & contributions" },
      linkedin: { label: "LinkedIn", desc: "Mon profil professionnel" },
      portfolio: { label: "Portfolio", desc: "Découvrir mes réalisations" },
      cv: { label: "Curriculum Vitae", desc: "Télécharger mon CV" },
      email: { label: "Email", desc: "Me contacter directement" },
      whatsapp: { label: "WhatsApp", desc: "Discuter sur WhatsApp" },
    },

    githubStats: {
      title: "GitHub",
      repos: "Dépôts publics",
      followers: "Followers",
      following: "Abonnements",
      gists: "Gists publics",
      viewProfile: "Voir le profil",
    },
  },
  en: {
    title: "Thomas Prud'homme",
    subtitle: "IT Apprentice (CFC)",
    subtitleDetail: "Operations & Infrastructure · 2nd year",
    location: "Lake Geneva region, Switzerland",
    available: "Available from July 2026",
    links: {
      github: { label: "GitHub", desc: "My projects & contributions" },
      linkedin: { label: "LinkedIn", desc: "My professional profile" },
      portfolio: { label: "Portfolio", desc: "Explore my work" },
      cv: { label: "Resume", desc: "Download my resume" },
      email: { label: "Email", desc: "Contact me directly" },
      whatsapp: { label: "WhatsApp", desc: "Chat on WhatsApp" },
    },

    githubStats: {
      title: "GitHub",
      repos: "Public repos",
      followers: "Followers",
      following: "Following",
      gists: "Public gists",
      viewProfile: "View profile",
    },
  },
} as const;

export type Locale = keyof typeof translations;
export type Translations = (typeof translations)[Locale];
