"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { MainNavigation } from "@/components/main-navigation"
import { ChatInterface } from "@/components/chat/chat-interface"
import { useMessages, getUserNameForConversation, getUserAvatarForConversation } from "@/lib/messages"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MessageSquare, PenSquare } from "lucide-react"
import Link from "next/link"

export default function ChatPage() {
  const { getConversations, markAsRead } = useMessages()
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("bot")
  const [searchTerm, setSearchTerm] = useState("")

  // Récupérer le paramètre userId de l'URL
  const searchParams = useSearchParams()
  const userIdParam = searchParams.get("userId")

  useEffect(() => {
    // Récupérer les conversations à chaque fois que la page est chargée
    const convos = getConversations()
    setConversations(convos)

    // Si un userId est spécifié dans l'URL, l'utiliser
    if (userIdParam) {
      setSelectedUserId(userIdParam)
      console.log("URL parameter userId:", userIdParam)
    }

    // Mark messages as read when conversation is selected
    if (selectedUserId) {
      markAsRead(selectedUserId)
    }
  }, [getConversations, markAsRead, userIdParam, selectedUserId])

  // Effet pour surveiller les changements de selectedUserId
  useEffect(() => {
    if (selectedUserId) {
      console.log("Selected user ID changed to:", selectedUserId)
      markAsRead(selectedUserId)
    }
  }, [selectedUserId, markAsRead])

  const filteredConversations = conversations.filter((convo) =>
    getUserNameForConversation(convo.userId).toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      <MainNavigation />

      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-400">Chat Multimodal</h1>
          <Button asChild>
            <Link href="/new-message" className="flex items-center gap-2">
              <PenSquare className="h-4 w-4" />
              Nouveau message
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une conversation..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="h-[500px] overflow-y-auto">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((convo) => (
                  <Button
                    key={convo.userId}
                    variant="ghost"
                    className={`w-full justify-start px-4 py-3 h-auto ${
                      selectedUserId === convo.userId ? "bg-purple-50 dark:bg-purple-900/20" : ""
                    }`}
                    onClick={() => setSelectedUserId(convo.userId)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={getUserAvatarForConversation(convo.userId)} />
                          <AvatarFallback>
                            {getUserNameForConversation(convo.userId).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {convo.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {convo.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium truncate">{getUserNameForConversation(convo.userId)}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {convo.lastMessage.content.length > 30
                            ? convo.lastMessage.content.substring(0, 30) + "..."
                            : convo.lastMessage.content}
                        </p>
                      </div>
                    </div>
                  </Button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-4">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground">Aucune conversation trouvée</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/new-message">Démarrer une conversation</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            <ChatInterface selectedUserId={selectedUserId} />
          </div>
        </div>
      </div>
    </main>
  )
}

