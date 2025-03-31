"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Check } from "lucide-react"
import { Character3D } from "./character-3d"

export type Character = {
  id: string
  name: string
  avatar: string
  description: string
  color?: string
}

type CharacterSelectorProps = {
  onSelect: (character: Character) => void
  selectedCharacterId?: string
}

export function CharacterSelector({ onSelect, selectedCharacterId }: CharacterSelectorProps) {
  const characters: Character[] = [
    {
      id: "handi",
      name: "Handi",
      avatar: "/placeholder.svg?height=200&width=200&text=👋&bg=purple",
      description: "L'assistant virtuel par défaut, toujours prêt à vous aider.",
      color: "#8b5cf6", // Violet
    },
    {
      id: "leo",
      name: "Léo",
      avatar: "/placeholder.svg?height=200&width=200&text=🧑‍💻&bg=blue",
      description: "Un personnage calme et réfléchi, spécialisé dans les explications détaillées.",
      color: "#3b82f6", // Bleu
    },
    {
      id: "emma",
      name: "Emma",
      avatar: "/placeholder.svg?height=200&width=200&text=👩‍🦰&bg=pink",
      description: "Dynamique et enthousiaste, Emma vous accompagne avec énergie.",
      color: "#ec4899", // Rose
    },
    {
      id: "max",
      name: "Max",
      avatar: "/placeholder.svg?height=200&width=200&text=🧙‍♂️&bg=green",
      description: "Expert technique, Max est parfait pour les questions complexes.",
      color: "#10b981", // Vert
    },
  ]

  const [selected, setSelected] = useState<string>(selectedCharacterId || "handi")

  const handleSelect = (characterId: string) => {
    setSelected(characterId)
    const character = characters.find((c) => c.id === characterId)
    if (character) {
      onSelect(character)
    }
  }

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-4">Choisissez votre assistant virtuel</h3>

        <RadioGroup value={selected} onValueChange={handleSelect} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {characters.map((character) => (
            <div key={character.id} className="relative">
              <RadioGroupItem value={character.id} id={`character-${character.id}`} className="sr-only" />
              <Label
                htmlFor={`character-${character.id}`}
                className="flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div className="relative mb-2">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                    <Character3D color={character.color} size={120} waving={true} />
                  </div>
                  {selected === character.id && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <span className="font-medium">{character.name}</span>
                <p className="text-xs text-center text-muted-foreground mt-1">{character.description}</p>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  )
}

