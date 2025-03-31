"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, Send, Video, MessageSquare, Smile, Volume2, VolumeX, Loader2 } from "lucide-react"
import { ChatMessage } from "./chat-message"
import { SignLanguageView } from "./sign-language-view"
import { PictogramSelector } from "./pictogram-selector"
import { CharacterSelector, type Character } from "./character-selector"
import { CharacterMessage } from "./character-message"
import { addreportedUsers, getUserById, useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useMessages, type Message } from "@/lib/messages"
import { callMistralAPI, isValidURL } from "@/lib/api-service"
import { generateSpeech, playAudio, stopAudio } from "@/lib/openai-tts"

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
  const [isMuted, setIsMuted] = useState(false)
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
  const [speechRecognition, setSpeechRecognition] = useState<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Modifier la fonction de chargement des messages pour filtrer par personnage
  // Remplacer le bloc useEffect qui charge les messages par celui-ci:
  const [response, setResponse] = useState(null);

  // Load messages when selectedUserId changes or when character changes
  useEffect(() => {
    if (selectedUserId) {
      // Mettre à jour l'appel à getMessages pour passer le characterId
      // Remplacer la ligne:
      // const userMessages = getMessages(selectedUserId);
      // Par:
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
      const lastBotMessage = filteredMessages
        .filter((msg) => msg.senderId === "bot" && msg.characterId === selectedCharacter.id)
        .pop()

      if (lastBotMessage && selectedUserId === "bot") {
        setCurrentCharacterMessage(lastBotMessage)
        setShowCharacterMessage(true)
      }
    }
  }, [selectedUserId, getMessages, user?.id, selectedCharacter.id])

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

  // Mise à jour de la fonction speakText pour utiliser la solution de secours
  const speakText = async (text: string) => {
    if (isMuted) {
      console.log("Lecture ignorée - son désactivé")
      return
    }

    try {
      setIsSpeaking(true)
      console.log("ChatInterface - Génération de la parole pour:", text.substring(0, 50) + "...")

      // Arrêter l'audio précédent si nécessaire
      if (audioRef.current) {
        stopAudio(audioRef.current)
      }

      // Générer l'audio avec OpenAI TTS via notre API
      const url = await generateSpeech(text, "alloy")

      if (!url) {
        console.error("Échec de la génération audio - URL null")
        setIsSpeaking(false)
        return
      }

      // Jouer l'audio (avec le texte pour la solution de secours)
      console.log("Tentative de lecture audio...")
      audioRef.current = playAudio(url, text, () => {
        console.log("Callback de fin de lecture appelé")
        setIsSpeaking(false)
      })

      if (!audioRef.current) {
        console.error("Échec de la création de l'élément audio")
        setIsSpeaking(false)
      }
    } catch (error) {
      console.error("Erreur lors de la synthèse vocale:", error)
      setIsSpeaking(false)
    }
  }

  // Nettoyer les ressources audio lors du démontage du composant
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        stopAudio(audioRef.current)
      }
    }
  }, [])

  const stopSpeaking = () => {
    if (audioRef.current) {
      stopAudio(audioRef.current)
    }
    setIsSpeaking(false)
  }

  // Modifier la fonction handleSendMessage pour utiliser l'API TTS d'OpenAI
  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return;

    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour envoyer des messages.",
        variant: "destructive",
      });
      return;
    }

    const sentimentMessage = async (message: string) => {
      const data = { inputs: message };

      try {
        const res = await fetch("https://hiu-interne-back.onrender.com/sentiment-controller", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          throw new Error("Erreur dans la requête");
        }

        return await res.json();
      } catch (error) {
        console.error("Erreur :", error);
        return null; // Retourne null en cas d'erreur
      }
    };

    setIsSending(true)
    setIsLoading(true)

    try {
      // Envoyer le message de l'utilisateur
      const newMessage = await sendMessage({
        senderId: user!.id,
        receiverId: selectedUserId,
        content: inputValue,
        type: activeTab as "text" | "voice" | "sign" | "pictogram",
        positivity: true,
      });

      const sentimentResponse = await sentimentMessage(newMessage.content);
      console.log(newMessage.content + " : " + sentimentResponse["sentiment"]);

      // Mise à jour de "positivity" basée sur la réponse
      if (sentimentResponse != null && sentimentResponse["sentiment"] != "1") 
      {
        newMessage.positivity = false;

        // Récupération des infos de l'utilisateur
        if(user)
        {
          const userReport = getUserById(user.id);

          if(userReport)
          {
            // Ajout à la liste des utilisateurs signalés
            addreportedUsers({
              id: userReport.id,
              name: userReport.name,
              email: userReport.email,
              reason: "Message Négative",
              reportedBy: "Handi", // Signaler Par l'IA
              date: new Date(),
            });
          }
          
        }
      }
      else newMessage.positivity = true;

      setMessages((prev) => [...prev, newMessage]);

      setInputValue("");

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
          }

          setCurrentCharacterMessage(botResponse)
          setShowCharacterMessage(true)

          toast({
            title: "Utilisation de la réponse de secours",
            description: "L'API n'a pas pu être contactée, une vidéo de démonstration est utilisée à la place.",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi du message.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false)
      setIsLoading(false)
    }
  };


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

  // Modifier la fonction handleCharacterSelect pour réinitialiser les messages
  // Remplacer la fonction handleCharacterSelect par celle-ci:

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

  // Modifier la fonction handleCharacterMessageFinish pour activer la synthèse vocale
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
          <div className="flex justify-end px-4 py-2 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              className="ml-auto"
              aria-label={isMuted ? "Activer le son" : "Désactiver le son"}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              <span className="ml-2">{isMuted ? "Son désactivé" : "Son activé"}</span>
            </Button>
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
                  isMuted={isMuted}
                />
              ))}

              {showCharacterMessage && currentCharacterMessage && (
                <CharacterMessage
                  message={currentCharacterMessage.content}
                  character={selectedCharacter}
                  onFinish={handleCharacterMessageFinish}
                  onSpeakEnd={() => {}}
                  isMuted={isMuted}
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
                    disabled={isMuted}
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

