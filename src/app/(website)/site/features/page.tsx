import { Metadata } from 'next'
import Link from 'next/link'
import { 
  ArrowRight, 
  Vote, 
  Shield, 
  BarChart3, 
  Smartphone, 
  Globe, 
  Zap,
  Lock,
  RefreshCw,
  MessageSquare
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Features – Was TeamPayer dir bietet',
  description: 'Entdecke alle Features von TeamPayer: Anonyme Abstimmung, faire Algorithmen, Echtzeit-Ergebnisse und mehr.',
  openGraph: {
    title: 'Features – Was TeamPayer dir bietet',
    description: 'Entdecke alle Features von TeamPayer.',
  },
}

const mainFeatures = [
  {
    icon: Vote,
    title: 'Demokratische Abstimmung',
    description: 'Jedes Teammitglied kann anonym seine Einschätzung abgeben. Keine Beeinflussung, keine Hierarchie – nur ehrliche Meinungen.',
  },
  {
    icon: BarChart3,
    title: 'Fairer Algorithmus',
    description: 'Unser Algorithmus berechnet aus allen Stimmen die fairste Verteilung. Mathematisch fundiert, für jeden nachvollziehbar.',
  },
  {
    icon: Shield,
    title: 'Anonymität garantiert',
    description: 'Niemand sieht, wer wie abgestimmt hat. Das fördert ehrliche Bewertungen ohne soziale Hemmungen.',
  },
  {
    icon: Zap,
    title: 'Echtzeit-Ergebnisse',
    description: 'Sobald alle abgestimmt haben, siehst du sofort das Ergebnis. Keine Wartezeiten, keine manuelle Auswertung.',
  },
]

const additionalFeatures = [
  {
    icon: Smartphone,
    title: 'Mobile First',
    description: 'Optimiert für Smartphones – abstimmen von überall.',
  },
  {
    icon: Globe,
    title: 'Keine Installation',
    description: 'Läuft im Browser – einfach Link teilen und loslegen.',
  },
  {
    icon: Lock,
    title: 'Sichere Daten',
    description: 'Deine Daten gehören dir. DSGVO-konform und verschlüsselt.',
  },
  {
    icon: RefreshCw,
    title: 'Mehrere Runden',
    description: 'Bei Bedarf kann neu abgestimmt werden.',
  },
  {
    icon: MessageSquare,
    title: 'Optionale Kommentare',
    description: 'Begründe deine Einschätzung, wenn du möchtest.',
  },
]

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-rose-400 to-rose-600 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Was wir dir geben
            </h1>
            <p className="text-xl text-rose-100 leading-relaxed">
              Alles, was du für faire Kostenverteilung brauchst – 
              und noch ein bisschen mehr.
            </p>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Kern-Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {mainFeatures.map((feature) => (
              <div
                key={feature.title}
                className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 bg-rose-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="h-7 w-7 text-rose-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Und noch mehr</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {additionalFeatures.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 flex items-start gap-4"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Der Unterschied</h2>
          
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-100 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-4 text-gray-500">Ohne TeamPayer</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✗</span>
                  Endlose Diskussionen
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✗</span>
                  Einer macht die Arbeit
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✗</span>
                  Gefühl der Ungerechtigkeit
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✗</span>
                  Excel-Tabellen-Chaos
                </li>
              </ul>
            </div>
            
            <div className="bg-rose-50 rounded-2xl p-8 border-2 border-rose-200">
              <h3 className="text-xl font-bold mb-4 text-rose-600">Mit TeamPayer</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  Schnelle, demokratische Entscheidung
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  Jeder wird gehört
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  Transparente, faire Ergebnisse
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  Automatische Berechnung
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Überzeug dich selbst</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Probiere TeamPayer kostenlos aus und erlebe den Unterschied.
          </p>
          <Link
            href="/register"
            className="bg-rose-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-rose-600 transition-colors inline-flex items-center gap-2"
          >
            Jetzt starten
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  )
}
