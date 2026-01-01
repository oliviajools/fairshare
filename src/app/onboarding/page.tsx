'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface OnboardingSlide {
  emoji: string
  title: string
  description: string
  bgColor: string
}

const slides: OnboardingSlide[] = [
  {
    emoji: '💸',
    title: 'Schluss mit Zettelwirtschaft!',
    description: 'Wer schuldet wem was? Mit TeamPayer wird das Aufteilen von Kosten so einfach wie Pizza bestellen. Nur fairer.',
    bgColor: 'from-sky-400 to-sky-600'
  },
  {
    emoji: '👥',
    title: 'Alle stimmen ab',
    description: 'Jeder Teilnehmer bewertet anonym, wer wie viel beitragen soll. Demokratie in ihrer schönsten Form – ohne Diskussion am Esstisch.',
    bgColor: 'from-violet-400 to-violet-600'
  },
  {
    emoji: '🎯',
    title: 'Faire Ergebnisse',
    description: 'Der Algorithmus berechnet den fairsten Verteilungsschlüssel. Mathe macht\'s möglich – du musst nur noch zahlen (oder kassieren).',
    bgColor: 'from-amber-400 to-amber-600'
  },
  {
    emoji: '🚀',
    title: 'Los geht\'s!',
    description: 'Erstelle eine Session, lade deine Leute ein und lass die Kohle fair verteilen. Bereit für weniger Stress und mehr Fairness?',
    bgColor: 'from-emerald-400 to-emerald-600'
  }
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide()
      } else {
        prevSlide()
      }
    }
  }

  const finishOnboarding = () => {
    localStorage.setItem('onboardingComplete', 'true')
    router.push('/login')
  }

  const isLastSlide = currentSlide === slides.length - 1

  return (
    <div 
      className={`min-h-screen bg-gradient-to-br ${slides[currentSlide].bgColor} transition-all duration-500`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="container mx-auto px-6 py-8 pt-16 h-screen flex flex-col">
        {/* Skip Button */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={finishOnboarding}
          >
            Überspringen
          </Button>
        </div>

        {/* Slide Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="text-8xl mb-8 animate-bounce">
            {slides[currentSlide].emoji}
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            {slides[currentSlide].title}
          </h1>
          <p className="text-lg text-white/90 max-w-md leading-relaxed">
            {slides[currentSlide].description}
          </p>
        </div>

        {/* Navigation */}
        <div className="pb-12">
          {/* Dots */}
          <div className="flex justify-center gap-2 mb-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'bg-white w-8' 
                    : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-center">
            {currentSlide > 0 && (
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white bg-white/10 hover:bg-white/20"
                onClick={prevSlide}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            
            {isLastSlide ? (
              <Button
                size="lg"
                className="bg-white text-gray-900 hover:bg-white/90 px-8"
                onClick={finishOnboarding}
              >
                Loslegen! 🎉
              </Button>
            ) : (
              <Button
                size="lg"
                className="bg-white text-gray-900 hover:bg-white/90 px-8"
                onClick={nextSlide}
              >
                Weiter
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
