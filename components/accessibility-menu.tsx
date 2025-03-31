"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, Type } from "lucide-react"

export function AccessibilityMenu() {
  const [fontSize, setFontSize] = useState("normal")
  const [highContrast, setHighContrast] = useState(false)

  const changeFontSize = (size: string) => {
    setFontSize(size)
    document.documentElement.style.fontSize = size === "large" ? "120%" : size === "larger" ? "140%" : "100%"
  }

  const toggleHighContrast = () => {
    setHighContrast(!highContrast)
    if (!highContrast) {
      document.documentElement.classList.add("high-contrast")
    } else {
      document.documentElement.classList.remove("high-contrast")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Options d'accessibilité">
          <Settings className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Options d'accessibilité</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuLabel className="flex items-center gap-2">
          <Type className="h-4 w-4" />
          <span>Taille du texte</span>
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => changeFontSize("normal")}>
          Normal {fontSize === "normal" && "✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeFontSize("large")}>Grand {fontSize === "large" && "✓"}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeFontSize("larger")}>
          Très grand {fontSize === "larger" && "✓"}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={toggleHighContrast}>Contraste élevé {highContrast && "✓"}</DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <a href="/accessibility-settings">Paramètres complets</a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

