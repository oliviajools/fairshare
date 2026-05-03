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
              <strong>Verantwortliche Unternehmen:</strong><br />
              Deepvelop<br />
              Bernstorffstraße 174<br />
              22767 Hamburg<br />
              Deutschland<br /><br />
              PROVOID<br />
              Eppendorferlandstraße 15<br />
              20249 Hamburg<br />
              Deutschland
            </p>

            <h3>Kontakt</h3>
            <p>
              E-Mail: olivia@provoid.de
            </p>

            <h3>EU-Streitschlichtung</h3>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
              <a href="https://ec.europa.eu/consumers/odr/" rel="noopener noreferrer" target="_blank">https://ec.europa.eu/consumers/odr/</a>.
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>

            <h3>Verbraucherstreitbeilegung / Universalschlichtungsstelle</h3>
            <p>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
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
