"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, Send, Video, MessageSquare, Smile, Loader2, Volume2, VolumeX } from "lucide-react"
import { ChatMessage } from "./chat-message"
import { SignLanguageView } from "./sign-language-view"
import { PictogramSelector } from "./pictogram-selector"
import { CharacterSelector, type Character } from "./character-selector"
import { CharacterMessage } from "./character-message"
import { addreportedUsers, getUserById, useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useMessages, type Message } from "@/lib/messages"
import { callMistralAPI, isValidURL } from "@/lib/api-service"
import { SpeechRecognizer } from "@/lib/speech-recognition"

type ChatInterfaceProps = {
  selectedUserId?: string
}

export function ChatInterface({ selectedUserId = "bot" }: ChatInterfaceProps) {
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const { getMessages, sendMessage, selectedCharacterId, setSelectedCharacter } = useMessages()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [activeTab, setActiveTab] = useState("text")
  const [isRecording, setIsRecording] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCharacter, setSelectedCharacterState] = useState<Character>({
    id: selectedCharacterId || "assistant",
    name: "Assistant",
    avatar: "/placeholder.svg?height=200&width=200&text=A&bg=blue",
    description: "L'assistant virtuel par défaut, toujours prêt à vous aider.",
  })
  const [showCharacterMessage, setShowCharacterMessage] = useState(false)
  const [currentCharacterMessage, setCurrentCharacterMessage] = useState<Message | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const speechRecognizerRef = useRef<SpeechRecognizer | null>(null)
  const [transcriptFinal, setTranscriptFinal] = useState("")
  const [transcriptInterim, setTranscriptInterim] = useState("")

  // État pour le text-to-speech
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [lastMessageRead, setLastMessageRead] = useState<string | null>(null)

  // Ajouter un log pour voir la valeur de selectedUserId
  useEffect(() => {
    console.log("ChatInterface - selectedUserId:", selectedUserId)
  }, [selectedUserId])

  // Load messages when selectedUserId changes or when character changes
  useEffect(() => {
    if (selectedUserId) {
      // Mettre à jour l'appel à getMessages pour passer le characterId
      const userMessages = getMessages(selectedUserId, selectedCharacter.id)

      // Filtrer les messages en fonction du personnage sélectionné
      const filteredMessages = userMessages.filter((msg) => {
        // Si c'est un message de l'utilisateur vers le bot, toujours l'inclure
        if (msg.senderId === user?.id && msg.receiverId === selectedUserId) {
          return true
        }

        // Si c'est un message du bot vers l'utilisateur, vérifier le characterId
        if (msg.senderId === selectedUserId && msg.receiverId === user?.id) {
          // Si c'est un message du bot, vérifier que le characterId correspond
          if (msg.senderId === "bot") {
            // Si le message n'a pas de characterId, l'inclure par défaut
            if (!msg.characterId) return true

            // Sinon, vérifier que le characterId correspond au personnage sélectionné
            return msg.characterId === selectedCharacter.id
          }
          return true
        }

        return false
      })

      setMessages(filteredMessages)

      // Vérifier s'il y a un message du bot à afficher avec le personnage
      // Ne montrer le personnage que si c'est une conversation avec le bot
      if (selectedUserId === "bot") {
        const lastBotMessage = filteredMessages
          .filter((msg) => msg.senderId === "bot" && msg.characterId === selectedCharacter.id)
          .pop()

        if (lastBotMessage) {
          setCurrentCharacterMessage(lastBotMessage)
          setShowCharacterMessage(true)
        }
      }
    }
  }, [selectedUserId, getMessages, user?.id, selectedCharacter.id])

  // Initialize speech recognition
  useEffect(() => {
    // Créer une instance de SpeechRecognizer
    speechRecognizerRef.current = new SpeechRecognizer({
      onResult: (transcript) => {
        // Mettre à jour le texte de l'input avec la transcription
        setInputValue(transcript)
      },
      onStart: () => {
        setIsRecording(true)
      },
      onEnd: () => {
        setIsRecording(false)
      },
      onError: (error) => {
        console.error("Erreur de reconnaissance vocale:", error)
        toast({
          title: "Erreur de reconnaissance vocale",
          description: "Une erreur est survenue lors de la reconnaissance vocale.",
          variant: "destructive",
        })
        setIsRecording(false)
      },
    })

    // Nettoyer lors du démontage
    return () => {
      if (speechRecognizerRef.current) {
        speechRecognizerRef.current.stop()
      }
    }
  }, [toast])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, showCharacterMessage])

  // Set preferred communication mode based on user preferences
  useEffect(() => {
    if (user && user.communicationPreference) {
      setActiveTab(user.communicationPreference)
    }
  }, [user])

  // Fonction pour lire le texte avec text-to-speech
  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Arrêter toute synthèse vocale en cours
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "fr-FR"

      utterance.onstart = () => {
        setIsSpeaking(true)
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        setLastMessageRead(text)
      }

      window.speechSynthesis.speak(utterance)
    } else {
      toast({
        title: "Fonctionnalité non supportée",
        description: "La synthèse vocale n'est pas supportée par votre navigateur.",
        variant: "destructive",
      })
    }
  }

  // Fonction pour arrêter la lecture
  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  // Fonction pour lire le dernier message
  const readLastMessage = () => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.type === "text") {
        speakText(lastMessage.content)
      }
    }
  }

  // Modifier la fonction handleSendMessage pour utiliser l'API Web Speech
  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return

    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour envoyer des messages.",
        variant: "destructive",
      })
      return
    }

    const sentimentMessage = async (message: string) => {
      const data = { inputs: message }

      try {
        const res = await fetch("https://hiu-interne-back.onrender.com/sentiment-controller", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        if (!res.ok) {
          throw new Error("Erreur dans la requête")
        }

        return await res.json()
      } catch (error) {
        console.error("Erreur :", error)
        return null // Retourne null en cas d'erreur
      }
    }

    setIsSending(true)
    setIsLoading(true)

    try {
      console.log(`Sending message to: ${selectedUserId}`)

      // Envoyer le message de l'utilisateur
      const newMessage = await sendMessage({
        senderId: user!.id,
        receiverId: selectedUserId,
        content: inputValue,
        type: activeTab as "text" | "voice" | "sign" | "pictogram",
        positivity: true,
      })

      const sentimentResponse = await sentimentMessage(newMessage.content)
      console.log(newMessage.content + " : " + (sentimentResponse ? sentimentResponse["sentiment"] : "pas de réponse"))

      // Mise à jour de "positivity" basée sur la réponse
      if (sentimentResponse != null && sentimentResponse["sentiment"] != "1") {
        newMessage.positivity = false

        // Récupération des infos de l'utilisateur
        if (user) {
          const userReport = getUserById(user.id)

          if (userReport) {
            // Ajout à la liste des utilisateurs signalés
            addreportedUsers({
              id: userReport.id,
              name: userReport.name,
              email: userReport.email,
              reason: "Message Négatif",
              reportedBy: "Handi", // Signaler Par l'IA
              date: new Date(),
            })
          }
        }
      } else newMessage.positivity = true

      setMessages((prev) => [...prev, newMessage])

      setInputValue("")

      // Gérer le comportement du bot si nécessaire
      if (selectedUserId === "bot") {
        try {
          // Appeler l'API Mistral
          const response = await callMistralAPI(inputValue)

          const messageType = isValidURL(response) ? "video" : "text"

          console.log("messageType : ", messageType)

          // Créer le message de réponse
          const botResponse: Message = {
            id: String(Date.now()),
            senderId: "bot",
            receiverId: user!.id,
            content: response,
            timestamp: new Date(),
            type: messageType,
            read: false,
            characterId: selectedCharacter.id,
            positivity: true,
          }

          // Afficher le message avec le personnage
          setCurrentCharacterMessage(botResponse)
          setShowCharacterMessage(true)
        } catch (error) {
          console.error("Erreur lors de l'appel à l'API Mistral:", error)

          // Utiliser l'URL YouTube de secours
          const fallbackUrl = "https://www.youtube.com/watch?v=MzvAJgy2pfc&list=RDMzvAJgy2pfc&start_radio=1"

          const botResponse: Message = {
            id: String(Date.now()),
            senderId: "bot",
            receiverId: user!.id,
            content: fallbackUrl,
            timestamp: new Date(),
            type: "video",
            read: false,
            characterId: selectedCharacter.id,
            positivity: true,
          }

          setCurrentCharacterMessage(botResponse)
          setShowCharacterMessage(true)

          toast({
            title: "Utilisation de la réponse de secours",
            description: "L'API n'a pas pu être contactée, une vidéo de démonstration est utilisée à la place.",
          })
        }
      } else {
        // Si c'est une conversation entre utilisateurs, simuler une réponse après un court délai
        setTimeout(() => {
          // Obtenir le nom de l'utilisateur sélectionné
          const selectedUser = getUserById(selectedUserId)
          if (selectedUser) {
            // Générer une réponse automatique
            const autoResponse: Message = {
              id: String(Date.now() + 1),
              senderId: selectedUserId,
              receiverId: user!.id,
              content: `Merci pour ton message ! Je te réponds dès que possible. - ${selectedUser.name}`,
              timestamp: new Date(),
              type: "text",
              read: false,
              positivity: true,
            }

            // Ajouter la réponse aux messages
            setMessages((prev) => [...prev, autoResponse])
          }
        }, 3000) // Répondre après 3 secondes
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi du message.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
      setIsLoading(false)
    }
  }

  const toggleRecording = () => {
    if (!speechRecognizerRef.current) {
      toast({
        title: "Fonctionnalité non supportée",
        description: "La reconnaissance vocale n'est pas supportée par votre navigateur.",
        variant: "destructive",
      })
      return
    }

    if (isRecording) {
      speechRecognizerRef.current.stop()
    } else {
      const success = speechRecognizerRef.current.start()
      if (!success) {
        toast({
          title: "Erreur",
          description: "Impossible de démarrer la reconnaissance vocale.",
          variant: "destructive",
        })
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handlePictogramSelect = (emoji: string) => {
    setInputValue((prev) => prev + emoji)
  }

  const handleSignLanguageResult = (text: string) => {
    setInputValue(text)
  }

  const handleCharacterSelect = (character: Character) => {
    // Si on change de personnage, on réinitialise les messages affichés
    if (selectedCharacter.id !== character.id) {
      setMessages([])
    }

    setSelectedCharacterState(character)
    setSelectedCharacter(character.id)

    // Afficher un message de bienvenue avec le nouveau personnage
    setCurrentCharacterMessage({
      id: String(Date.now()),
      senderId: "bot",
      receiverId: user?.id || "1",
      content: `Bonjour, je suis ${character.name}. Comment puis-je vous aider aujourd'hui ?`,
      timestamp: new Date(),
      type: "text",
      read: false,
      characterId: character.id,
      positivity: true,
    })
    setShowCharacterMessage(true)
  }

  // Modifier la fonction handleCharacterMessageFinish
  const handleCharacterMessageFinish = () => {
    // Ajouter le message du personnage à la liste des messages une fois l'animation terminée
    if (currentCharacterMessage && !messages.some((m) => m.id === currentCharacterMessage.id)) {
      setMessages((prev) => [...prev, currentCharacterMessage])
    }
    // Cacher le message animé
    setShowCharacterMessage(false)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-0">
        {/* N'afficher le sélecteur de personnage que pour les conversations avec le bot */}
        {selectedUserId === "bot" && (
          <CharacterSelector onSelect={handleCharacterSelect} selectedCharacterId={selectedCharacter.id} />
        )}

        <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-4 py-2">
            <div className="flex justify-between items-center">
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Texte</span>
                </TabsTrigger>
                <TabsTrigger value="voice" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  <span className="hidden sm:inline">Voix</span>
                </TabsTrigger>
                <TabsTrigger value="sign" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  <span className="hidden sm:inline">Langue des signes</span>
                </TabsTrigger>
                <TabsTrigger value="pictogram" className="flex items-center gap-2">
                  <Smile className="h-4 w-4" />
                  <span className="hidden sm:inline">Pictogrammes</span>
                </TabsTrigger>
              </TabsList>

              {/* Bouton pour lire le dernier message */}
              <Button
                variant="ghost"
                size="sm"
                onClick={isSpeaking ? stopSpeaking : readLastMessage}
                disabled={messages.length === 0}
                className="ml-2"
              >
                {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="h-[500px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  currentUserId={user?.id || ""}
                  selectedUserId={selectedUserId}
                />
              ))}

              {showCharacterMessage && currentCharacterMessage && selectedUserId === "bot" && (
                <CharacterMessage
                  message={currentCharacterMessage.content}
                  character={selectedCharacter}
                  onFinish={handleCharacterMessageFinish}
                />
              )}

              <div ref={messagesEndRef} />
            </div>

            <TabsContent value="text" className="m-0 p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Écrivez votre message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button onClick={handleSendMessage} aria-label="Envoyer" disabled={isSending || isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="voice" className="m-0 p-4 border-t">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Le texte reconnu apparaîtra ici..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button onClick={handleSendMessage} aria-label="Envoyer" disabled={isSending || isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={toggleRecording}
                    variant={isRecording ? "destructive" : "default"}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="h-4 w-4 mr-2" />
                        Arrêter l'enregistrement
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Commencer l'enregistrement
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sign" className="m-0 p-4 border-t">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Le texte traduit apparaîtra ici..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button onClick={handleSendMessage} aria-label="Envoyer" disabled={isSending || isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <SignLanguageView onSignDetected={handleSignLanguageResult} />
              </div>
            </TabsContent>

            <TabsContent value="pictogram" className="m-0 p-4 border-t">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Composez avec des pictogrammes..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button onClick={handleSendMessage} aria-label="Envoyer" disabled={isSending || isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <PictogramSelector onSelect={handlePictogramSelect} />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}

