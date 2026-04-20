import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Datenschutzerklärung – TeamPayer',
  description: 'Datenschutzerklärung und Informationen zum Datenschutz bei TeamPayer.',
  robots: 'noindex, follow',
}

export default function DatenschutzPage() {
  return (
    <>
      <section className="bg-gray-100 py-12">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl font-bold">Datenschutzerklärung</h1>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl prose prose-gray">
            <h2>1. Datenschutz auf einen Blick</h2>
            <h3>Allgemeine Hinweise</h3>
            <p>
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
              personenbezogenen Daten passiert, wenn Sie diese Website besuchen.
              Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
            </p>

            <h3>Datenerfassung auf dieser Website</h3>
            <p>
              <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong>
              <br />
              Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber.
              Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
            </p>

            <h2>2. Hosting</h2>
            <p>Wir hosten die Inhalte unserer Website bei folgendem Anbieter:</p>
            <p>
              Die Server werden in Rechenzentren innerhalb der Europäischen Union betrieben.
              Die Erhebung und Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.
            </p>

            <h2>3. Allgemeine Hinweise und Pflichtinformationen</h2>
            <h3>Datenschutz</h3>
            <p>
              Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst.
              Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der
              gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
            </p>

            <h3>Hinweis zur verantwortlichen Stelle</h3>
            <p>Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
            <p>
              TeamPayer GmbH
              <br />
              Musterstraße 123
              <br />
              10115 Berlin
              <br />
              E-Mail: datenschutz@teampayer.de
            </p>

            <h2>4. Datenerfassung auf dieser Website</h2>
            <h3>Cookies</h3>
            <p>
              Unsere Internetseiten verwenden so genannte „Cookies". Cookies sind kleine
              Datenpakete und richten auf Ihrem Endgerät keinen Schaden an. Sie werden
              entweder vorübergehend für die Dauer einer Sitzung (Session-Cookies) oder
              dauerhaft (permanente Cookies) auf Ihrem Endgerät gespeichert.
            </p>

            <h3>Kontaktformular</h3>
            <p>
              Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre
              Angaben aus dem Anfrageformular inklusive der von Ihnen dort angegebenen
              Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von
              Anschlussfragen bei uns gespeichert.
            </p>

            <h2>5. Ihre Rechte</h2>
            <p>
              Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre
              gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger
              und den Zweck der Datenverarbeitung sowie ein Recht auf Berichtigung,
              Sperrung oder Löschung dieser Daten.
            </p>
            <p>
              Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können
              Sie sich jederzeit an uns wenden.
            </p>

            <hr className="my-12" />

            <p className="text-gray-500 text-sm">Stand: Januar 2026</p>
          </div>
        </div>
      </section>
    </>
  )
}
