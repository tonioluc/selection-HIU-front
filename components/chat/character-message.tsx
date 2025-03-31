"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { VolumeX } from "lucide-react"
import type { Character } from "./character-selector"
import { Character3D } from "./character-3d"

type CharacterMessageProps = {
  message: string
  character: Character
  onFinish?: () => void
  onSpeakEnd?: () => void
}

export function CharacterMessage({ message, character, onFinish, onSpeakEnd }: CharacterMessageProps) {
  const [displayedMessage, setDisplayedMessage] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const characterRef = useRef<HTMLDivElement>(null)

  // Effet pour l'animation de texte
  useEffect(() => {
    if (currentIndex < message.length) {
      const timer = setTimeout(() => {
        setDisplayedMessage((prev) => prev + message[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, 30) // Vitesse de l'animation

      return () => clearTimeout(timer)
    } else {
      setIsComplete(true)
      if (onFinish) onFinish()
    }
  }, [currentIndex, message, onFinish])

  // Fonction pour lire le message à haute voix
  useEffect(() => {
    if (isComplete && !isSpeaking) {
      speakMessage()
    }
  }, [isComplete])

  const speakMessage = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Annuler toute synthèse vocale en cours
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(message)
      utterance.lang = "fr-FR"

      utterance.onstart = () => {
        setIsSpeaking(true)
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        if (onSpeakEnd) onSpeakEnd()
      }

      window.speechSynthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      if (onSpeakEnd) onSpeakEnd()
    }
  }

  // Compléter immédiatement le message si l'utilisateur clique dessus
  const handleClick = () => {
    if (!isComplete) {
      setDisplayedMessage(message)
      setCurrentIndex(message.length)
      setIsComplete(true)
      if (onFinish) onFinish()
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-muted" ref={characterRef}>
          <Character3D color={character.color || "#8b5cf6"} size={80} waving={isSpeaking} />
        </div>

        <div className="flex-1">
          <div className="font-medium mb-1">{character.name}</div>
          <Card className="cursor-pointer relative" onClick={handleClick}>
            <CardContent className="p-4">
              <p className="whitespace-pre-line">{displayedMessage}</p>
              {!isComplete && <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse"></span>}

              {isSpeaking && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    stopSpeaking()
                  }}
                >
                  <VolumeX className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
          <div className="text-xs text-muted-foreground mt-1">Cliquez sur le message pour accélérer</div>
        </div>
      </div>
    </div>
  )
}

