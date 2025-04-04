"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

type PictogramSelectorProps = {
  onSelect: (emoji: string) => void
}

export function PictogramSelector({ onSelect }: PictogramSelectorProps) {
  const [activeCategory, setActiveCategory] = useState("emotions")

  const categories = {
    emotions: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "🤣",
      "😂",
      "🙂",
      "🙃",
      "😉",
      "😊",
      "😇",
      "🥰",
      "😍",
      "🤩",
      "😘",
      "😗",
      "☺️",
      "😚",
      "😙",
      "🥲",
      "😋",
      "😛",
      "😜",
      "🤪",
      "😝",
      "🤑",
      "🤗",
      "🤭",
      "🤫",
      "🤔",
      "🤐",
      "🤨",
      "😐",
      "😑",
      "😶",
      "😏",
      "😒",
      "🙄",
      "😬",
      "🤥",
      "😌",
      "😔",
      "😪",
      "🤤",
      "😴",
      "😷",
      "🤒",
      "🤕",
    ],
    people: [
      "👋",
      "🤚",
      "🖐️",
      "✋",
      "🖖",
      "👌",
      "🤌",
      "🤏",
      "✌️",
      "🤞",
      "🤟",
      "🤘",
      "🤙",
      "👈",
      "👉",
      "👆",
      "🖕",
      "👇",
      "☝️",
      "👍",
      "👎",
      "✊",
      "👊",
      "🤛",
      "🤜",
      "👏",
      "🙌",
      "👐",
      "🤲",
      "🤝",
      "🙏",
      "✍️",
      "💅",
      "🤳",
      "💪",
      "🦾",
      "🦿",
      "🦵",
      "🦶",
      "👂",
      "🦻",
      "👃",
      "🧠",
      "🫀",
      "🫁",
      "🦷",
      "🦴",
      "👀",
      "👁️",
      "👅",
    ],
    activities: [
      "⚽",
      "🏀",
      "🏈",
      "⚾",
      "🥎",
      "🎾",
      "🏐",
      "🏉",
      "🥏",
      "🎱",
      "🪀",
      "🏓",
      "🏸",
      "🏒",
      "🏑",
      "🥍",
      "🏏",
      "🪃",
      "🥅",
      "⛳",
      "🪁",
      "🏹",
      "🎣",
      "🤿",
      "🥊",
      "🥋",
      "🎽",
      "🛹",
      "🛼",
      "🛷",
      "⛸️",
      "🥌",
      "🎿",
      "⛷️",
      "🏂",
      "🪂",
      "🏋️",
      "🤼",
      "🤸",
      "⛹️",
      "🤺",
      "🤾",
      "🏌️",
      "🏇",
      "🧘",
      "🏄",
      "🏊",
      "🤽",
      "🚣",
      "🧗",
    ],
    objects: [
      "🔇",
      "🔈",
      "🔉",
      "🔊",
      "📢",
      "📣",
      "📯",
      "🔔",
      "🔕",
      "🎼",
      "🎵",
      "🎶",
      "🎙️",
      "🎚️",
      "🎛️",
      "🎤",
      "🎧",
      "📻",
      "🎷",
      "🪗",
      "🎸",
      "🎹",
      "🎺",
      "🎻",
      "🪕",
      "🥁",
      "🪘",
      "📱",
      "📲",
      "☎️",
      "📞",
      "📟",
      "📠",
      "🔋",
      "🔌",
      "💻",
      "🖥️",
      "🖨️",
      "⌨️",
      "🖱️",
      "🖲️",
      "💽",
      "💾",
      "💿",
      "📀",
      "🧮",
      "🎥",
      "🎞️",
      "📽️",
      "🎬",
    ],
    phrases: [
      "👍 Oui",
      "👎 Non",
      "❓ Quoi",
      "🙋 Moi",
      "👋 Bonjour",
      "👋 Au revoir",
      "🙏 S'il vous plaît",
      "🙏 Merci",
      "❤️ J'aime",
      "😢 Triste",
      "😠 En colère",
      "😊 Content",
      "🤔 Je réfléchis",
      "🤷 Je ne sais pas",
      "🤒 Malade",
      "😴 Fatigué",
      "🥱 Ennuyé",
      "🥰 Heureux",
      "🤝 D'accord",
      "👏 Bravo",
    ],
  }

  return (
    <div className="mt-2 border rounded-md">
      <Tabs defaultValue="emotions" value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="emotions">😊</TabsTrigger>
          <TabsTrigger value="people">👋</TabsTrigger>
          <TabsTrigger value="activities">⚽</TabsTrigger>
          <TabsTrigger value="objects">📱</TabsTrigger>
          <TabsTrigger value="phrases">💬</TabsTrigger>
        </TabsList>

        {Object.entries(categories).map(([category, emojis]) => (
          <TabsContent key={category} value={category} className="m-0">
            <ScrollArea className="h-32">
              <div className="grid grid-cols-8 gap-1 p-2">
                {emojis.map((emoji, index) => (
                  <Button key={index} variant="ghost" className="h-8 px-2" onClick={() => onSelect(emoji)}>
                    {emoji}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

