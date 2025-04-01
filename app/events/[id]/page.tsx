"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEvents, type Event } from "@/lib/events"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { CalendarDays, Clock, MapPin, Users, ArrowLeft, Check, Loader2, Share2, Copy } from "lucide-react"
import Link from "next/link"

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { events, getEventById } = useEvents()
  const { user, isAuthenticated, registerForEvent } = useAuth()
  const { toast } = useToast()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegistering, setIsRegistering] = useState(false)

  useEffect(() => {
    if (params.id) {
      const eventId = Array.isArray(params.id) ? params.id[0] : params.id
      const foundEvent = getEventById(eventId)

      if (foundEvent) {
        setEvent(foundEvent)
      } else {
        toast({
          title: "Événement introuvable",
          description: "L'événement que vous recherchez n'existe pas.",
          variant: "destructive",
        })
        router.push("/events")
      }

      setIsLoading(false)
    }
  }, [params.id, getEventById, router, toast])

  // Mettre à jour l'événement lorsque les données changent
  useEffect(() => {
    if (params.id && !isLoading) {
      const eventId = Array.isArray(params.id) ? params.id[0] : params.id
      const foundEvent = getEventById(eventId)

      if (foundEvent) {
        setEvent(foundEvent)
      }
    }
  }, [params.id, events, getEventById, isLoading])

  // Check if user is registered for this event
  const isUserRegistered = () => {
    if (!user || !event) return false
    return user.registeredEvents.includes(event.id)
  }

  // Handle event registration
  const handleRegister = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour vous inscrire à cet événement.",
        variant: "destructive",
      })
      return
    }

    if (!event) return

    setIsRegistering(true)

    try {
      const success = await registerForEvent(event.id)

      if (success) {
        const action = isUserRegistered() ? "désinscrit de" : "inscrit à"
        toast({
          title: isUserRegistered() ? "Désinscription confirmée" : "Inscription confirmée",
          description: `Vous êtes ${action} l'événement "${event.title}".`,
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setIsRegistering(false)
    }
  }

  // Copy event link to clipboard
  const copyEventLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast({
      title: "Lien copié",
      description: "Le lien de l'événement a été copié dans le presse-papier.",
    })
  }

  // Share event
  const shareEvent = () => {
    if (navigator.share) {
      navigator
        .share({
          title: event?.title || "Événement HandiConnect",
          text: `Participez à l'événement ${event?.title} sur HandiConnect!`,
          url: window.location.href,
        })
        .catch(() => {
          copyEventLink()
        })
    } else {
      copyEventLink()
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
        <MainNavigation />
        <div className="container mx-auto px-4 py-12 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </main>
    )
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
        <MainNavigation />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Événement introuvable</h1>
            <p className="mb-6">L'événement que vous recherchez n'existe pas ou a été supprimé.</p>
            <Button asChild>
              <Link href="/events">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux événements
              </Link>
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      <MainNavigation />

      <div className="container mx-auto px-4 py-6">
        <Button variant="outline" asChild className="mb-6">
          <Link href="/events">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux événements
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <div className="relative h-64 w-full">
                <img src={event.image || "/placeholder.svg"} alt={event.title} className="object-cover w-full h-full" />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-purple-600">{event.category}</Badge>
                </div>
                {isUserRegistered() && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-green-600">Inscrit</Badge>
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">{event.title}</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Description</h3>
                    <p>{event.description}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Accessibilité</h3>
                    <div className="flex flex-wrap gap-2">
                      {event.accessibility.map((item, index) => (
                        <Badge key={index} variant="outline" className="bg-green-50 dark:bg-green-900/20">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button
                  className="w-full"
                  onClick={handleRegister}
                  disabled={isRegistering}
                  variant={isUserRegistered() ? "destructive" : "default"}
                >
                  {isRegistering ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : isUserRegistered() ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Se désinscrire
                    </>
                  ) : (
                    "S'inscrire à cet événement"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-muted-foreground">
                      {event.date.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Heure</p>
                    <p className="text-muted-foreground">
                      {event.date.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Lieu</p>
                    <p className="text-muted-foreground">{event.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Participants</p>
                    <p className="text-muted-foreground">{event.attendees} inscrits</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Partager</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={copyEventLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copier le lien
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={shareEvent}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Partager
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

