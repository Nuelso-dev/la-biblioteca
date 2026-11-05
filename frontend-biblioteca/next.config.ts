/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },
  // URLs anteriores: se conservan para que los enlaces guardados y los correos ya enviados sigan funcionando
  async redirects() {
    return [
      { source: '/admin', destination: '/administracion', permanent: true },
      { source: '/admin/:path*', destination: '/administracion/:path*', permanent: true },
      { source: '/faq', destination: '/preguntas-frecuentes', permanent: true },
      { source: '/terminos', destination: '/terminos-y-privacidad', permanent: true },
      { source: '/configuracion', destination: '/mi-cuenta', permanent: true },
      { source: '/login', destination: '/iniciar-sesion', permanent: true },
      { source: '/recuperar-clave', destination: '/recuperar-contrasena', permanent: true },
      { source: '/restablecer-clave', destination: '/nueva-contrasena', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
