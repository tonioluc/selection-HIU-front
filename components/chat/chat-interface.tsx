"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, Send, Video, MessageSquare, Smile, Volume2, VolumeX } from "lucide-react"
import { ChatMessage } from "./chat-message"
import { SignLanguageView } from "./sign-language-view"
import { PictogramSelector } from "./pictogram-selector"
import { CharacterSelector, type Character } from "./character-selector"
import { CharacterMessage } from "./character-message"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useMessages, type Message } from "@/lib/messages"

// Declare SpeechRecognition interface
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
    speechSynthesis: SpeechSynthesis
  }
}

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
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [selectedCharacter, setSelectedCharacterState] = useState<Character>({
    id: selectedCharacterId || "handi",
    name: "Handi",
    avatar: "/placeholder.svg?height=200&width=200&text=H&bg=purple",
    description: "L'assistant virtuel par défaut, toujours prêt à vous aider.",
  })
  const [showCharacterMessage, setShowCharacterMessage] = useState(false)
  const [currentCharacterMessage, setCurrentCharacterMessage] = useState<Message | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [speechRecognition, setSpeechRecognition] = useState<any>(null)

  // Load messages when selectedUserId changes
  useEffect(() => {
    if (selectedUserId) {
      const userMessages = getMessages(selectedUserId)

      // Filtrer pour n'afficher que les messages entre l'utilisateur connecté et le destinataire sélectionné
      const filteredMessages = userMessages.filter(
        (msg) =>
          (msg.senderId === user?.id && msg.receiverId === selectedUserId) ||
          (msg.senderId === selectedUserId && msg.receiverId === user?.id),
      )

      setMessages(filteredMessages)

      // Vérifier s'il y a un message du bot à afficher avec le personnage
      const lastBotMessage = filteredMessages.filter((msg) => msg.senderId === "bot").pop()

      if (lastBotMessage && selectedUserId === "bot") {
        setCurrentCharacterMessage(lastBotMessage)
        setShowCharacterMessage(true)
      }
    }
  }, [selectedUserId, getMessages, user?.id])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "fr-FR"

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join("")

        setInputValue(transcript)
      }

      setSpeechRecognition(recognition)
    }
  }, [])

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

    setIsSending(true)

    try {
      const newMessage = await sendMessage({
        senderId: user!.id,
        receiverId: selectedUserId,
        content: inputValue,
        type: activeTab as "text" | "voice" | "sign" | "pictogram",
      })

      setMessages((prev) => [...prev, newMessage])
      setInputValue("")

      // Si c'est un message au bot, on attend la réponse pour l'afficher avec le personnage
      if (selectedUserId === "bot") {
        // La réponse sera ajoutée automatiquement par le hook useMessages
        // On attend un peu pour simuler le temps de réponse
        setTimeout(() => {
          // On récupère le dernier message qui devrait être la réponse du bot
          const botMessages = getMessages(selectedUserId).filter(
            (msg) => msg.senderId === "bot" && msg.timestamp > newMessage.timestamp,
          )

          if (botMessages.length > 0) {
            const latestBotMessage = botMessages[botMessages.length - 1]
            setCurrentCharacterMessage(latestBotMessage)
            setShowCharacterMessage(true)
          }
        }, 1200)
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi du message.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const toggleRecording = () => {
    if (!speechRecognition) {
      toast({
        title: "Fonctionnalité non supportée",
        description: "La reconnaissance vocale n'est pas supportée par votre navigateur.",
        variant: "destructive",
      })
      return
    }

    if (isRecording) {
      speechRecognition.stop()
    } else {
      speechRecognition.start()
    }

    setIsRecording(!isRecording)
  }

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "fr-FR"

      utterance.onstart = () => {
        setIsSpeaking(true)
      }

      utterance.onend = () => {
        setIsSpeaking(false)
      }

      window.speechSynthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
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
    })
    setShowCharacterMessage(true)
  }

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
        {selectedUserId === "bot" && (
          <CharacterSelector onSelect={handleCharacterSelect} selectedCharacterId={selectedCharacter.id} />
        )}

        <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-4 py-2">
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
          </div>

          <div className="h-[500px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onSpeakText={speakText}
                  currentUserId={user?.id || ""}
                  selectedUserId={selectedUserId}
                />
              ))}

              {showCharacterMessage && currentCharacterMessage && (
                <CharacterMessage
                  message={currentCharacterMessage.content}
                  character={selectedCharacter}
                  onFinish={handleCharacterMessageFinish}
                  onSpeakEnd={() => {}}
                />
              )}

              <div ref={messagesEndRef} />
            </div>

            {isSpeaking && (
              <div className="flex items-center justify-center p-2 bg-purple-100 dark:bg-purple-900/20">
                <Button variant="outline" size="sm" onClick={stopSpeaking} className="flex items-center gap-2">
                  <VolumeX className="h-4 w-4" />
                  Arrêter la lecture
                </Button>
              </div>
            )}

            <TabsContent value="text" className="m-0 p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Écrivez votre message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} aria-label="Envoyer" disabled={isSending}>
                  <Send className="h-4 w-4" />
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
                  />
                  <Button onClick={handleSendMessage} aria-label="Envoyer" disabled={isSending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={toggleRecording}
                    variant={isRecording ? "destructive" : "default"}
                    className="flex-1"
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
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      if (messages.length > 0) {
                        const lastMessage = messages[messages.length - 1]
                        if (lastMessage.senderId !== user?.id) {
                          speakText(lastMessage.content)
                        }
                      }
                    }}
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    Lire le dernier message
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
                  />
                  <Button onClick={handleSendMessage} aria-label="Envoyer" disabled={isSending}>
                    <Send className="h-4 w-4" />
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
                  />
                  <Button onClick={handleSendMessage} aria-label="Envoyer" disabled={isSending}>
                    <Send className="h-4 w-4" />
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

