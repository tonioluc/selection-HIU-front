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
  type: "text" | "voice" | "sign" | "pictogram" | "video"
  read: boolean
  characterId?: string
  positivity?: boolean
}

export type Conversation = {
  userId: string
  lastMessage: Message
  unreadCount: number
}

// Mettre à jour le type Character pour inclure le modèle 3D
export type Character = {
  id: string
  name: string
  avatar: string
  description: string
  color?: string
  model?: string
  imageUrl?: string
}

type MessagesState = {
  messages: Message[]
  conversations: Conversation[]
  selectedCharacterId: string
  currentUserId: string
  setCurrentUserId: (userId: string) => void
  getConversations: () => Conversation[]
  getMessages: (userId: string, characterId?: string) => Message[]
  sendMessage: (message: Omit<Message, "id" | "timestamp" | "read">) => Promise<Message>
  markAsRead: (userId: string) => void
  setSelectedCharacter: (characterId: string) => void
}

// Remplacer les données statiques par des données plus dynamiques
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
    characterId: "handi",
  },
  // Ajouter quelques messages de test pour s'assurer que les conversations dynamiques fonctionnent
  {
    id: "2",
    senderId: "1",
    receiverId: "2",
    content: "Bonjour Sophie, comment vas-tu ?",
    timestamp: new Date(2025, 2, 26, 11, 0),
    type: "text",
    read: true,
  },
  {
    id: "3",
    senderId: "2",
    receiverId: "1",
    content: "Bonjour ! Je vais bien, merci. Et toi ?",
    timestamp: new Date(2025, 2, 26, 11, 5),
    type: "text",
    read: true,
  },
  {
    id: "4",
    senderId: "1",
    receiverId: "3",
    content: "Salut Thomas, as-tu vu le nouvel événement ?",
    timestamp: new Date(2025, 2, 27, 9, 0),
    type: "text",
    read: true,
  },
  {
    id: "5",
    senderId: "3",
    receiverId: "1",
    content: "Oui, j'ai prévu d'y aller ! Tu viens aussi ?",
    timestamp: new Date(2025, 2, 27, 9, 15),
    type: "text",
    read: false,
  },
]

// Helper function to ensure timestamp is a Date object
const ensureDateTimestamp = (message: Message): Message => {
  const timestamp = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)
  return { ...message, timestamp }
}

// Ajouter une fonction pour générer des conversations dynamiques
const generateConversations = (messages: Message[], currentUserId = "1"): Conversation[] => {
  console.log("Generating conversations for user:", currentUserId, "with", messages.length, "messages")

  const conversationMap = new Map<string, { lastMessage: Message; unreadCount: number }>()

  // Add bot conversation first if there are messages with the bot
  const botMessages = messages.filter(
    (m) =>
      (m.senderId === "bot" && m.receiverId === currentUserId) ||
      (m.senderId === currentUserId && m.receiverId === "bot"),
  )

  if (botMessages.length > 0) {
    const sortedBotMessages = botMessages
      .map(ensureDateTimestamp)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    conversationMap.set("bot", {
      lastMessage: sortedBotMessages[0],
      unreadCount: botMessages.filter((m) => m.senderId === "bot" && m.receiverId === currentUserId && !m.read).length,
    })
  } else {
    // Add default bot message if no messages exist
    conversationMap.set("bot", {
      lastMessage: {
        id: "0",
        senderId: "bot",
        receiverId: currentUserId,
        content: "Bonjour ! Je suis Handi, votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?",
        timestamp: new Date(),
        type: "text",
        read: true,
        characterId: "handi",
      },
      unreadCount: 0,
    })
  }

  // Process all messages to find conversations
  messages.forEach((message) => {
    // Ensure message has a Date object for timestamp
    const processedMessage = ensureDateTimestamp(message)

    if (message.senderId === currentUserId) {
      // Messages sent by current user
      const otherUserId = message.receiverId
      if (otherUserId === "bot") return // Skip bot messages as we've already added them

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, { lastMessage: processedMessage, unreadCount: 0 })
      } else {
        const conversation = conversationMap.get(otherUserId)!
        if (processedMessage.timestamp > ensureDateTimestamp(conversation.lastMessage).timestamp) {
          conversation.lastMessage = processedMessage
        }
      }
    } else if (message.receiverId === currentUserId) {
      // Messages received by current user
      const otherUserId = message.senderId
      if (otherUserId === "bot") return // Skip bot messages as we've already added them

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          lastMessage: processedMessage,
          unreadCount: message.read ? 0 : 1,
        })
      } else {
        const conversation = conversationMap.get(otherUserId)!
        if (processedMessage.timestamp > ensureDateTimestamp(conversation.lastMessage).timestamp) {
          conversation.lastMessage = processedMessage
        }
        if (!message.read) {
          conversation.unreadCount += 1
        }
      }
    }
  })

  // Convert map to array of conversations
  const conversations = Array.from(conversationMap.entries())
    .map(([userId, data]) => ({
      userId,
      lastMessage: data.lastMessage,
      unreadCount: data.unreadCount,
    }))
    // Sort conversations by timestamp (most recent first)
    .sort((a, b) => {
      const timestampA = ensureDateTimestamp(a.lastMessage).timestamp.getTime()
      const timestampB = ensureDateTimestamp(b.lastMessage).timestamp.getTime()
      return timestampB - timestampA
    })

  console.log(
    "Generated conversations:",
    conversations.length,
    conversations.map((c) => c.userId),
  )
  return conversations
}

export const useMessages = create<MessagesState>()(
  persist(
    (set, get) => ({
      messages: messagesData,
      conversations: [],
      selectedCharacterId: "handi", // Personnage par défaut
      currentUserId: "1", // Valeur par défaut
      setCurrentUserId: (userId: string) => {
        set({ currentUserId: userId })
      },
      getConversations: () => {
        // Utiliser l'ID de l'utilisateur stocké dans l'état
        const currentUserId = get().currentUserId
        console.log("Getting conversations for user:", currentUserId)

        const conversations = generateConversations(get().messages, currentUserId)
        console.log("Setting conversations:", conversations.length)
        set({ conversations })
        return conversations
      },
      getMessages: (userId: string, characterId?: string) => {
        const { messages } = get()
        const currentUserId = get().currentUserId

        let filteredMessages = messages
          .filter(
            (message) =>
              (message.senderId === userId && message.receiverId === currentUserId) ||
              (message.senderId === currentUserId && message.receiverId === userId),
          )
          .map((message) => {
            // S'assurer que timestamp est un objet Date
            const timestamp = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)

            return {
              ...message,
              timestamp,
            }
          })
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

        // Si un characterId est spécifié et que l'userId est "bot", filtrer par characterId
        if (characterId && userId === "bot") {
          filteredMessages = filteredMessages.filter(
            (message) =>
              // Inclure les messages de l'utilisateur vers le bot
              message.senderId === currentUserId ||
              // Pour les messages du bot, vérifier le characterId
              (message.senderId === "bot" && (!message.characterId || message.characterId === characterId)),
          )
        }

        return filteredMessages
      },
      sendMessage: async (messageData) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        console.log("Sending message with data:", messageData)

        const newMessage: Message = {
          ...messageData,
          id: String(Date.now()),
          timestamp: new Date(),
          read: false,
        }

        set((state) => {
          const newMessages = [...state.messages, newMessage]
          console.log("Updated messages count:", newMessages.length)
          return { messages: newMessages }
        })

        // Mettre à jour les conversations immédiatement
        setTimeout(() => {
          get().getConversations()
        }, 100)

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
              characterId: get().selectedCharacterId, // Utiliser le personnage sélectionné
            }

            set((state) => {
              const newMessages = [...state.messages, responseMessage]
              console.log("Updated messages with bot response, count:", newMessages.length)
              return { messages: newMessages }
            })

            // Mettre à jour les conversations après la réponse du bot
            setTimeout(() => {
              get().getConversations()
            }, 100)
          }, 1000)
        }

        return newMessage
      },
      markAsRead: (userId) => {
        const currentUserId = get().currentUserId
        set((state) => ({
          messages: state.messages.map((message) =>
            message.senderId === userId && message.receiverId === currentUserId && !message.read
              ? { ...message, read: true }
              : message,
          ),
        }))
      },
      setSelectedCharacter: (characterId) => {
        set({ selectedCharacterId: characterId })
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
    return "/placeholder.svg?height=40&width=40&text=H&bg=purple"
  }

  const user = getUserById(userId)
  return user ? user.avatar : "/placeholder.svg?height=40&width=40"
}

