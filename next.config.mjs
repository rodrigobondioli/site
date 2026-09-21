/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Sem `output: "export"`.
   *
   * O site continua pré-gerado — todas as páginas saem estáticas no build,
   * inclusive as 11 de projeto. O que muda é que agora existe UMA rota de
   * servidor: /api/contact, que manda o formulário por e-mail. Export puro
   * não compila rota nenhuma, e sem ela o formulário dependia do visitante
   * ter cliente de e-mail configurado.
   *
   * Custo disso: o deploy deixa de ser "uma pasta de arquivos" e passa a
   * ser um app Next na Vercel. Na prática, mesmo desempenho.
   */
  images: {
    // as imagens são <img> comuns e já vêm pré-otimizadas do build de assets
    unoptimized: true,
  },
  trailingSlash: false,
}
export default nextConfig
