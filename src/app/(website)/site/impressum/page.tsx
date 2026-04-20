import { Metadata } from 'next'
import Link from 'next/link'

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

            <p>
              <Link href="/site/datenschutz">Datenschutzerklärung</Link>
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
