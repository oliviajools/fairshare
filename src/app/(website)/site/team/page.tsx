import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Wer wir sind – Partner hinter TeamPayer',
  description: 'Die Partnerunternehmen hinter TeamPayer: Deepvelop und Provoid bringen Psychologie und Neurowissenschaft zusammen.',
  openGraph: {
    title: 'Wer wir sind – Partner hinter TeamPayer',
    description: 'Die Partnerunternehmen hinter TeamPayer.',
  },
}

const companies = [
  {
    name: 'Deepvelop',
    url: 'https://deepvelop.de',
    tagline: 'Institut für Sport und Psychologie Hamburg',
    location: 'Hamburg',
    address: 'Bernstorffstraße 174, 22767 Hamburg',
    description: 'Seit 15 Jahren spezialisiert auf Performance-Steigerung durch Mentaltraining. Arbeitet mit Spitzensportlern und Führungskräften, um Potenziale zu entfalten und maximale Kompetenz zu entwickeln.',
    focus: [
      'Rationalität & Intuition verbinden',
      'Persönlichkeitsentwicklung',
      'Mentaltrainer-Ausbildung',
      'ViQ® Persönlichkeitstest',
    ],
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    name: 'Provoid',
    url: 'https://provoid.de',
    tagline: 'Neurowissenschaft für Performance',
    location: 'Hamburg',
    address: 'Eppendorferlandstraße 15, 20249 Hamburg',
    description: 'Übersetzt neurowissenschaftliche Forschung in anwendbare Strategien. Begleitet Unternehmen empathisch und evidenzbasiert, um unterbewusste Prozesse zu verstehen und Conversion zu steigern.',
    focus: [
      'Neurowissenschaftlich fundiert',
      'Neuromarketing',
      'Teamdynamik stärken',
      'Entscheidungsfindung optimieren',
    ],
    color: 'from-violet-500 to-violet-600',
  },
]

export default function TeamPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-sky-400 to-violet-600 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Wer wir sind
            </h1>
            <p className="text-xl text-sky-100 leading-relaxed">
              Psychologie trifft Neurowissenschaft: Die Partner hinter TeamPayer.
            </p>
          </div>
        </div>
      </section>

      {/* Companies Grid */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {companies.map((company) => (
              <div
                key={company.name}
                className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-xl transition-all"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${company.color} flex items-center justify-center mb-6`}>
                  <span className="text-2xl font-bold text-white">{company.name[0]}</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">{company.name}</h3>
                <p className="text-sky-600 font-medium mb-1">{company.tagline}</p>
                <p className="text-gray-500 text-sm mb-1">{company.location}</p>
                <p className="text-gray-400 text-xs mb-4">{company.address}</p>
                <p className="text-gray-600 mb-6">{company.description}</p>
                
                <div className="border-t border-gray-100 pt-6">
                  <h4 className="font-semibold text-sm text-gray-500 mb-3">Schwerpunkte</h4>
                  <ul className="space-y-2">
                    {company.focus.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={company.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-6 text-sky-600 font-medium hover:text-sky-700 transition-colors"
                >
                  Mehr erfahren
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collaboration */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Zusammen für faire Lösungen</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Deepvelop und Provoid vereinen ihre Expertise in Psychologie und Neurowissenschaft, 
            um TeamPayer zu einer App zu machen, die nicht nur funktioniert – sondern Menschen wirklich versteht.
          </p>
          <Link
            href="/site/contact"
            className="bg-sky-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-sky-600 transition-colors inline-flex items-center gap-2"
          >
            Kontakt aufnehmen
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  )
}
