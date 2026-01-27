import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Wer wir sind – Das TeamPayer Team',
  description: 'Lerne das Team hinter TeamPayer kennen. Menschen mit einer Leidenschaft für Fairness und gute Software.',
  openGraph: {
    title: 'Wer wir sind – Das TeamPayer Team',
    description: 'Lerne das Team hinter TeamPayer kennen.',
  },
}

const team = [
  {
    name: 'Anna Schmidt',
    role: 'Gründerin & CEO',
    emoji: '👩‍💼',
    bio: 'Hat die Idee nach einem chaotischen WG-Abend entwickelt. Glaubt fest daran, dass Technologie Menschen verbinden statt trennen sollte.',
  },
  {
    name: 'Max Weber',
    role: 'CTO',
    emoji: '👨‍💻',
    bio: 'Mathematiker und Entwickler. Liebt Algorithmen, die echte Probleme lösen – besonders wenn sie Streit vermeiden.',
  },
  {
    name: 'Lisa Chen',
    role: 'Head of Design',
    emoji: '👩‍🎨',
    bio: 'Sorgt dafür, dass komplexe Berechnungen einfach aussehen. Ihr Motto: "Wenn es nicht intuitiv ist, ist es nicht fertig."',
  },
  {
    name: 'Tom Müller',
    role: 'Community Lead',
    emoji: '🧑‍🤝‍🧑',
    bio: 'Hört den Nutzern zu und bringt ihre Wünsche ins Team. Der Grund, warum TeamPayer ständig besser wird.',
  },
]

export default function TeamPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Wer wir sind
            </h1>
            <p className="text-xl text-emerald-100 leading-relaxed">
              Ein kleines Team mit einer großen Mission: 
              Geldverteilung stressfrei machen.
            </p>
          </div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >
                <div className="text-6xl mb-4">{member.emoji}</div>
                <h3 className="text-xl font-bold">{member.name}</h3>
                <p className="text-emerald-600 font-medium mb-4">{member.role}</p>
                <p className="text-gray-600">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Us */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Werde Teil des Teams</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Wir suchen immer nach Menschen, die unsere Vision teilen. 
            Ob Entwickler, Designer oder Community Manager – melde dich!
          </p>
          <Link
            href="/site/contact"
            className="bg-emerald-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-emerald-600 transition-colors inline-flex items-center gap-2"
          >
            Kontakt aufnehmen
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  )
}
