"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { VolumeX, Volume2 } from "lucide-react"
import Image from "next/image"
import type { Character } from "./character-selector"
import { isValidURL, convertYouTubeUrl } from "@/lib/api-service"
import { generateSpeech, playAudio, stopAudio, selectVoiceForCharacter } from "@/lib/openai-tts"

// Mettre à jour la définition du composant pour inclure isMuted
type CharacterMessageProps = {
  message: string
  character: Character
  onFinish?: () => void
  onSpeakEnd?: () => void
  isMuted?: boolean
}

export function CharacterMessage({ message, character, onFinish, onSpeakEnd, isMuted = false }: CharacterMessageProps) {
  const [displayedMessage, setDisplayedMessage] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const characterRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMutedState, setIsMuted] = useState(isMuted)
  const [isVideoMessage, setIsVideoMessage] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  // Vérifier si le message est une URL vidéo
  useEffect(() => {
    if (isValidURL(message)) {
      setIsVideoMessage(true)
      // Si c'est une vidéo, on considère le message comme complet immédiatement
      setIsComplete(true)
      if (onFinish) onFinish()
    } else {
      setIsVideoMessage(false)
    }
  }, [message, onFinish])

  // Effet pour l'animation de texte (seulement pour les messages texte)
  useEffect(() => {
    if (!isVideoMessage && currentIndex < message.length) {
      const timer = setTimeout(() => {
        setDisplayedMessage((prev) => prev + message[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, 30) // Vitesse de l'animation

      return () => clearTimeout(timer)
    } else if (!isVideoMessage) {
      setIsComplete(true)
      if (onFinish) onFinish()
    }
  }, [currentIndex, message, onFinish, isVideoMessage])

  // Fonction pour générer et lire la parole avec OpenAI TTS
  const speakMessage = async () => {
    if (!isMutedState && !isVideoMessage) {
      try {
        setIsSpeaking(true)
        console.log("Génération de la parole pour:", message.substring(0, 50) + "...")

        // Sélectionner la voix en fonction du personnage
        const voice = selectVoiceForCharacter(character.id)
        console.log("Voix sélectionnée:", voice)

        // Générer l'audio avec OpenAI TTS via notre API
        const url = await generateSpeech(message, voice)

        if (!url) {
          console.error("Échec de la génération audio - URL null")
          setIsSpeaking(false)
          return
        }

        if (url !== "fallback") {
          console.log("URL audio générée avec succès")
          setAudioUrl(url)
        }

        // Jouer l'audio (avec le texte pour la solution de secours)
        console.log("Tentative de lecture audio...")
        audioRef.current = playAudio(url, message, () => {
          console.log("Callback de fin de lecture appelé")
          setIsSpeaking(false)
          if (onSpeakEnd) onSpeakEnd()
        })

        if (!audioRef.current) {
          console.error("Échec de la création de l'élément audio")
          setIsSpeaking(false)
        }
      } catch (error) {
        console.error("Erreur lors de la synthèse vocale:", error)
        setIsSpeaking(false)
      }
    } else {
      console.log("Synthèse vocale ignorée - muet ou message vidéo")
    }
  }

  // Fonction pour lire le message à haute voix
  useEffect(() => {
    if (isComplete && !isSpeaking && !isMutedState && !isVideoMessage) {
      speakMessage()
    }
  }, [isComplete, isMutedState, isVideoMessage])

  // Fonction pour arrêter la parole
  const stopSpeaking = () => {
    stopAudio(audioRef.current)
    setIsSpeaking(false)
    if (onSpeakEnd) onSpeakEnd()
  }

  // Compléter immédiatement le message si l'utilisateur clique dessus
  const handleClick = () => {
    if (!isVideoMessage) {
      if (!isComplete) {
        setDisplayedMessage(message)
        setCurrentIndex(message.length)
        setIsComplete(true)
        if (onFinish) onFinish()
      } else if (!isSpeaking) {
        // Si le message est déjà complet et qu'on n'est pas en train de parler, on lit le message
        speakMessage()
      } else {
        // Si on est déjà en train de parler, on arrête
        stopSpeaking()
      }
    }
  }

  // Nettoyer les ressources audio lors du démontage du composant
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        stopAudio(audioRef.current)
      }

      // Libérer les URL d'objets
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  // Déterminer la couleur de fond en fonction du personnage
  const getBgGradient = () => {
    switch (character.id) {
      case "assistant":
        return "from-blue-300 to-blue-500"
      case "leo":
        return "from-purple-300 to-purple-500"
      case "emma":
        return "from-pink-300 to-pink-500"
      case "max":
        return "from-teal-300 to-teal-500"
      default:
        return "from-blue-300 to-blue-500"
    }
  }

  // Déterminer la couleur de bordure en fonction du personnage
  const getBorderColor = () => {
    switch (character.id) {
      case "assistant":
        return "border-blue-300 dark:border-blue-500"
      case "leo":
        return "border-purple-300 dark:border-purple-500"
      case "emma":
        return "border-pink-300 dark:border-pink-500"
      case "max":
        return "border-teal-300 dark:border-teal-500"
      default:
        return "border-blue-300 dark:border-blue-500"
    }
  }

  return (
    <div className="mb-6 relative">
      {/* Personnage flottant */}
      <div
        className="fixed bottom-20 right-10 z-50"
        ref={characterRef}
        style={{
          transform: "translateZ(0)",
          willChange: "transform",
          filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))",
        }}
      >
        <div
          className={`w-[300px] h-[300px] rounded-full overflow-hidden bg-gradient-to-br ${getBgGradient()} shadow-lg border-4 ${getBorderColor()} flex items-center justify-center`}
          style={{
            animation: isSpeaking ? "pulse 2s infinite" : "none",
          }}
        >
          {/* Afficher l'image du personnage */}
          {character.imageUrl ? (
            <div className="relative w-full h-full overflow-hidden">
              <Image
                src={character.imageUrl || "/placeholder.svg"}
                alt={character.name}
                fill
                style={{ objectFit: "cover" }}
                className={`transform scale-110 ${isSpeaking ? "animate-talking" : ""}`}
                priority
              />
            </div>
          ) : (
            <div className="text-6xl text-white">{character.name.charAt(0)}</div>
          )}
        </div>

        {/* Nom du personnage */}
        <div
          className={`absolute -top-10 left-1/2 transform -translate-x-1/2 text-white px-4 py-2 rounded-full whitespace-nowrap font-bold text-lg`}
          style={{
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            backgroundColor: character.color || "#4169E1",
          }}
        >
          {character.name}
        </div>

        {/* Bouton mute/unmute */}
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white dark:bg-gray-800 shadow-md"
          onClick={(e) => {
            e.stopPropagation()
            setIsMuted(!isMutedState)
            if (isSpeaking && !isMutedState) {
              stopSpeaking()
            } else if (isSpeaking && isMutedState) {
              speakMessage()
            }
          }}
        >
          {isMutedState ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Bulle de dialogue */}
      <div className="flex justify-end mb-20">
        <div className="max-w-[80%]">
          <Card
            className="cursor-pointer relative overflow-hidden"
            onClick={handleClick}
            style={{
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
              borderRadius: "1.5rem",
              borderBottomRightRadius: "0.5rem",
            }}
          >
            <CardContent className="p-6">
              {isVideoMessage ? (
                <div className="relative w-full aspect-video rounded overflow-hidden">
                  {message.includes("youtube.com") || message.includes("youtu.be") ? (
                    <iframe
                      src={convertYouTubeUrl(message)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="YouTube video player"
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      src={message}
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                      onPlay={() => setIsSpeaking(true)}
                      onPause={() => setIsSpeaking(false)}
                      onEnded={() => {
                        setIsSpeaking(false)
                        if (onSpeakEnd) onSpeakEnd()
                      }}
                    />
                  )}
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-line text-lg">{displayedMessage}</p>
                  {!isComplete && <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse"></span>}
                </>
              )}

              {isSpeaking && !isVideoMessage && (
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
          <div className="text-xs text-muted-foreground mt-1 text-right">
            {isVideoMessage ? "Vidéo en lecture automatique" : "Cliquez sur le message pour accélérer"}
          </div>
        </div>
      </div>

      {/* Styles pour les animations */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
        
        @keyframes talking {
          0%, 100% {
            transform: scale(1.1);
          }
          25% {
            transform: scale(1.12) translateY(0.01em);
          }
          50% {
            transform: scale(1.11) translateY(-0.01em);
          }
          75% {
            transform: scale(1.13) translateY(0.01em);
          }
        }
        
        .animate-talking {
          animation: talking 0.3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

