"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, Send, Video, VideoOff, MessageSquare, Smile, Volume2, VolumeX } from "lucide-react"
import { ChatMessage } from "./chat-message"
import { SignLanguageView } from "./sign-language-view"
import { PictogramSelector } from "./pictogram-selector"
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
  const { getMessages, sendMessage } = useMessages()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [activeTab, setActiveTab] = useState("text")
  const [isRecording, setIsRecording] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [speechRecognition, setSpeechRecognition] = useState<any>(null)

  // Load messages when selectedUserId changes
  useEffect(() => {
    if (selectedUserId) {
      const userMessages = getMessages(selectedUserId)
      setMessages(userMessages)
    }
  }, [selectedUserId, getMessages])

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
  }, [messages])

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

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn)
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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-0">
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
                <div className="flex justify-between items-center mt-2">
                  <Button onClick={toggleVideo} variant={isVideoOn ? "destructive" : "default"}>
                    {isVideoOn ? (
                      <>
                        <VideoOff className="h-4 w-4 mr-2" />
                        Arrêter la caméra
                      </>
                    ) : (
                      <>
                        <Video className="h-4 w-4 mr-2" />
                        Activer la caméra
                      </>
                    )}
                  </Button>
                  {isVideoOn && (
                    <p className="text-sm text-muted-foreground">
                      Faites des signes devant la caméra pour qu'ils soient traduits
                    </p>
                  )}
                </div>
                {isVideoOn && <SignLanguageView onSignDetected={handleSignLanguageResult} />}
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

