import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Impressum – TeamPayer',
  description: 'Impressum und rechtliche Informationen zu TeamPayer.',
  robots: 'noindex, follow',
}

export default function ImpressumPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gray-100 py-12">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl font-bold">Impressum</h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl prose prose-gray">
            
            <h2>Angaben gemäß § 5 TMG</h2>
            <p>
              TeamPayer GmbH<br />
              Musterstraße 123<br />
              10115 Berlin<br />
              Deutschland
            </p>
            
            <h3>Vertreten durch</h3>
            <p>
              Anna Schmidt (Geschäftsführerin)
            </p>
            
            <h3>Kontakt</h3>
            <p>
              Telefon: +49 (0) 30 123456789<br />
              E-Mail: hello@teampayer.de
            </p>
            
            <h3>Registereintrag</h3>
            <p>
              Eintragung im Handelsregister<br />
              Registergericht: Amtsgericht Berlin-Charlottenburg<br />
              Registernummer: HRB 123456
            </p>
            
            <h3>Umsatzsteuer-ID</h3>
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
              DE123456789
            </p>
            
            <h3>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h3>
            <p>
              Anna Schmidt<br />
              Musterstraße 123<br />
              10115 Berlin
            </p>

            <hr className="my-12" />

            <h2 id="datenschutz">Datenschutzerklärung</h2>
            
            <h3>1. Datenschutz auf einen Blick</h3>
            <h4>Allgemeine Hinweise</h4>
            <p>
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren 
              personenbezogenen Daten passiert, wenn Sie diese Website besuchen. 
              Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
            </p>
            
            <h4>Datenerfassung auf dieser Website</h4>
            <p>
              <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br />
              Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. 
              Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
            </p>
            
            <h3>2. Hosting</h3>
            <p>
              Wir hosten die Inhalte unserer Website bei folgendem Anbieter:
            </p>
            <p>
              Die Server werden in Rechenzentren innerhalb der Europäischen Union betrieben. 
              Die Erhebung und Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.
            </p>
            
            <h3>3. Allgemeine Hinweise und Pflichtinformationen</h3>
            <h4>Datenschutz</h4>
            <p>
              Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. 
              Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der 
              gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
            </p>
            
            <h4>Hinweis zur verantwortlichen Stelle</h4>
            <p>
              Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
            </p>
            <p>
              TeamPayer GmbH<br />
              Musterstraße 123<br />
              10115 Berlin<br />
              E-Mail: datenschutz@teampayer.de
            </p>
            
            <h3>4. Datenerfassung auf dieser Website</h3>
            <h4>Cookies</h4>
            <p>
              Unsere Internetseiten verwenden so genannte „Cookies". Cookies sind kleine 
              Datenpakete und richten auf Ihrem Endgerät keinen Schaden an. Sie werden 
              entweder vorübergehend für die Dauer einer Sitzung (Session-Cookies) oder 
              dauerhaft (permanente Cookies) auf Ihrem Endgerät gespeichert.
            </p>
            
            <h4>Kontaktformular</h4>
            <p>
              Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre 
              Angaben aus dem Anfrageformular inklusive der von Ihnen dort angegebenen 
              Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von 
              Anschlussfragen bei uns gespeichert.
            </p>
            
            <h3>5. Ihre Rechte</h3>
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

            <p className="text-gray-500 text-sm">
              Stand: Januar 2026
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
