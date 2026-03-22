import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Firebase Studio (Cloud Workstations) లో క్రాస్-ఆరిజిన్ ఎర్రర్స్ రాకుండా ఇది సహాయపడుతుంది
    allowedDevOrigins: [
      '*.cloudworkstations.dev',
      '*.google.com',
    ],
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      // ఒకవేళ మీరు Firebase Storage ఇమేజెస్ వాడుతుంటే వాటి హోస్ట్ నేమ్ కూడా ఇక్కడ యాడ్ చేయండి
    ],
  },
};

export default nextConfig;