"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export function RegistrationForm() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { register } = useAuth()
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    accessibilityNeeds: [] as string[],
    accessibilityDetails: "",
    communicationPreference: "standard",
    interests: [] as string[],
    bio: "",
    location: "",
    termsAccepted: false,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSelectChange = (name: string, value: string) => {
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

  const handleNextStep = () => {
    // Validate first step
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        toast({
          title: "Champs requis",
          description: "Veuillez remplir tous les champs obligatoires.",
          variant: "destructive",
        })
        return
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Mots de passe différents",
          description: "Les mots de passe ne correspondent pas.",
          variant: "destructive",
        })
        return
      }
    }

    setStep(step + 1)
  }

  const handlePrevStep = () => {
    setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.termsAccepted) {
      toast({
        title: "Conditions d'utilisation",
        description: "Vous devez accepter les conditions d'utilisation pour vous inscrire.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const success = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        accessibilityNeeds: formData.accessibilityNeeds,
        communicationPreference: formData.communicationPreference,
        interests: formData.interests,
        bio: formData.bio,
        location: formData.location,
      })

      if (success) {
        toast({
          title: "Inscription réussie",
          description: "Bienvenue sur HandiConnect !",
        })
        router.push("/dashboard")
      } else {
        toast({
          title: "Échec de l'inscription",
          description: "Cette adresse email est déjà utilisée.",
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
    <Card>
      <CardHeader>
        <CardTitle>Inscription</CardTitle>
        <CardDescription>Rejoignez HandiConnect en quelques étapes simples</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Votre nom"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <Button type="button" onClick={handleNextStep} className="w-full">
                Continuer
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Avez-vous des besoins d'accessibilité spécifiques ?</Label>
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

              {formData.accessibilityNeeds.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="accessibilityDetails">Détails sur vos besoins (optionnel)</Label>
                  <Textarea
                    id="accessibilityDetails"
                    name="accessibilityDetails"
                    placeholder="Précisez vos besoins d'accessibilité"
                    value={formData.accessibilityDetails}
                    onChange={handleInputChange}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Préférences de communication</Label>
                <Tabs
                  defaultValue={formData.communicationPreference}
                  onValueChange={(value) => handleSelectChange("communicationPreference", value)}
                >
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="standard">Standard</TabsTrigger>
                    <TabsTrigger value="visual">Visuel</TabsTrigger>
                    <TabsTrigger value="audio">Audio</TabsTrigger>
                    <TabsTrigger value="simplified">Simplifié</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handlePrevStep} className="flex-1">
                  Retour
                </Button>
                <Button type="button" onClick={handleNextStep} className="flex-1">
                  Continuer
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Localisation (optionnel)</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Ville, Pays"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biographie (optionnel)</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Parlez-nous de vous"
                  value={formData.bio}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label>Centres d'intérêt (optionnel)</Label>
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

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="terms"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, termsAccepted: checked === true }))}
                  required
                />
                <Label htmlFor="terms" className="text-sm">
                  J'accepte les{" "}
                  <Link href="/terms" className="text-purple-600 hover:underline">
                    conditions d'utilisation
                  </Link>{" "}
                  et la{" "}
                  <Link href="/privacy" className="text-purple-600 hover:underline">
                    politique de confidentialité
                  </Link>
                </Label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handlePrevStep} className="flex-1">
                  Retour
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Inscription en cours...
                    </>
                  ) : (
                    "S'inscrire"
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <p className="text-sm text-muted-foreground">
          Vous avez déjà un compte ?{" "}
          <Link href="/login" className="text-purple-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

