/** @type {import('next').NextConfig} */
const nextConfig = {
  // Important pour Azure
  output: 'standalone', // Génère un dossier autonome pour le déploiement
  reactStrictMode: true,
  
  // Optimisations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Supprime console.log uniquement en prod
  },
  
  // Configuration API
  env: {
    API_BASE_URL: process.env.API_URL || 'http://localhost:6000'
  },
  
  // Proxy pour éviter les problèmes CORS
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || 'http://localhost:6000'}/api/:path*`
      }
    ]
  }
}

export default nextConfig
