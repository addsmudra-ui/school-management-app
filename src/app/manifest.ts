export const dynamic = 'force-static';

import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'News Pulse',
    description: 'మీ మండలం మరియు జిల్లా స్థాయి వార్తల కోసం మీ నమ్మకమైన మూలం.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1d4ed8',
    icons: [
      {
        src: 'https://picsum.photos/seed/appicon/192/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: 'https://picsum.photos/seed/appicon-large/512/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
