"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, VolumeX, HelpCircle, X, Image, Send, Calendar, Users, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth"
import { useMessages, getUserNameForConversation } from "@/lib/messages"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [speechRecognition, setSpeechRecognition] = useState<any>(null)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [imageCaption, setImageCaption] = useState("")
  const router = useRouter()
  const { toast } = useToast()
  const { user, isAuthenticated } = useAuth()
  const { getConversations, sendMessage } = useMessages()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

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

        setTranscript(transcript)

        // Process command after a short delay
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
          processCommand(transcript)
        }, 1000)
      }

      recognition.onend = () => {
        if (isListening) {
          recognition.start()
        }
      }

      setSpeechRecognition(recognition)

      // Add event listener for toggling the assistant from the navigation
      const handleToggleAssistant = () => {
        setIsOpen(true)
      }

      document.addEventListener("toggleVoiceAssistant", handleToggleAssistant)

      return () => {
        document.removeEventListener("toggleVoiceAssistant", handleToggleAssistant)
      }
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isListening])

  const toggleListening = () => {
    if (!speechRecognition) {
      toast({
        title: "Fonctionnalité non supportée",
        description: "La reconnaissance vocale n'est pas supportée par votre navigateur.",
        variant: "destructive",
      })
      return
    }

    if (isListening) {
      // Si on écoute déjà, on arrête
      speechRecognition.stop()
      setIsListening(false)
      setTranscript("")
    } else {
      // Si on ne parle pas déjà, on commence à écouter
      if (isSpeaking) {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
      }

      // Commencer à écouter
      try {
        speechRecognition.start()
        setIsListening(true)
      } catch (error) {
        console.error("Erreur lors du démarrage de la reconnaissance vocale:", error)
        // Réinitialiser en cas d'erreur
        setIsListening(false)
      }
    }
  }

  const speak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // TOUJOURS arrêter l'écoute avant de parler
      if (speechRecognition) {
        try {
          speechRecognition.stop()
        } catch (error) {
          console.error("Erreur lors de l'arrêt de la reconnaissance vocale:", error)
        }
      }
      setIsListening(false)

      // Annuler toute synthèse vocale en cours
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "fr-FR"

      utterance.onstart = () => {
        setIsSpeaking(true)
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        // Ne JAMAIS reprendre l'écoute automatiquement
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

  const processCommand = (command: string) => {
    // TOUJOURS arrêter l'écoute après avoir capté une commande
    if (speechRecognition) {
      try {
        speechRecognition.stop()
      } catch (error) {
        console.error("Erreur lors de l'arrêt de la reconnaissance vocale:", error)
      }
    }
    setIsListening(false)

    // Traiter la commande seulement si elle n'est pas vide
    if (!command.trim()) return

    const lowerCommand = command.toLowerCase()

    // Commandes de salutation
    if (lowerCommand.includes("dis bonjour") || lowerCommand.includes("dit bonjour")) {
      // Extraire le nom de la personne
      const nameMatch = lowerCommand.match(/(?:dis|dit) bonjour (?:à|a) (.+)/i)
      if (nameMatch && nameMatch[1]) {
        const name = nameMatch[1].trim()
        speak(`Bonjour ${name}, comment allez-vous aujourd'hui ?`)
        return
      } else {
        speak("Bonjour ! Comment puis-je vous aider aujourd'hui ?")
        return
      }
    }

    // Commandes de message
    if (lowerCommand.includes("envoie") || lowerCommand.includes("envoyer")) {
      if (lowerCommand.includes("image") || lowerCommand.includes("photo")) {
        // Extract recipient name
        const toMatch = lowerCommand.match(/à\s+(\w+)/i) || lowerCommand.match(/pour\s+(\w+)/i)
        if (toMatch && toMatch[1]) {
          const recipientName = toMatch[1].toLowerCase()

          // Get conversations to find the recipient
          const conversations = getConversations()
          const matchedContact = conversations.find((convo) =>
            getUserNameForConversation(convo.userId).toLowerCase().includes(recipientName),
          )

          if (matchedContact) {
            setSelectedContact(matchedContact.userId)
            setIsImageDialogOpen(true)
            speak(`Préparation d'un envoi d'image à ${getUserNameForConversation(matchedContact.userId)}`)
          } else {
            speak(`Je n'ai pas trouvé de contact nommé ${recipientName}. Veuillez réessayer.`)
          }
        } else {
          speak("À qui souhaitez-vous envoyer une image ?")
        }
        return
      } else if (lowerCommand.includes("message")) {
        // Extract recipient name and message content
        const toMatch = lowerCommand.match(/à\s+(\w+)/i) || lowerCommand.match(/pour\s+(\w+)/i)
        const messageMatch = lowerCommand.match(/message\s+(.+?)(?:\s+à|\s+pour|$)/i)

        if (toMatch && toMatch[1] && messageMatch && messageMatch[1]) {
          const recipientName = toMatch[1].toLowerCase()
          const messageContent = messageMatch[1].trim()

          // Get conversations to find the recipient
          const conversations = getConversations()
          const matchedContact = conversations.find((convo) =>
            getUserNameForConversation(convo.userId).toLowerCase().includes(recipientName),
          )

          if (matchedContact && messageContent) {
            // Send the message
            sendMessage({
              senderId: user?.id || "1",
              receiverId: matchedContact.userId,
              content: messageContent,
              type: "text",
            }).then(() => {
              speak(`Message envoyé à ${getUserNameForConversation(matchedContact.userId)}`)
            })
          } else if (!matchedContact) {
            speak(`Je n'ai pas trouvé de contact nommé ${recipientName}. Veuillez réessayer.`)
          } else {
            speak("Quel message souhaitez-vous envoyer ?")
          }
        } else if (toMatch && toMatch[1]) {
          speak(`Quel message souhaitez-vous envoyer à ${toMatch[1]} ?`)
        } else {
          speak("À qui souhaitez-vous envoyer un message et quel est son contenu ?")
        }
        return
      }
    }

    // Navigation commands
    if (lowerCommand.includes("accueil") || lowerCommand.includes("page d'accueil")) {
      speak("Je vous redirige vers la page d'accueil.")
      router.push("/")
    } else if (lowerCommand.includes("tableau de bord") || lowerCommand.includes("dashboard")) {
      speak("Je vous redirige vers le tableau de bord.")
      router.push("/dashboard")
    } else if (lowerCommand.includes("chat") || lowerCommand.includes("messagerie")) {
      speak("Je vous redirige vers le chat.")
      router.push("/chat")
    } else if (lowerCommand.includes("profil") && !lowerCommand.includes("profils")) {
      speak("Je vous redirige vers votre profil.")
      router.push("/profile")
    } else if (lowerCommand.includes("profils") || lowerCommand.includes("utilisateurs")) {
      speak("Je vous redirige vers la liste des profils.")
      router.push("/profiles")
    } else if (lowerCommand.includes("événement") || lowerCommand.includes("evenement")) {
      speak("Je vous redirige vers les événements.")
      router.push("/events")
    } else if (lowerCommand.includes("groupe")) {
      speak("Je vous redirige vers les groupes.")
      router.push("/groups")
    } else if (
      lowerCommand.includes("connexion") ||
      lowerCommand.includes("se connecter") ||
      lowerCommand.includes("login")
    ) {
      speak("Je vous redirige vers la page de connexion.")
      router.push("/login")
    } else if (
      lowerCommand.includes("inscription") ||
      lowerCommand.includes("s'inscrire") ||
      lowerCommand.includes("register")
    ) {
      speak("Je vous redirige vers la page d'inscription.")
      router.push("/register")
    } else if (lowerCommand.includes("équipe") || lowerCommand.includes("team")) {
      speak("Je vous redirige vers la page de l'équipe.")
      router.push("/team")
    } else if (lowerCommand.includes("admin") || lowerCommand.includes("administration")) {
      speak("Je vous redirige vers le panneau d'administration.")
      router.push("/admin")
    }
    // Status commands
    else if (lowerCommand.includes("qui suis-je") || lowerCommand.includes("mon nom")) {
      speak(`Vous êtes ${user?.name || "un utilisateur connecté"}. Vous êtes connecté à HandiConnect.`)
    } else if (lowerCommand.includes("mes messages") || lowerCommand.includes("mes conversations")) {
      const conversations = getConversations()
      const unreadCount = conversations.reduce((count, convo) => count + convo.unreadCount, 0)

      speak(`Vous avez ${conversations.length} conversations et ${unreadCount} messages non lus.`)
    } else if (lowerCommand.includes("mes événements") || lowerCommand.includes("mes evenements")) {
      speak(`Vous êtes inscrit à ${user?.registeredEvents?.length || 0} événements.`)
    } else if (lowerCommand.includes("mes groupes")) {
      speak(`Vous êtes membre de ${user?.joinedGroups?.length || 0} groupes.`)
    }
    // Help commands
    else if (lowerCommand.includes("aide") || lowerCommand.includes("help")) {
      speak(
        "Je peux vous aider à naviguer sur HandiConnect. Vous pouvez me demander d'aller à la page d'accueil, au tableau de bord, au chat, aux profils, aux événements, aux groupes. Vous pouvez aussi me demander de dire bonjour à quelqu'un, par exemple 'dis bonjour à Thomas'. Ou encore envoyer des messages comme 'envoie un message à Marie'.",
      )
    }
    // Close assistant
    else if (lowerCommand.includes("fermer") || lowerCommand.includes("au revoir")) {
      speak("Au revoir !")
      setIsOpen(false)
      setIsListening(false)
      if (speechRecognition) {
        try {
          speechRecognition.stop()
        } catch (error) {
          console.error("Erreur lors de l'arrêt de la reconnaissance vocale:", error)
        }
      }
    }
    // Unknown command
    else {
      speak(
        "Désolé, je n'ai pas compris votre demande. Pouvez-vous reformuler ? Dites 'aide' pour connaître les commandes disponibles.",
      )
    }
  }

  const handleSendImage = async () => {
    if (!selectedContact) return

    try {
      // Send a message with image description
      await sendMessage({
        senderId: user?.id || "1",
        receiverId: selectedContact,
        content: `[Image] ${imageCaption || "Image sans description"}`,
        type: "text",
      })

      toast({
        title: "Image envoyée",
        description: `Image envoyée à ${getUserNameForConversation(selectedContact)}`,
      })

      speak(`Image envoyée à ${getUserNameForConversation(selectedContact)}`)

      // Reset and close dialog
      setImageCaption("")
      setSelectedContact(null)
      setIsImageDialogOpen(false)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de l'image.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      {/* Floating button to open assistant */}
      {!isOpen && (
        <Button
          className="fixed bottom-4 right-4 rounded-full h-12 w-12 shadow-lg"
          onClick={() => setIsOpen(true)}
          aria-label="Assistant vocal"
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Assistant panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-4 bg-purple-600 text-white flex justify-between items-center">
            <h3 className="font-medium">Assistant Vocal</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-purple-700"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4">
            <div className="mb-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {isListening ? "Je vous écoute..." : "Cliquez sur le microphone pour activer l'assistant vocal"}
              </p>

              {transcript && <div className="bg-muted p-2 rounded-md mb-2 text-sm">"{transcript}"</div>}

              <div className="flex justify-center gap-2">
                <Button
                  variant={isListening ? "destructive" : "default"}
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={toggleListening}
                >
                  {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>

                {isSpeaking && (
                  <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={stopSpeaking}>
                    <VolumeX className="h-6 w-6" />
                  </Button>
                )}
              </div>

              {!isListening && !isSpeaking && transcript && (
                <p className="text-xs text-muted-foreground mt-2">
                  Cliquez à nouveau sur le microphone pour poser une autre question
                </p>
              )}
            </div>

            <div className="text-sm">
              <p className="font-medium mb-1">Exemples de commandes :</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>"Dis bonjour à Thomas"</li>
                <li>"Va à la page d'accueil"</li>
                <li>"Ouvre le chat"</li>
                <li>"Montre-moi les événements"</li>
                <li>"Envoie un message à Marie"</li>
                <li>"Aide-moi"</li>
              </ul>
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">Actions rapides :</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col items-center h-auto py-2"
                  onClick={() => router.push("/chat")}
                >
                  <MessageSquare className="h-4 w-4 mb-1" />
                  <span className="text-xs">Chat</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col items-center h-auto py-2"
                  onClick={() => router.push("/events")}
                >
                  <Calendar className="h-4 w-4 mb-1" />
                  <span className="text-xs">Événements</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col items-center h-auto py-2"
                  onClick={() => router.push("/groups")}
                >
                  <Users className="h-4 w-4 mb-1" />
                  <span className="text-xs">Groupes</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Image Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer une image</DialogTitle>
            <DialogDescription>
              {selectedContact && (
                <div className="flex items-center gap-2 mt-2">
                  <span>À :</span>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>
                      {getUserNameForConversation(selectedContact).substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{getUserNameForConversation(selectedContact)}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center">
              <Image className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Glissez-déposez une image ici ou cliquez pour parcourir
              </p>
              <Input type="file" className="hidden" id="image-upload" accept="image/*" />
              <Label htmlFor="image-upload" className="text-sm text-purple-600 cursor-pointer">
                Parcourir
              </Label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="caption">Description de l'image</Label>
              <Input
                id="caption"
                placeholder="Ajoutez une description..."
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSendImage}>
              <Send className="h-4 w-4 mr-2" />
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

