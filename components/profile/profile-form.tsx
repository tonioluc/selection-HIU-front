"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/auth"
import { useAuth } from "@/lib/auth"
import { Loader2, Upload } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type ProfileFormProps = {
  user: User
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  const { updateUser } = useAuth()
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    bio: user.bio || "",
    location: user.location || "",
    accessibilityNeeds: user.accessibilityNeeds || [],
    communicationPreference: user.communicationPreference || "standard",
    interests: user.interests || [],
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAccessibilityNeedsChange = (need: string) => {
    setFormData((prev) => {
      const needs = [...prev.accessibilityNeeds]
      const index = needs.indexOf(need)

      if (index === -1) {
        needs.push(need)
      } else {
        needs.splice(index, 1)
      }

      return { ...prev, accessibilityNeeds: needs }
    })
  }

  const handleInterestChange = (interest: string) => {
    setFormData((prev) => {
      const interests = [...prev.interests]
      const index = interests.indexOf(interest)

      if (index === -1) {
        interests.push(interest)
      } else {
        interests.splice(index, 1)
      }

      return { ...prev, interests: interests }
    })
  }

  const handleSubmit = async (e: React.FormEvent, section: string) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let dataToUpdate: Partial<User> = {}

      // Only update the fields from the current section
      if (section === "general") {
        dataToUpdate = {
          name: formData.name,
          email: formData.email,
          bio: formData.bio,
          location: formData.location,
        }
      } else if (section === "accessibility") {
        dataToUpdate = {
          accessibilityNeeds: formData.accessibilityNeeds,
          communicationPreference: formData.communicationPreference,
        }
      } else if (section === "interests") {
        dataToUpdate = {
          interests: formData.interests,
        }
      }

      const success = await updateUser(dataToUpdate)

      if (success) {
        toast({
          title: "Profil mis à jour",
          description: "Vos informations ont été enregistrées avec succès.",
        })
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la mise à jour du profil.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoUpload = async () => {
    setIsUploading(true)

    try {
      // Simuler le téléchargement d'une photo
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Générer une couleur aléatoire pour l'avatar
      const colors = ["red", "blue", "green", "purple", "orange", "pink", "teal"]
      const randomColor = colors[Math.floor(Math.random() * colors.length)]

      const newAvatarUrl = `/placeholder.svg?height=100&width=100&text=${user.name.substring(0, 2).toUpperCase()}&bg=${randomColor}`

      const success = await updateUser({
        avatar: newAvatarUrl,
      })

      if (success) {
        toast({
          title: "Photo de profil mise à jour",
          description: "Votre photo de profil a été mise à jour avec succès.",
        })

        // Forcer un rafraîchissement de la page pour voir les changements
        window.location.reload()
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la mise à jour de la photo de profil.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setIsImageDialogOpen(false)
    }
  }

  const commonInterests = [
    "Art",
    "Musique",
    "Lecture",
    "Cinéma",
    "Théâtre",
    "Sport",
    "Voyage",
    "Cuisine",
    "Technologie",
    "Jeux vidéo",
    "Nature",
    "Photographie",
    "Danse",
    "Écriture",
    "Sciences",
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Photo de profil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <Avatar className="h-32 w-32 mb-4">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>

          <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                Changer la photo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Changer la photo de profil</DialogTitle>
                <DialogDescription>
                  Téléchargez une nouvelle photo de profil ou choisissez parmi les options ci-dessous.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="flex items-center justify-center p-4 border-2 border-dashed rounded-md">
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">
                      Glissez-déposez une image ici ou cliquez pour parcourir
                    </p>
                    <Input type="file" className="hidden" id="photo-upload" accept="image/*" />
                    <Label htmlFor="photo-upload" className="text-sm text-purple-600 cursor-pointer">
                      Parcourir
                    </Label>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="aspect-square bg-muted rounded-md flex items-center justify-center cursor-pointer hover:bg-muted/80"
                    >
                      <span className="text-lg font-bold">{user.name.substring(0, 2).toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handlePhotoUpload} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Téléchargement...
                    </>
                  ) : (
                    "Enregistrer"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>Modifiez vos informations personnelles et vos préférences</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="accessibility">Accessibilité</TabsTrigger>
              <TabsTrigger value="interests">Centres d'intérêt</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <form onSubmit={(e) => handleSubmit(e, "general")} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Localisation</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="Ville, Pays"
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biographie</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Parlez-nous de vous"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      "Enregistrer les modifications"
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="accessibility">
              <form onSubmit={(e) => handleSubmit(e, "accessibility")} className="space-y-4">
                <div className="space-y-2">
                  <Label>Besoins d'accessibilité</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      "Déficience auditive",
                      "Déficience visuelle",
                      "Déficience motrice",
                      "Trouble du spectre autistique",
                      "Déficience cognitive",
                      "Déficiences multiples",
                      "Autre",
                    ].map((need) => (
                      <div key={need} className="flex items-center space-x-2">
                        <Checkbox
                          id={`need-${need}`}
                          checked={formData.accessibilityNeeds.includes(need)}
                          onCheckedChange={() => handleAccessibilityNeedsChange(need)}
                        />
                        <Label htmlFor={`need-${need}`} className="text-sm">
                          {need}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Préférences de communication</Label>
                  <Tabs
                    defaultValue={formData.communicationPreference}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, communicationPreference: value }))}
                  >
                    <TabsList className="grid grid-cols-4 w-full">
                      <TabsTrigger value="standard">Standard</TabsTrigger>
                      <TabsTrigger value="visual">Visuel</TabsTrigger>
                      <TabsTrigger value="audio">Audio</TabsTrigger>
                      <TabsTrigger value="simplified">Simplifié</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      "Enregistrer les modifications"
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="interests">
              <form onSubmit={(e) => handleSubmit(e, "interests")} className="space-y-4">
                <div className="space-y-2">
                  <Label>Centres d'intérêt</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {commonInterests.map((interest) => (
                      <div key={interest} className="flex items-center space-x-2">
                        <Checkbox
                          id={`interest-${interest}`}
                          checked={formData.interests.includes(interest)}
                          onCheckedChange={() => handleInterestChange(interest)}
                        />
                        <Label htmlFor={`interest-${interest}`} className="text-sm">
                          {interest}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      "Enregistrer les modifications"
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

