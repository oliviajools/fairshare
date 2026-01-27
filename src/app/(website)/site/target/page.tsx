import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Home, Plane, Building2, GraduationCap, Heart, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Für wen ist TeamPayer? – Zielgruppen',
  description: 'TeamPayer ist perfekt für WGs, Reisegruppen, Vereine, Firmen und alle, die Kosten fair aufteilen wollen.',
  openGraph: {
    title: 'Für wen ist TeamPayer?',
    description: 'TeamPayer ist perfekt für WGs, Reisegruppen, Vereine und Firmen.',
  },
}

const audiences = [
  {
    icon: Home,
    title: 'WGs & Wohngemeinschaften',
    description: 'Miete, Nebenkosten, Einkäufe – alles fair aufteilen, ohne endlose Diskussionen.',
    examples: ['Stromkosten', 'Internet', 'Gemeinsame Einkäufe', 'Putzplan-Kompensation'],
    color: 'sky',
  },
  {
    icon: Plane,
    title: 'Reisegruppen',
    description: 'Im Urlaub will niemand Buchhalter spielen. TeamPayer übernimmt das.',
    examples: ['Hotelkosten', 'Mietwagen', 'Restaurantbesuche', 'Aktivitäten'],
    color: 'violet',
  },
  {
    icon: Building2,
    title: 'Firmen & Teams',
    description: 'Teamevents, Geschenke für Kollegen, gemeinsame Mittagessen – transparent abrechnen.',
    examples: ['Teamevents', 'Geschenke', 'Büromaterial', 'After-Work'],
    color: 'emerald',
  },
  {
    icon: GraduationCap,
    title: 'Studierende',
    description: 'Knappes Budget, viele Gemeinschaftsaktivitäten – da muss es fair zugehen.',
    examples: ['Lerngruppen-Snacks', 'Semesterfeiern', 'Ausflüge', 'Gruppenprojekte'],
    color: 'amber',
  },
  {
    icon: Heart,
    title: 'Familien',
    description: 'Familientreffen, Geschenke für Oma, gemeinsame Urlaube – ohne Streit.',
    examples: ['Familienurlaub', 'Gemeinsame Geschenke', 'Feiern', 'Betreuungskosten'],
    color: 'rose',
  },
  {
    icon: Users,
    title: 'Vereine & Gruppen',
    description: 'Mitgliedsbeiträge, Events, Anschaffungen – demokratisch entscheiden.',
    examples: ['Vereinsausflüge', 'Equipment', 'Veranstaltungen', 'Spenden'],
    color: 'indigo',
  },
]

const colorClasses: Record<string, { bg: string; text: string; light: string }> = {
  sky: { bg: 'bg-sky-500', text: 'text-sky-600', light: 'bg-sky-100' },
  violet: { bg: 'bg-violet-500', text: 'text-violet-600', light: 'bg-violet-100' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-100' },
  amber: { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-100' },
  rose: { bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-100' },
  indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', light: 'bg-indigo-100' },
}

export default function TargetPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-400 to-amber-600 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Für wen ist TeamPayer?
            </h1>
            <p className="text-xl text-amber-100 leading-relaxed">
              Überall dort, wo Menschen gemeinsam Kosten tragen, 
              ist TeamPayer die Lösung.
            </p>
          </div>
        </div>
      </section>

      {/* Audiences Grid */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {audiences.map((audience) => {
              const colors = colorClasses[audience.color]
              return (
                <div
                  key={audience.title}
                  className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-lg transition-shadow"
                >
                  <div className={`w-14 h-14 ${colors.light} rounded-xl flex items-center justify-center mb-4`}>
                    <audience.icon className={`h-7 w-7 ${colors.text}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{audience.title}</h3>
                  <p className="text-gray-600 mb-4">{audience.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {audience.examples.map((example) => (
                      <span
                        key={example}
                        className={`text-xs px-2 py-1 rounded-full ${colors.light} ${colors.text}`}
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Erkennst du dich wieder?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Dann ist TeamPayer genau das Richtige für dich. 
            Starte jetzt und erlebe, wie einfach Fairness sein kann.
          </p>
          <Link
            href="/register"
            className="bg-amber-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-amber-600 transition-colors inline-flex items-center gap-2"
          >
            Jetzt kostenlos starten
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  )
}
