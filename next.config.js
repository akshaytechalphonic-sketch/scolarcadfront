/** @type {import('next').NextConfig} */
module.exports = {
  async rewrites() {
    return [
      {
        source: '/backend-api/:path*',
        destination: 'https://api.demotechalphonic.tech/:path*',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.scholaracad.com',
          },
        ],
        destination: 'https://scholaracad.com/:path*',
        permanent: true,
      },
    ];
  },
};
