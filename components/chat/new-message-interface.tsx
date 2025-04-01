"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useMessages, getUserNameForConversation, getUserAvatarForConversation } from "@/lib/messages"
import { useAuth, getAllUsers } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Send, Loader2, ArrowLeft } from "lucide-react"

export function NewMessageInterface() {
  const searchParams = useSearchParams()
  const userIdParam = searchParams.get("userId")
  const redirectParam = searchParams.get("redirect")

  const [selectedUserId, setSelectedUserId] = useState(userIdParam || "")
  const [messageContent, setMessageContent] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const { user } = useAuth()
  const { sendMessage, getConversations } = useMessages()
  const { toast } = useToast()
  const router = useRouter()

  // Charger les utilisateurs disponibles
  useEffect(() => {
    // Si un userId est fourni dans l'URL, le sélectionner automatiquement
    if (userIdParam) {
      console.log("Setting selected user from URL parameter:", userIdParam)
      setSelectedUserId(userIdParam)
    }

    // Charger les utilisateurs disponibles
    const users = getAllUsers().filter((u) => u.id !== user?.id)
    setAvailableUsers(users)
  }, [user?.id, userIdParam])

  const handleSendMessage = async () => {
    if (!selectedUserId) {
      toast({
        title: "Destinataire requis",
        description: "Veuillez sélectionner un destinataire pour votre message.",
        variant: "destructive",
      })
      return
    }

    if (!messageContent.trim()) {
      toast({
        title: "Message vide",
        description: "Veuillez écrire un message avant de l'envoyer.",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)

    try {
      console.log(`Envoi d'un message à l'utilisateur ${selectedUserId}: ${messageContent}`)

      // Envoyer le message
      const sentMessage = await sendMessage({
        senderId: user?.id || "1",
        receiverId: selectedUserId,
        content: messageContent,
        type: "text",
      })

      // Forcer la mise à jour des conversations pour s'assurer que la nouvelle conversation apparaît
      getConversations()

      toast({
        title: "Message envoyé",
        description: `Votre message a été envoyé à ${getUserNameForConversation(selectedUserId)}.`,
      })

      // Rediriger vers la conversation ou la page spécifiée dans le paramètre redirect
      if (redirectParam) {
        console.log(`Redirection vers ${redirectParam}`)
        router.push(redirectParam)
      } else {
        console.log(`Redirection vers la conversation avec userId=${selectedUserId}`)
        router.push(`/chat`)
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi du message.",
        variant: "destructive",
      })
      setIsSending(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="recipient">Destinataire</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="recipient" className="w-full">
                <SelectValue placeholder="Sélectionner un destinataire" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bot">Assistant Handi</SelectItem>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id} className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUserId && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
              <Avatar>
                <AvatarImage src={getUserAvatarForConversation(selectedUserId)} />
                <AvatarFallback>
                  {getUserNameForConversation(selectedUserId).substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{getUserNameForConversation(selectedUserId)}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedUserId === "bot" ? "Assistant virtuel" : "Utilisateur"}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Écrivez votre message ici..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>

          <div className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href={redirectParam || "/chat"}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Link>
            </Button>
            <Button onClick={handleSendMessage} disabled={isSending || !selectedUserId || !messageContent.trim()}>
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

