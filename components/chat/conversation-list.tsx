"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Search, UserPlus, X } from "lucide-react"
import { useMessages, getUserNameForConversation, getUserAvatarForConversation } from "@/lib/messages"
import { useAuth, getAllUsers } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export function ConversationList() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const { getConversations, sendMessage } = useMessages()
  const [conversations, setConversations] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [newMessageUserId, setNewMessageUserId] = useState("")
  const [newMessageContent, setNewMessageContent] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<any[]>([])

  // Charger les conversations et les utilisateurs disponibles
  useEffect(() => {
    // Charger les conversations
    const loadedConversations = getConversations()
    console.log("Loaded conversations:", loadedConversations.length)
    setConversations(loadedConversations)

    // Charger les utilisateurs disponibles
    const users = getAllUsers().filter((u) => u.id !== user?.id)
    setAvailableUsers(users)
  }, [getConversations, user?.id])

  // Rafraîchir les conversations périodiquement
  useEffect(() => {
    const intervalId = setInterval(() => {
      const updatedConversations = getConversations()
      setConversations(updatedConversations)
    }, 2000) // Rafraîchir toutes les 2 secondes

    return () => clearInterval(intervalId)
  }, [getConversations])

  // Filtrer les conversations en fonction du terme de recherche
  const filteredConversations = conversations.filter((conversation) => {
    const userName = getUserNameForConversation(conversation.userId)
    return userName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Trier les conversations par date du dernier message
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
  })

  // Fonction pour ouvrir une conversation
  const openConversation = (userId: string) => {
    router.push(`/chat?userId=${userId}`)
  }

  // Fonction pour envoyer un nouveau message
  const handleSendNewMessage = async () => {
    if (!newMessageUserId || !newMessageContent.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un destinataire et saisir un message.",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)

    try {
      // Correction ici : s'assurer que le message est envoyé au bon destinataire
      await sendMessage({
        senderId: user?.id || "1",
        receiverId: newMessageUserId, // Utiliser l'ID du destinataire sélectionné
        content: newMessageContent,
        type: "text",
      })

      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès.",
      })

      // Réinitialiser le formulaire
      setNewMessageUserId("")
      setNewMessageContent("")
      setIsDialogOpen(false)

      // Recharger les conversations
      const updatedConversations = getConversations()
      setConversations(updatedConversations)

      // Rediriger vers la conversation avec l'utilisateur sélectionné
      router.push(`/chat?userId=${newMessageUserId}`)
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

  // Fonction pour supprimer une conversation
  const deleteConversation = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    // Simuler la suppression (dans une vraie application, vous appelleriez une API)
    setConversations((prev) => prev.filter((conv) => conv.userId !== userId))

    toast({
      title: "Conversation supprimée",
      description: "La conversation a été supprimée avec succès.",
    })
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Conversations</CardTitle>
          <Button variant="outline" size="sm" className="flex items-center gap-2" asChild>
            <Link href="/new-message">
              <UserPlus className="h-4 w-4" />
              <span>Nouveau message</span>
            </Link>
          </Button>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une conversation..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {sortedConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune conversation trouvée</p>
              {searchTerm && <p className="text-sm mt-1">Essayez avec un autre terme de recherche</p>}
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/new-message">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Démarrer une nouvelle conversation
                </Link>
              </Button>
            </div>
          ) : (
            sortedConversations.map((conversation) => {
              const userName = getUserNameForConversation(conversation.userId)
              const userAvatar = getUserAvatarForConversation(conversation.userId)
              const isBot = conversation.userId === "bot"
              const lastMessageTime = new Date(conversation.lastMessage.timestamp)
              const formattedTime = lastMessageTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              const formattedDate = lastMessageTime.toLocaleDateString([], { day: "2-digit", month: "2-digit" })

              return (
                <div
                  key={conversation.userId}
                  className="p-4 hover:bg-accent cursor-pointer transition-colors relative group"
                  onClick={() => openConversation(conversation.userId)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={userAvatar} />
                      <AvatarFallback>{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium truncate">{userName}</h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formattedTime} • {formattedDate}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage.type === "video" ? (
                          <span className="italic">Vidéo</span>
                        ) : (
                          conversation.lastMessage.content
                        )}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="default" className="ml-2">
                        {conversation.unreadCount}
                      </Badge>
                    )}

                    {/* Bouton de suppression qui apparaît au survol */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => deleteConversation(conversation.userId, e)}
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}

