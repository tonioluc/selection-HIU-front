"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Check } from "lucide-react"
import Image from "next/image"

export type Character = {
  id: string
  name: string
  avatar: string
  description: string
  color?: string
  model?: string
  imageUrl?: string
}

type CharacterSelectorProps = {
  onSelect: (character: Character) => void
  selectedCharacterId?: string
}

export function CharacterSelector({ onSelect, selectedCharacterId }: CharacterSelectorProps) {
  // Modifier la définition des personnages pour utiliser les nouvelles images
  const characters: Character[] = [
    {
      id: "handi",
      name: "Emma",
      avatar: "/placeholder.svg?height=200&width=200&text=🦆&bg=blue",
      description: "Emma, l'assistante virtuelle enjouée et expressive, toujours prête à vous aider.",
      color: "#e57373", // Rouge clair
      model: "donald_duck", // Nom du modèle 3D
      imageUrl:
        "/emma.gif",
    },
    {
      id: "leo",
      name: "Sophia",
      avatar: "/placeholder.svg?height=200&width=200&text=🧑‍💻&bg=indigo",
      description: "Un personnage calme et réfléchi, spécialisé dans les explications détaillées.",
      color: "#9575cd", // Violet
      model: "donald_duck", // Utiliser le modèle Donald Duck comme fallback
      imageUrl:
        "/sophia.gif",
    },
    {
      id: "emma",
      name: "Lily",
      avatar: "/placeholder.svg?height=200&width=200&text=👩‍🦰&bg=pink",
      description: "Dynamique et enthousiaste, Lily vous accompagne avec énergie.",
      color: "#f06292", // Rose
      model: "donald_duck", // Utiliser le modèle Donald Duck comme fallback
      imageUrl:
        "/lili.gif",
    },
    {
      id: "max",
      name: "Max",
      avatar: "/placeholder.svg?height=200&width=200&text=🧙‍♂️&bg=green",
      description: "Expert technique, Max est parfait pour les questions complexes.",
      color: "#4db6ac", // Vert-bleu
      model: "donald_duck", // Utiliser le modèle Donald Duck comme fallback
      imageUrl:
        "/max.gif",
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
    <Card className="mb-4 overflow-hidden border-0 shadow-lg">
      <CardContent className="pt-6">
        <h3 className="text-xl font-bold mb-6 text-center">Choisissez votre assistant virtuel</h3>

        <RadioGroup value={selected} onValueChange={handleSelect} className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {characters.map((character) => (
            <div key={character.id} className="relative">
              <RadioGroupItem value={character.id} id={`character-${character.id}`} className="sr-only" />
              <Label
                htmlFor={`character-${character.id}`}
                className="flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary hover:shadow-md"
                style={{
                  borderColor: selected === character.id ? character.color : undefined,
                  boxShadow: selected === character.id ? `0 0 15px ${character.color}40` : undefined,
                }}
              >
                <div className="relative mb-3">
                  <div
                    className="w-36 h-36 rounded-full overflow-hidden bg-gradient-to-br flex items-center justify-center"
                    style={{
                      backgroundImage: `linear-gradient(to bottom right, ${character.color}40, ${character.color}90)`,
                    }}
                  >
                    {/* Afficher l'image au lieu du modèle 3D */}
                    {character.imageUrl ? (
                      <div className="relative w-full h-full overflow-hidden rounded-full">
                        <Image
                          src={character.imageUrl || "/placeholder.svg"}
                          alt={character.name}
                          fill
                          style={{ objectFit: "cover" }}
                          className="transform scale-110"
                        />
                      </div>
                    ) : (
                      <div className="text-4xl">{character.name.charAt(0)}</div>
                    )}
                  </div>
                  {selected === character.id && (
                    <div
                      className="absolute -top-2 -right-2 rounded-full p-1"
                      style={{ backgroundColor: character.color }}
                    >
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                <span className="font-bold text-lg">{character.name}</span>
                <p className="text-sm text-center text-muted-foreground mt-2">{character.description}</p>
              </Label>
            </div>
          ))}
        </RadioGroup>
        {selectedCharacterId && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Vous discutez maintenant avec {characters.find((c) => c.id === selectedCharacterId)?.name}. Seuls vos
            messages avec ce personnage sont affichés.
          </p>
        )}
      </CardContent>
    </Card>
  )
}