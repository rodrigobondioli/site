import ContactForm from "./ContactForm"
import styles from "./ClosingSection.module.css"

/**
 * O fecho do site: a frase, o título grande e o formulário. Vive aqui
 * porque é o mesmo bloco na /work e em cada página de projeto — estava
 * duplicado nos dois, e duplicado ele ia divergir no primeiro ajuste.
 *
 * "Enough about me." vem riscado: a frase se corrige no ar, e é o riscado
 * que faz a virada acontecer em vez de só ser dita.
 */
export default function ClosingSection() {
  return (
    <section className={`section ${styles.closing}`} id="contact">
      <div className={`container ${styles.inner}`}>
        <div className={styles.head}>
          <p className="body-lg">
            <s className={styles.struck}>Enough about me.</s>{" "}
            Let&rsquo;s talk about your next move.
          </p>
          <p className={`h1 ${styles.title}`}>Your next decision.</p>
        </div>
        <ContactForm />
      </div>
    </section>
  )
}
