export interface LinkItem {
  id: string;
  url: string;
  icon: 'github' | 'linkedin' | 'globe' | 'file' | 'mail' | 'whatsapp';
  isDownload?: boolean;
}

export const links: LinkItem[] = [
  {
    id: 'github',
    url: 'https://github.com/Thomas-TP',
    icon: 'github',
  },
  {
    id: 'linkedin',
    url: 'https://www.linkedin.com/in/thomas-tp',
    icon: 'linkedin',
  },
  {
    id: 'portfolio',
    url: 'https://thomastp.ch/',
    icon: 'globe',
  },
  {
    id: 'cv',
    url: `${process.env.NODE_ENV === 'production' ? '/links' : ''}/ThomasPrudhommeCV.pdf`,
    icon: 'file',
    isDownload: true,
  },
  {
    id: 'email',
    url: 'mailto:thomas@prudhomme.li',
    icon: 'mail',
  },
  {
    id: 'whatsapp',
    url: 'https://wa.me/41763764551',
    icon: 'whatsapp',
  },
];
