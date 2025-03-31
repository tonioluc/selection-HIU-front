"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { getUserById } from "./auth"

export type Message = {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: Date
  type: "text" | "voice" | "sign" | "pictogram"
  read: boolean
}

export type Conversation = {
  userId: string
  lastMessage: Message
  unreadCount: number
}

type MessagesState = {
  messages: Message[]
  conversations: Conversation[]
  getConversations: () => Conversation[]
  getMessages: (userId: string) => Message[]
  sendMessage: (message: Omit<Message, "id" | "timestamp" | "read">) => Promise<Message>
  markAsRead: (userId: string) => void
}

// Sample messages data
const messagesData: Message[] = [
  {
    id: "1",
    senderId: "bot",
    receiverId: "1",
    content: "Bonjour ! Je suis Handi, votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?",
    timestamp: new Date(2025, 2, 25, 10, 0),
    type: "text",
    read: true,
  },
  {
    id: "2",
    senderId: "1",
    receiverId: "bot",
    content: "Bonjour Handi ! Je cherche des informations sur les événements à venir.",
    timestamp: new Date(2025, 2, 25, 10, 5),
    type: "text",
    read: true,
  },
  {
    id: "3",
    senderId: "bot",
    receiverId: "1",
    content:
      "Bien sûr ! Il y a plusieurs événements à venir. Vous pouvez les consulter dans la section Événements. Souhaitez-vous des informations sur un type d'événement en particulier ?",
    timestamp: new Date(2025, 2, 25, 10, 6),
    type: "text",
    read: true,
  },
  {
    id: "4",
    senderId: "2",
    receiverId: "1",
    content: "Bonjour Marie ! Comment vas-tu aujourd'hui ?",
    timestamp: new Date(2025, 2, 24, 15, 30),
    type: "text",
    read: true,
  },
  {
    id: "5",
    senderId: "1",
    receiverId: "2",
    content: "Salut Thomas ! Ça va bien, merci. Et toi ?",
    timestamp: new Date(2025, 2, 24, 15, 45),
    type: "text",
    read: true,
  },
  {
    id: "6",
    senderId: "2",
    receiverId: "1",
    content: "Très bien ! Je voulais te demander si tu participais à l'atelier d'art la semaine prochaine ?",
    timestamp: new Date(2025, 2, 24, 15, 50),
    type: "text",
    read: false,
  },
  {
    id: "7",
    senderId: "3",
    receiverId: "1",
    content:
      "Bonjour Marie ! J'ai vu que tu t'intéressais à la photographie. J'organise une sortie photo adaptée ce weekend, ça t'intéresse ?",
    timestamp: new Date(2025, 2, 23, 9, 15),
    type: "text",
    read: true,
  },
  {
    id: "8",
    senderId: "1",
    receiverId: "3",
    content: "Bonjour Sophie ! Oui, ça m'intéresse beaucoup ! Peux-tu me donner plus de détails ?",
    timestamp: new Date(2025, 2, 23, 10, 0),
    type: "text",
    read: true,
  },
]

// Generate conversations from messages
const generateConversations = (messages: Message[], currentUserId = "1"): Conversation[] => {
  const conversationMap = new Map<string, { lastMessage: Message; unreadCount: number }>()

  // Add bot conversation first
  conversationMap.set("bot", {
    lastMessage: messages
      .filter(
        (m) =>
          (m.senderId === "bot" && m.receiverId === currentUserId) ||
          (m.senderId === currentUserId && m.receiverId === "bot"),
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0] || {
      id: "0",
      senderId: "bot",
      receiverId: currentUserId,
      content: "Bonjour ! Je suis Handi, votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?",
      timestamp: new Date(),
      type: "text",
      read: true,
    },
    unreadCount: messages.filter((m) => m.senderId === "bot" && m.receiverId === currentUserId && !m.read).length,
  })

  // Process all messages to find conversations
  messages.forEach((message) => {
    if (message.senderId === currentUserId) {
      // Messages sent by current user
      const otherUserId = message.receiverId
      if (otherUserId === "bot") return // Skip bot messages as we've already added them

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, { lastMessage: message, unreadCount: 0 })
      } else {
        const conversation = conversationMap.get(otherUserId)!
        if (message.timestamp > conversation.lastMessage.timestamp) {
          conversation.lastMessage = message
        }
      }
    } else if (message.receiverId === currentUserId) {
      // Messages received by current user
      const otherUserId = message.senderId
      if (otherUserId === "bot") return // Skip bot messages as we've already added them

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          lastMessage: message,
          unreadCount: message.read ? 0 : 1,
        })
      } else {
        const conversation = conversationMap.get(otherUserId)!
        if (message.timestamp > conversation.lastMessage.timestamp) {
          conversation.lastMessage = message
        }
        if (!message.read) {
          conversation.unreadCount += 1
        }
      }
    }
  })

  // Convert map to array of conversations
  return Array.from(conversationMap.entries()).map(([userId, data]) => ({
    userId,
    lastMessage: data.lastMessage,
    unreadCount: data.unreadCount,
  }))
}

export const useMessages = create<MessagesState>()(
  persist(
    (set, get) => ({
      messages: messagesData,
      conversations: [],
      getConversations: () => {
        // This would normally use the current user's ID from auth
        const conversations = generateConversations(get().messages)
        set({ conversations })
        return conversations
      },
      getMessages: (userId) => {
        const { messages } = get()
        return messages
          .filter(
            (message) =>
              (message.senderId === userId && message.receiverId === "1") ||
              (message.senderId === "1" && message.receiverId === userId),
          )
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      },
      sendMessage: async (messageData) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        const newMessage: Message = {
          ...messageData,
          id: String(Date.now()),
          timestamp: new Date(),
          read: false,
        }

        set((state) => ({
          messages: [...state.messages, newMessage],
        }))

        // If message is sent to bot, generate a response
        if (messageData.receiverId === "bot") {
          setTimeout(() => {
            const botResponse = generateBotResponse(messageData.content)
            const responseMessage: Message = {
              id: String(Date.now() + 1),
              senderId: "bot",
              receiverId: messageData.senderId,
              content: botResponse,
              timestamp: new Date(),
              type: "text",
              read: false,
            }

            set((state) => ({
              messages: [...state.messages, responseMessage],
            }))
          }, 1000)
        }

        return newMessage
      },
      markAsRead: (userId) => {
        set((state) => ({
          messages: state.messages.map((message) =>
            message.senderId === userId && message.receiverId === "1" && !message.read
              ? { ...message, read: true }
              : message,
          ),
        }))
      },
    }),
    {
      name: "messages-storage",
    },
  ),
)

// Helper function to generate bot responses
const generateBotResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("bonjour") || lowerMessage.includes("salut") || lowerMessage.includes("hello")) {
    return "Bonjour ! Comment puis-je vous aider aujourd'hui ?"
  }

  if (lowerMessage.includes("événement") || lowerMessage.includes("event")) {
    return "Nous avons plusieurs événements à venir ! Vous pouvez les consulter dans la section Événements. Souhaitez-vous des informations sur un type d'événement en particulier ?"
  }

  if (lowerMessage.includes("groupe") || lowerMessage.includes("group")) {
    return "Vous pouvez rejoindre différents groupes thématiques dans la section Groupes. Il y a des groupes sur la photographie, le sport, la technologie et bien d'autres sujets !"
  }

  if (lowerMessage.includes("profil") || lowerMessage.includes("profile")) {
    return "Vous pouvez modifier votre profil dans la section Mon profil. N'hésitez pas à ajouter une photo et à compléter vos informations pour que les autres utilisateurs puissent mieux vous connaître !"
  }

  if (lowerMessage.includes("accessibilité") || lowerMessage.includes("accessibility")) {
    return "HandiConnect est conçu pour être accessible à tous. Vous pouvez ajuster les paramètres d'accessibilité en cliquant sur l'icône d'engrenage dans la barre de navigation."
  }

  if (lowerMessage.includes("aide") || lowerMessage.includes("help")) {
    return "Je suis là pour vous aider ! Vous pouvez me poser des questions sur HandiConnect, les fonctionnalités disponibles ou comment utiliser la plateforme."
  }

  if (lowerMessage.includes("merci")) {
    return "Avec plaisir ! N'hésitez pas si vous avez d'autres questions."
  }

  return "Je comprends votre message. Comment puis-je vous aider davantage ?"
}

// Helper function to get user name for conversations
export const getUserNameForConversation = (userId: string): string => {
  if (userId === "bot") {
    return "Handi (Assistant)"
  }

  const user = getUserById(userId)
  return user ? user.name : "Utilisateur inconnu"
}

// Helper function to get user avatar for conversations
export const getUserAvatarForConversation = (userId: string): string => {
  if (userId === "bot") {
    return "/placeholder.svg?height=40&width=40"
  }

  const user = getUserById(userId)
  return user ? user.avatar : "/placeholder.svg?height=40&width=40"
}

