import type { Metadata } from "next"
import { SpinningLogo } from "@/components/Logo"
import CopyEmail from "@/components/CopyEmail"
import styles from "./home.module.css"

export const metadata: Metadata = {
  title: "Rodrigo Bondioli · Nexialist Designer",
  description:
    "Rodrigo Bondioli works at the intersection of design and AI, with more than 20 years leading design for startups and global brands.",
  alternates: { canonical: "/" },
}

/**
 * Home — pôster de uma tela só, sem rolagem.
 *
 * Quatro elementos ancorados nos cantos e a marca girando no centro.
 * No Framer isso era um `Main` absoluto em top:174px/left:244px com um
 * padding de 56px que não renderizava nada (todos os filhos eram absolutos).
 * Aqui é um grid de três linhas: topo, centro, base.
 *
 * O bloqueio de rolagem no Framer era um override de JS. Aqui é
 * `overflow: hidden` no próprio layout — não precisa de script pra isso.
 */
export default function HomePage() {
  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <p className={styles.label}>Rodrigo Bondioli</p>
      </header>

      <div className={styles.center}>
        <SpinningLogo size={76} title="Rodrigo Bondioli" />
      </div>

      <footer className={styles.bottom}>
        <p className={`${styles.label} ${styles.bio}`}>
          Rodrigo Bondioli works at the intersection of design and AI, with
          more than 20 years leading design for startups and global brands.
        </p>

        <div className={styles.contact}>
          <p className={styles.label}>Get in touch:</p>
          <CopyEmail
            email="hello@rodrigobondioli.com"
            copiedLabel="Email copied"
            className={styles.label}
          />
        </div>
      </footer>
    </main>
  )
}
