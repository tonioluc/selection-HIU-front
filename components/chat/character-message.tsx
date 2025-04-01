"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { VolumeX, Volume2 } from "lucide-react"
import Image from "next/image"
import type { Character } from "./character-selector"
import { isValidURL, convertYouTubeUrl } from "@/lib/api-service"

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
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null)
  const voicesLoadedRef = useRef<boolean>(false)
  const availableVoicesRef = useRef<SpeechSynthesisVoice[]>([])
  const sentenceBufferRef = useRef<string>("")
  const lastSpeakTimeRef = useRef<number>(0)

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

  // Charger les voix disponibles dès le début
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      // Fonction pour stocker les voix disponibles
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices()
        if (voices.length > 0) {
          availableVoicesRef.current = voices
          voicesLoadedRef.current = true
          console.log("Voix chargées:", voices.map(v => `${v.name} (${v.lang})`).join(", "))
        }
      }

      // Charger les voix immédiatement si disponibles
      loadVoices()

      // Ou attendre l'événement onvoiceschanged
      window.speechSynthesis.onvoiceschanged = loadVoices

      // Nettoyage
      return () => {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  // Fonction pour arrêter la synthèse vocale
  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      if (onSpeakEnd) onSpeakEnd()
    }
    sentenceBufferRef.current = ""
  }

  // Nettoyage lorsque le composant est démonté
  useEffect(() => {
    return () => {
      stopSpeaking()
    }
  }, [])

  // Sélectionner la voix appropriée pour le personnage
  const selectVoiceForCharacter = (characterId: string): SpeechSynthesisVoice | null => {
    const voices = availableVoicesRef.current
    if (voices.length === 0) {
      console.warn("Aucune voix disponible")
      return null
    }
    
    // Préférence de voix pour chaque personnage
    switch (characterId) {
      case "assistant":
        // Voix neutre en français
        return (
          voices.find((v) => v.lang.includes("fr") && v.name.includes("Google")) ||
          voices.find((v) => v.lang.includes("fr")) ||
          voices[0]
        )
      case "leo":
        // Voix masculine en français
        return (
          voices.find((v) => v.lang.includes("fr") && v.name.includes("Thomas")) ||
          voices.find((v) => v.lang.includes("fr") && !v.name.includes("female") && !v.name.includes("Amélie")) ||
          voices.find((v) => v.lang.includes("fr")) ||
          voices[0]
        )
      case "emma":
        // Voix féminine en français
        return (
          voices.find((v) => v.lang.includes("fr") && v.name.includes("Amélie")) ||
          voices.find((v) => v.lang.includes("fr") && (v.name.includes("female") || v.name.includes("Elsa"))) ||
          voices.find((v) => v.lang.includes("fr")) ||
          voices[0]
        )
      case "max":
        // Voix masculine différente en français
        return (
          voices.find((v) => v.lang.includes("fr") && v.name.includes("Nicolas")) ||
          voices.find((v) => v.lang.includes("fr") && !v.name.includes("female") && !v.name.includes("Thomas")) ||
          voices.find((v) => v.lang.includes("fr")) ||
          voices[0]
        )
      default:
        return voices[0]
    }
  }

  // Fonction pour parler une partie du texte
  const speakTextChunk = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis || isMutedState) return
    
    // S'assurer que les voix sont chargées
    if (!voicesLoadedRef.current) {
      availableVoicesRef.current = window.speechSynthesis.getVoices()
      if (availableVoicesRef.current.length > 0) {
        voicesLoadedRef.current = true
      } else {
        console.warn("Les voix ne sont pas encore chargées!")
        return
      }
    }

    // Ne pas parler si le texte est vide ou simplement des espaces
    if (!text.trim()) return
    
    // Créer un nouvel objet d'énoncé pour le morceau de texte
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "fr-FR"
    utterance.rate = 5.5
    utterance.pitch = 3
    
    // Attribuer la voix appropriée
    const voice = selectVoiceForCharacter(character.id)
    if (voice) {
      utterance.voice = voice
    }
    
    // Configurer les événements
    utterance.onstart = () => {
      setIsSpeaking(true)
    }
    
    utterance.onend = () => {
      // Ne réinitialiser isSpeaking que s'il n'y a plus rien dans la file
      if (window.speechSynthesis.pending === false) {
        setIsSpeaking(false)
      }
    }
    
    // Prononcer le texte
    window.speechSynthesis.speak(utterance)
  }

  // Effet pour l'animation de texte avec synthèse vocale en temps réel
  useEffect(() => {
    if (!isVideoMessage && currentIndex < message.length) {
      // Déterminer le délai en fonction du caractère
      let delay = 200; // Délai de base plus lent pour synchroniser avec la parole
      
      // Pause plus longue après la ponctuation
      if (['.', '!', '?', ':'].includes(message[currentIndex-1])) {
        delay = 400;
        // Si on a accumulé du texte, on le prononce
        if (sentenceBufferRef.current.trim() && !isMutedState) {
          speakTextChunk(sentenceBufferRef.current);
          sentenceBufferRef.current = "";
        }
      } else if ([',', ';'].includes(message[currentIndex-1])) {
        delay = 200;
      }
      
      const timer = setTimeout(() => {
        // Ajouter le caractère au buffer
        sentenceBufferRef.current += message[currentIndex];
        
        // Mettre à jour le texte affiché
        setDisplayedMessage((prev) => prev + message[currentIndex])
        
        // Parler par morceaux de 5-10 caractères pour un effet plus naturel
        if ((sentenceBufferRef.current.length >= 6 && 
            !message[currentIndex+1]?.match(/[a-zA-Z0-9]/)) || 
            ['.', '!', '?', ':', ',', ';'].includes(message[currentIndex])) {
          
          const now = Date.now();
          // Éviter de parler trop souvent (au moins 300ms entre les énoncés)
          if (now - lastSpeakTimeRef.current > 300 && !isMutedState) {
            speakTextChunk(sentenceBufferRef.current);
            sentenceBufferRef.current = "";
            lastSpeakTimeRef.current = now;
          }
        }
        
        // Passer au caractère suivant
        setCurrentIndex((prev) => prev + 1)
      }, delay)

      return () => clearTimeout(timer)
    } else if (!isVideoMessage && currentIndex === message.length) {
      // Si on a encore du texte dans le buffer à la fin, on le prononce
      if (sentenceBufferRef.current.trim() && !isMutedState) {
        speakTextChunk(sentenceBufferRef.current);
        sentenceBufferRef.current = "";
      }
      
      setIsComplete(true)
      if (onFinish) onFinish()
      
      // Permettre au dernier morceau de texte d'être prononcé
      setTimeout(() => {
        if (!isSpeaking && onSpeakEnd) onSpeakEnd();
      }, 500);
    }
  }, [currentIndex, message, isVideoMessage, isMutedState, character.id, isSpeaking, onSpeakEnd, onFinish]);

  // Fonction pour lire le message complet à haute voix
  const speakFullMessage = () => {
    if (typeof window === "undefined" || !window.speechSynthesis || isMutedState) return
    
    // Arrêter toute synthèse vocale en cours
    window.speechSynthesis.cancel()
    
    // S'assurer que les voix sont chargées
    if (!voicesLoadedRef.current) {
      availableVoicesRef.current = window.speechSynthesis.getVoices()
      if (availableVoicesRef.current.length > 0) {
        voicesLoadedRef.current = true
      } else {
        console.warn("Les voix ne sont pas encore chargées!")
        setTimeout(speakFullMessage, 500)
        return
      }
    }
    
    // Créer un nouvel objet d'énoncé pour le texte complet
    const utterance = new SpeechSynthesisUtterance(message)
    utterance.lang = "fr-FR"
    utterance.rate = 1.0
    
    // Attribuer la voix appropriée
    const voice = selectVoiceForCharacter(character.id)
    if (voice) {
      utterance.voice = voice
    }
    
    // Configurer les événements
    utterance.onstart = () => {
      setIsSpeaking(true)
    }
    
    utterance.onend = () => {
      setIsSpeaking(false)
      if (onSpeakEnd) onSpeakEnd()
    }
    
    // Référence pour pouvoir l'arrêter plus tard si nécessaire
    speechSynthRef.current = utterance
    
    // Prononcer le texte
    window.speechSynthesis.speak(utterance)
  }

  // Mettre à jour isMutedState quand la prop isMuted change
  useEffect(() => {
    setIsMuted(isMuted)
    if (isMuted) {
      stopSpeaking()
    }
  }, [isMuted])

  // Compléter immédiatement le message si l'utilisateur clique dessus
  const handleClick = () => {
    if (!isVideoMessage) {
      if (!isComplete) {
        // Arrêter toute synthèse vocale en cours
        stopSpeaking()
        
        // Afficher le message complet
        setDisplayedMessage(message)
        setCurrentIndex(message.length)
        setIsComplete(true)
        
        // Notifier que le message est complet
        if (onFinish) onFinish()
        
        // Lire le message complet après un court délai
        if (!isMutedState) {
          setTimeout(speakFullMessage, 100)
        }
      } else if (!isSpeaking) {
        // Si le message est déjà complet et qu'on n'est pas en train de parler, on lit le message
        speakFullMessage()
      } else {
        // Si on est déjà en train de parler, on arrête
        stopSpeaking()
      }
    }
  }

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
            const newMutedState = !isMutedState;
            setIsMuted(newMutedState)
            if (!newMutedState && isComplete) {
              speakFullMessage()
            } else if (newMutedState) {
              stopSpeaking()
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
                <>
                  <div className="relative w-full aspect-video rounded overflow-hidden">
                    {message.includes("youtube.com") || message.includes("youtu.be") ? (
                      <>
                        <iframe
                          src={convertYouTubeUrl ? convertYouTubeUrl(message) : message}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title="YouTube video player"
                        />
                      </>
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
                </>
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