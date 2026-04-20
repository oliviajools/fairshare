import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Calculator, Sparkles, Users, Vote } from 'lucide-react'

export const metadata: Metadata = {
  title: 'TeamPayer – Faire Kostenverteilung für Teams',
  description: 'Mit TeamPayer verteilst du Kosten fair und demokratisch. Jeder stimmt ab, der Algorithmus berechnet – kein Streit, nur Fairness.',
  keywords: ['Kostenverteilung', 'Team', 'Fair', 'Abstimmung', 'App', 'Gruppenkosten'],
  openGraph: {
    title: 'TeamPayer – Faire Kostenverteilung für Teams',
    description: 'Mit TeamPayer verteilst du Kosten fair und demokratisch.',
    type: 'website',
  },
}

const features = [
  {
    icon: Users,
    title: 'Team einladen',
    description: 'Erstelle eine Session und lade alle Beteiligten per Link ein.',
  },
  {
    icon: Vote,
    title: 'Demokratisch abstimmen',
    description: 'Jeder bewertet anonym, wer wie viel beitragen sollte.',
  },
  {
    icon: Calculator,
    title: 'Automatisch berechnen',
    description: 'Unser Algorithmus ermittelt die fairste Verteilung.',
  },
  {
    icon: Sparkles,
    title: 'Stressfrei teilen',
    description: 'Keine Diskussionen mehr – nur transparente Ergebnisse.',
  },
]

const benefits = [
  {
    title: 'Anonym & fair',
    description: 'Jede Bewertung zählt – ohne Gruppendruck und ohne Diskussionen.',
  },
  {
    title: 'Transparent',
    description: 'Das Ergebnis ist nachvollziehbar, weil der Prozess klar strukturiert ist.',
  },
  {
    title: 'Schnell',
    description: 'In wenigen Minuten von „Was war der Aufwand?“ zur fertigen Verteilung.',
  },
]

const sessionFlow = [
  {
    title: 'Session erstellen',
    description: 'Name, Teilnehmer und optional feste Anteile anlegen.',
  },
  {
    title: 'Link teilen',
    description: 'Alle stimmen im Browser ab – ohne App-Installation.',
  },
  {
    title: 'Bewerten',
    description: 'Jeder schätzt anonym ein, wer wie viel beigetragen hat.',
  },
  {
    title: 'Ergebnis nutzen',
    description: 'TeamPayer berechnet die Verteilung und du kannst direkt auszahlen.',
  },
]

const faqs = [
  {
    q: 'Müssen alle ein Konto anlegen?',
    a: 'Nein. Teilnehmer können per Link abstimmen. Ein Konto ist nur für das Erstellen und Verwalten von Sessions nötig.',
  },
  {
    q: 'Sind die Bewertungen anonym?',
    a: 'Ja. Bewertungen werden so verarbeitet, dass einzelne Stimmen nicht öffentlich zugeordnet werden.',
  },
  {
    q: 'Funktioniert das auch für ungleiche Beträge?',
    a: 'Ja. Du kannst feste Anteile definieren oder gemeinsam vorab festlegen, bevor über den Rest abgestimmt wird.',
  },
  {
    q: 'Kann ich das Ergebnis exportieren?',
    a: 'Ja. Ergebnisse lassen sich speichern und je nach Ansicht auch als Übersicht teilen.',
  },
]

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-sky-400 via-sky-500 to-violet-500 text-white">
        <div className="container mx-auto px-6 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Schluss mit der Frage: <br />
              <span className="text-sky-100">„Wer zahlt wie viel?"</span>
            </h1>
            <p className="text-xl md:text-2xl text-sky-100 mb-8 leading-relaxed">
              TeamPayer macht Kostenverteilung fair, transparent und demokratisch. 
              Alle stimmen ab – der Algorithmus rechnet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="bg-white text-sky-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-sky-50 transition-colors inline-flex items-center justify-center gap-2"
              >
                Jetzt starten
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/site/about"
                className="border-2 border-white/30 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Mehr erfahren
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">So fühlt sich Fairness an</h2>
                <p className="text-gray-600 mb-8">
                  TeamPayer ist für Situationen gemacht, in denen Aufwand schwer messbar ist.
                  Statt endlosen Diskussionen gibt es einen klaren Prozess – und ein Ergebnis, das alle mittragen.
                </p>

                <div className="space-y-4">
                  {benefits.map((b) => (
                    <div key={b.title} className="flex gap-3">
                      <div className="mt-0.5">
                        <CheckCircle2 className="h-5 w-5 text-sky-600" />
                      </div>
                      <div>
                        <div className="font-semibold">{b.title}</div>
                        <div className="text-gray-600 text-sm">{b.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="rounded-xl bg-sky-50 p-5">
                    <div className="text-sky-700 font-semibold">Weniger Reibung</div>
                    <div className="text-gray-600 text-sm mt-1">Klare Schritte, weniger Diskussion.</div>
                  </div>
                  <div className="rounded-xl bg-violet-50 p-5">
                    <div className="text-violet-700 font-semibold">Mehr Akzeptanz</div>
                    <div className="text-gray-600 text-sm mt-1">Weil alle beteiligt sind.</div>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-5">
                    <div className="text-gray-900 font-semibold">Sofort einsetzbar</div>
                    <div className="text-gray-600 text-sm mt-1">Browser-Link statt Setup.</div>
                  </div>
                  <div className="rounded-xl bg-sky-50 p-5">
                    <div className="text-sky-700 font-semibold">Ein Ergebnis</div>
                    <div className="text-gray-600 text-sm mt-1">Automatisch berechnet.</div>
                  </div>
                </div>

                <div className="mt-8">
                  <Link
                    href="/login"
                    className="w-full bg-sky-500 text-white px-6 py-3 rounded-xl text-base font-semibold hover:bg-sky-600 transition-colors inline-flex items-center justify-center gap-2"
                  >
                    Session starten
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Ablauf einer Session</h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Ein klarer Prozess, der für alle verständlich ist – von der Einladung bis zur Auszahlung.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sessionFlow.map((step, index) => (
                <div key={step.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-medium text-sky-600">Schritt {index + 1}</div>
                    <div className="h-9 w-9 rounded-xl bg-gray-50 flex items-center justify-center">
                      {index === 0 && <Users className="h-5 w-5 text-gray-700" />}
                      {index === 1 && <Sparkles className="h-5 w-5 text-gray-700" />}
                      {index === 2 && <Vote className="h-5 w-5 text-gray-700" />}
                      {index === 3 && <Calculator className="h-5 w-5 text-gray-700" />}
                    </div>
                  </div>
                  <div className="text-lg font-semibold mb-2">{step.title}</div>
                  <div className="text-gray-600 text-sm">{step.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">FAQ</h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Häufige Fragen, kurz beantwortet.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faqs.map((item) => (
                <div key={item.q} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="font-semibold mb-2">{item.q}</div>
                  <div className="text-gray-600 text-sm">{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            So einfach geht&apos;s
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            In vier Schritten zur fairen Kostenverteilung – ohne Streit und ohne Taschenrechner.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-sky-600" />
                </div>
                <div className="text-sm text-sky-600 font-medium mb-2">
                  Schritt {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Perfekt für jede Situation
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Ob WG, Urlaub oder Firmenevent – TeamPayer funktioniert überall.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="text-5xl mb-4">🏠</div>
              <h3 className="text-xl font-semibold mb-2">WG-Kosten</h3>
              <p className="text-gray-600">Miete, Internet, Putzmittel fair aufteilen.</p>
            </div>
            <div className="text-center p-6">
              <div className="text-5xl mb-4">✈️</div>
              <h3 className="text-xl font-semibold mb-2">Gruppenreisen</h3>
              <p className="text-gray-600">Hotel, Mietwagen, Aktivitäten transparent teilen.</p>
            </div>
            <div className="text-center p-6">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold mb-2">Events & Feiern</h3>
              <p className="text-gray-600">Geburtstage, Teamevents, Hochzeiten organisieren.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Bereit für faire Kostenverteilung?
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Starte jetzt kostenlos und erlebe, wie einfach Fairness sein kann.
          </p>
          <Link
            href="/register"
            className="bg-sky-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-sky-600 transition-colors inline-flex items-center gap-2"
          >
            Kostenlos registrieren
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  )
}
