"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Volume2 } from "lucide-react"
import { getUserAvatarForConversation, getUserNameForConversation } from "@/lib/messages"
import { isValidURL, convertYouTubeUrl } from "@/lib/api-service"

type MessageProps = {
  message: {
    id: string
    senderId: string
    receiverId: string
    content: string
    timestamp: Date
    type: "text" | "voice" | "sign" | "pictogram"
    read: boolean
    positivity: boolean
  }
  currentUserId: string
  selectedUserId: string
  onSpeakText?: (text: string) => void
}

export function ChatMessage({ message, currentUserId, selectedUserId, onSpeakText }: MessageProps) {
  const isCurrentUser = message.senderId === currentUserId
  const isSystem = message.senderId === "bot"
  const otherUserId = isCurrentUser ? message.receiverId : message.senderId

  // Get the name and avatar for the message sender
  const senderName = isCurrentUser ? "Vous" : getUserNameForConversation(message.senderId)
  const senderAvatar = isCurrentUser
    ? "/placeholder.svg?height=40&width=40"
    : getUserAvatarForConversation(message.senderId)

  return (
    <div className={cn("flex gap-3 mb-4", isCurrentUser ? "justify-end" : "justify-start")}>
      {!isCurrentUser && (
        <Avatar>
          <AvatarImage src={senderAvatar} />
          <AvatarFallback>{isSystem ? "SY" : senderName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn("max-w-[80%]", isSystem && "w-full")}>
        <div
          className={cn(
            "rounded-lg px-4 py-2 group relative",
            isCurrentUser
              ? (message.positivity ? "bg-purple-600 text-white" : "bg-red-600 text-white")
              : isSystem
                ? "bg-gray-100 dark:bg-gray-800 w-full text-center"
                : "bg-gray-200 dark:bg-gray-700",
          )}
        >
          {isValidURL(message.content) ? (
            <iframe
              src={convertYouTubeUrl(message.content)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube video player"
            />
            ) : (
              <>
                {message.type === "pictogram" ? (
                  <p className="text-xl">{message.content}</p>
                ) : (
                  <p>{message.content}</p>
                )}
              </>
            )}

          {onSpeakText && !isSystem && !isCurrentUser && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
              onClick={() => onSpeakText(message.content)}
              aria-label="Lire à haute voix"
            >
              <Volume2 className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className={cn("text-xs text-gray-500 mt-1", isCurrentUser ? "text-right" : "text-left")}>
          {!isSystem && (
            <>
              <span className="font-medium">{senderName}</span>
              {" • "}
            </>
          )}
          <span>{message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          {message.type !== "text" && (
            <span className="ml-1">
              {" • "}
              {message.type === "voice" && "🎤"}
              {message.type === "sign" && "👋"}
              {message.type === "pictogram" && "😊"}
            </span>
          )}
          {message.positivity == false && (
            <span className="ml-1">
              {" • "}
              {"Message blessant ❌"}
            </span>
          )}
        </div>
      </div>

      {isCurrentUser && (
        <Avatar>
          <AvatarImage src="/placeholder.svg?height=40&width=40" />
          <AvatarFallback>{senderName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}

