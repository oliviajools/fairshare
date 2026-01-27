'use client'

import { useState } from 'react'
import { Mail, MessageSquare, MapPin, Send, CheckCircle } from 'lucide-react'

// Metadata muss in einer separaten Datei sein für 'use client' Komponenten
// SEO wird über das Layout und den Seitentitel gehandhabt

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Hier würde normalerweise die API-Anfrage kommen
    setSubmitted(true)
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-sky-400 to-sky-600 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Kontakt
            </h1>
            <p className="text-xl text-sky-100 leading-relaxed">
              Fragen, Feedback oder einfach nur Hallo sagen? 
              Wir freuen uns von dir zu hören.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold mb-6">So erreichst du uns</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">E-Mail</h3>
                    <p className="text-gray-600">hello@teampayer.de</p>
                    <p className="text-gray-500 text-sm">Wir antworten innerhalb von 24 Stunden</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-6 w-6 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Social Media</h3>
                    <p className="text-gray-600">@teampayer auf allen Plattformen</p>
                    <p className="text-gray-500 text-sm">Für schnelle Fragen und Updates</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Standort</h3>
                    <p className="text-gray-600">Berlin, Deutschland</p>
                    <p className="text-gray-500 text-sm">100% Remote-Team</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 p-6 bg-gray-50 rounded-2xl">
                <h3 className="font-semibold mb-2">FAQ</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Viele Fragen beantworten wir bereits in unseren FAQ.
                </p>
                <a 
                  href="#faq" 
                  className="text-sky-600 font-medium hover:underline text-sm"
                >
                  Zu den häufigen Fragen →
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Schreib uns</h2>
              
              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-800 mb-2">
                    Nachricht gesendet!
                  </h3>
                  <p className="text-green-700">
                    Danke für deine Nachricht. Wir melden uns schnellstmöglich bei dir.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all"
                      placeholder="Dein Name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      E-Mail
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all"
                      placeholder="deine@email.de"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Betreff
                    </label>
                    <select
                      id="subject"
                      required
                      value={formState.subject}
                      onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="question">Allgemeine Frage</option>
                      <option value="feedback">Feedback</option>
                      <option value="bug">Bug melden</option>
                      <option value="business">Geschäftliche Anfrage</option>
                      <option value="press">Presseanfrage</option>
                      <option value="other">Sonstiges</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Nachricht
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      value={formState.message}
                      onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all resize-none"
                      placeholder="Was liegt dir auf dem Herzen?"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-sky-500 text-white py-4 rounded-xl font-semibold hover:bg-sky-600 transition-colors flex items-center justify-center gap-2"
                  >
                    Nachricht senden
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
