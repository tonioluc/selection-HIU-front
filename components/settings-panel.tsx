"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"
import { MoonIcon, SunIcon, MonitorIcon, ZoomIn, ZoomOut } from "lucide-react"

export function SettingsPanel() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)

  // Settings state
  const [fontSize, setFontSize] = useState(100)
  const [highContrast, setHighContrast] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [screenReader, setScreenReader] = useState(false)
  const [autoplay, setAutoplay] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [soundEffects, setSoundEffects] = useState(true)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)

    // Load settings from localStorage
    const savedFontSize = localStorage.getItem("handiconnect-font-size")
    if (savedFontSize) setFontSize(Number.parseInt(savedFontSize))

    const savedHighContrast = localStorage.getItem("handiconnect-high-contrast")
    if (savedHighContrast) setHighContrast(savedHighContrast === "true")

    const savedReduceMotion = localStorage.getItem("handiconnect-reduce-motion")
    if (savedReduceMotion) setReduceMotion(savedReduceMotion === "true")

    const savedScreenReader = localStorage.getItem("handiconnect-screen-reader")
    if (savedScreenReader) setScreenReader(savedScreenReader === "true")

    const savedAutoplay = localStorage.getItem("handiconnect-autoplay")
    if (savedAutoplay) setAutoplay(savedAutoplay === "true")

    const savedNotifications = localStorage.getItem("handiconnect-notifications")
    if (savedNotifications) setNotifications(savedNotifications === "true")

    const savedSoundEffects = localStorage.getItem("handiconnect-sound-effects")
    if (savedSoundEffects) setSoundEffects(savedSoundEffects === "true")

    // Apply settings
    applySettings()
  }, [])

  // Apply settings to the document
  const applySettings = () => {
    // Font size
    document.documentElement.style.fontSize = `${fontSize}%`
    localStorage.setItem("handiconnect-font-size", fontSize.toString())

    // High contrast
    if (highContrast) {
      document.documentElement.classList.add("high-contrast")
    } else {
      document.documentElement.classList.remove("high-contrast")
    }
    localStorage.setItem("handiconnect-high-contrast", highContrast.toString())

    // Reduce motion
    if (reduceMotion) {
      document.documentElement.classList.add("reduce-motion")
    } else {
      document.documentElement.classList.remove("reduce-motion")
    }
    localStorage.setItem("handiconnect-reduce-motion", reduceMotion.toString())

    // Other settings
    localStorage.setItem("handiconnect-screen-reader", screenReader.toString())
    localStorage.setItem("handiconnect-autoplay", autoplay.toString())
    localStorage.setItem("handiconnect-notifications", notifications.toString())
    localStorage.setItem("handiconnect-sound-effects", soundEffects.toString())
  }

  // Handle font size change
  const handleFontSizeChange = (value: number[]) => {
    setFontSize(value[0])
  }

  // Handle high contrast change
  const handleHighContrastChange = (checked: boolean) => {
    setHighContrast(checked)
  }

  // Handle reduce motion change
  const handleReduceMotionChange = (checked: boolean) => {
    setReduceMotion(checked)
  }

  // Save settings
  const saveSettings = () => {
    applySettings()

    toast({
      title: "Paramètres enregistrés",
      description: "Vos préférences ont été enregistrées avec succès.",
    })
  }

  // Reset settings
  const resetSettings = () => {
    setFontSize(100)
    setHighContrast(false)
    setReduceMotion(false)
    setScreenReader(false)
    setAutoplay(false)
    setNotifications(true)
    setSoundEffects(true)

    // Apply default settings
    document.documentElement.style.fontSize = "100%"
    document.documentElement.classList.remove("high-contrast")
    document.documentElement.classList.remove("reduce-motion")

    // Clear localStorage
    localStorage.removeItem("handiconnect-font-size")
    localStorage.removeItem("handiconnect-high-contrast")
    localStorage.removeItem("handiconnect-reduce-motion")
    localStorage.removeItem("handiconnect-screen-reader")
    localStorage.removeItem("handiconnect-autoplay")
    localStorage.removeItem("handiconnect-notifications")
    localStorage.removeItem("handiconnect-sound-effects")

    toast({
      title: "Paramètres réinitialisés",
      description: "Vos préférences ont été réinitialisées aux valeurs par défaut.",
    })
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="py-4">
      <Tabs defaultValue="appearance">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="appearance">Apparence</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibilité</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          <div className="space-y-2">
            <Label>Thème</Label>
            <RadioGroup defaultValue={theme} onValueChange={setTheme} className="grid grid-cols-3 gap-2">
              <div>
                <RadioGroupItem value="light" id="theme-light" className="sr-only" />
                <Label
                  htmlFor="theme-light"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <SunIcon className="h-5 w-5 mb-2" />
                  <span>Clair</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
                <Label
                  htmlFor="theme-dark"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <MoonIcon className="h-5 w-5 mb-2" />
                  <span>Sombre</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="system" id="theme-system" className="sr-only" />
                <Label
                  htmlFor="theme-system"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <MonitorIcon className="h-5 w-5 mb-2" />
                  <span>Système</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Taille de la police</Label>
              <span className="text-sm text-muted-foreground">{fontSize}%</span>
            </div>
            <div className="flex items-center gap-2">
              <ZoomOut className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[fontSize]}
                min={75}
                max={150}
                step={5}
                onValueChange={handleFontSizeChange}
                className="flex-1"
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="accessibility" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="high-contrast">Contraste élevé</Label>
                <p className="text-sm text-muted-foreground">
                  Augmente le contraste des couleurs pour une meilleure lisibilité
                </p>
              </div>
              <Switch id="high-contrast" checked={highContrast} onCheckedChange={handleHighContrastChange} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reduce-motion">Réduire les animations</Label>
                <p className="text-sm text-muted-foreground">Limite les animations et les transitions</p>
              </div>
              <Switch id="reduce-motion" checked={reduceMotion} onCheckedChange={handleReduceMotionChange} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="screen-reader">Compatibilité lecteur d'écran</Label>
                <p className="text-sm text-muted-foreground">Optimise le contenu pour les lecteurs d'écran</p>
              </div>
              <Switch
                id="screen-reader"
                checked={screenReader}
                onCheckedChange={(checked) => setScreenReader(checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoplay">Lecture automatique des médias</Label>
                <p className="text-sm text-muted-foreground">Active la lecture automatique des vidéos et audios</p>
              </div>
              <Switch id="autoplay" checked={autoplay} onCheckedChange={(checked) => setAutoplay(checked)} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Notifications</Label>
                <p className="text-sm text-muted-foreground">Recevoir des notifications sur les nouvelles activités</p>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={(checked) => setNotifications(checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound-effects">Effets sonores</Label>
                <p className="text-sm text-muted-foreground">Jouer des sons pour les notifications et actions</p>
              </div>
              <Switch
                id="sound-effects"
                checked={soundEffects}
                onCheckedChange={(checked) => setSoundEffects(checked)}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between mt-8 pt-4 border-t">
        <Button variant="outline" onClick={resetSettings}>
          Réinitialiser
        </Button>
        <Button onClick={saveSettings}>Enregistrer</Button>
      </div>
    </div>
  )
}

