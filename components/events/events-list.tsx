"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Users, Search, Clock, CalendarDays, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth"
import { useEvents } from "@/lib/events"
import Link from "next/link"
import { Loader2 } from "lucide-react"

export function EventsList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isRegistering, setIsRegistering] = useState<string | null>(null)
  const { toast } = useToast()
  const { user, isAuthenticated, registerForEvent } = useAuth()
  const { events } = useEvents()

  // Check if user is registered for an event
  const isUserRegistered = (eventId: string) => {
    if (!user) return false
    return user.registeredEvents.includes(eventId)
  }

  // Handle event registration
  const handleRegister = async (eventId: string, eventTitle: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour vous inscrire à cet événement.",
        variant: "destructive",
      })
      return
    }

    setIsRegistering(eventId)

    try {
      const success = await registerForEvent(eventId)

      if (success) {
        const action = isUserRegistered(eventId) ? "désinscrit de" : "inscrit à"
        toast({
          title: isUserRegistered(eventId) ? "Désinscription confirmée" : "Inscription confirmée",
          description: `Vous êtes ${action} l'événement "${eventTitle}".`,
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setIsRegistering(null)
    }
  }

  // Filter events based on search term and active tab
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "upcoming" && event.date > new Date()) ||
      (activeTab === "today" &&
        event.date.getDate() === new Date().getDate() &&
        event.date.getMonth() === new Date().getMonth() &&
        event.date.getFullYear() === new Date().getFullYear()) ||
      (activeTab === "registered" && isUserRegistered(event.id)) ||
      event.category.toLowerCase() === activeTab.toLowerCase()

    return matchesSearch && matchesTab
  })

  // Sort events by date (closest first)
  filteredEvents.sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un événement..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isAuthenticated && (
          <Button asChild>
            <Link href="/events/create">Créer un événement</Link>
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-8 w-full">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="upcoming">À venir</TabsTrigger>
          <TabsTrigger value="today">Aujourd'hui</TabsTrigger>
          {isAuthenticated && <TabsTrigger value="registered">Mes inscriptions</TabsTrigger>}
          <TabsTrigger value="Art">Art</TabsTrigger>
          <TabsTrigger value="Social">Social</TabsTrigger>
          <TabsTrigger value="Sport">Sport</TabsTrigger>
          <TabsTrigger value="Culture">Culture</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden flex flex-col">
              <div className="relative h-48 w-full">
                <img src={event.image || "/placeholder.svg"} alt={event.title} className="object-cover w-full h-full" />
                <div className="absolute top-2 right-2">
                  <Badge className="bg-purple-600">{event.category}</Badge>
                </div>
                {isUserRegistered(event.id) && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-green-600">Inscrit</Badge>
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                </div>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {event.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm mb-4">{event.description}</p>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {event.date.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {event.date.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{event.attendees} participants</span>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Accessibilité :</p>
                  <div className="flex flex-wrap gap-1">
                    {event.accessibility.map((item, index) => (
                      <Badge key={index} variant="outline" className="bg-green-50 dark:bg-green-900/20">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/events/${event.id}`}>Détails</Link>
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleRegister(event.id, event.title)}
                  disabled={isRegistering === event.id}
                  variant={isUserRegistered(event.id) ? "destructive" : "default"}
                >
                  {isRegistering === event.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isUserRegistered(event.id) ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Se désinscrire
                    </>
                  ) : (
                    "S'inscrire"
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Aucun événement trouvé</p>
            <p className="text-muted-foreground">Essayez de modifier vos critères de recherche ou revenez plus tard.</p>
          </div>
        )}
      </div>
    </div>
  )
}

