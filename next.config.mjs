/** @type {import('next').NextConfig} */
const nextConfig = {
  // Export estático: gera HTML puro em ./out — sobe em Vercel, Cloudflare, Netlify, qualquer lugar
  output: "export",
  images: {
    // next/image não otimiza em static export; os assets são pré-otimizados no build
    unoptimized: true,
  },
  trailingSlash: false,
}
export default nextConfig
