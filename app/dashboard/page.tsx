"use client"

import { AvatarFallback } from "@/components/ui/avatar"

import { AvatarImage } from "@/components/ui/avatar"

import { Avatar } from "@/components/ui/avatar"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { MessageSquare, Users, Calendar, UserPlus, Settings, Bell } from "lucide-react"
import Link from "next/link"
import { useEvents } from "@/lib/events"
import { useGroups } from "@/lib/groups"
import { useMessages } from "@/lib/messages"

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { events } = useEvents()
  const { groups } = useGroups()
  const { getConversations } = useMessages()
  const [conversations, setConversations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    // Load conversations
    const convos = getConversations()
    setConversations(convos)

    setIsLoading(false)
  }, [isAuthenticated, router, getConversations])

  if (!isAuthenticated || !user || isLoading) {
    return null
  }

  // Filter events the user is registered for
  const userEvents = events.filter((event) => user.registeredEvents.includes(event.id))

  // Filter groups the user has joined
  const userGroups = groups.filter((group) => user.joinedGroups.includes(group.id))

  // Count unread messages
  const unreadMessages = conversations.reduce((count, convo) => count + convo.unreadCount, 0)

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      <MainNavigation />

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-400">Bonjour, {user.name}</h1>
            <p className="text-muted-foreground mt-1">Bienvenue sur votre tableau de bord HandiConnect</p>
          </div>

          <div className="flex gap-2 mt-4 md:mt-0">
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-purple-500" />
                Messages
              </CardTitle>
              <CardDescription>Vos conversations récentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversations.length}</div>
              <p className="text-xs text-muted-foreground">{unreadMessages} nouveaux messages</p>
              <Button variant="link" size="sm" className="mt-2 p-0" asChild>
                <Link href="/chat">Voir tous les messages</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-500" />
                Contacts
              </CardTitle>
              <CardDescription>Votre réseau</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.contacts.length}</div>
              <p className="text-xs text-muted-foreground">Personnes que vous suivez</p>
              <Button variant="link" size="sm" className="mt-2 p-0" asChild>
                <Link href="/profiles">Explorer les profils</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-green-500" />
                Événements
              </CardTitle>
              <CardDescription>Activités à venir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userEvents.length}</div>
              <p className="text-xs text-muted-foreground">
                {userEvents.length > 0
                  ? `Prochain: ${userEvents[0].date.toLocaleDateString()}`
                  : "Aucun événement à venir"}
              </p>
              <Button variant="link" size="sm" className="mt-2 p-0" asChild>
                <Link href="/events">Voir le calendrier</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <UserPlus className="h-5 w-5 mr-2 text-amber-500" />
                Groupes
              </CardTitle>
              <CardDescription>Vos communautés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userGroups.length}</div>
              <p className="text-xs text-muted-foreground">
                {userGroups.length > 0
                  ? `${userGroups.reduce((acc, group) => acc + group.posts, 0)} publications`
                  : "Aucun groupe rejoint"}
              </p>
              <Button variant="link" size="sm" className="mt-2 p-0" asChild>
                <Link href="/groups">Voir les groupes</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>Vos dernières interactions sur la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userEvents.length > 0 || userGroups.length > 0 || user.contacts.length > 0 ? (
                  <>
                    {userEvents.slice(0, 2).map((event) => (
                      <div key={event.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                        <div className="rounded-full bg-purple-100 dark:bg-purple-900/20 p-2">
                          <Calendar className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Vous êtes inscrit à l'événement "{event.title}"</p>
                          <p className="text-xs text-muted-foreground">
                            {event.date.toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                            })}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/events/${event.id}`}>Voir</Link>
                        </Button>
                      </div>
                    ))}

                    {userGroups.slice(0, 2).map((group) => (
                      <div key={group.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                        <div className="rounded-full bg-purple-100 dark:bg-purple-900/20 p-2">
                          <Users className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Vous avez rejoint le groupe "{group.name}"</p>
                          <p className="text-xs text-muted-foreground">{group.posts} publications dans ce groupe</p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/groups/${group.id}`}>Voir</Link>
                        </Button>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Aucune activité récente. Rejoignez des groupes ou inscrivez-vous à des événements pour commencer !
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Suggestions pour vous</CardTitle>
              <CardDescription>Personnes que vous pourriez connaître</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getAllUsers()
                  .filter((p) => p.id !== user.id && !user.contacts.includes(p.id))
                  .slice(0, 3)
                  .map((person) => (
                    <div key={person.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <Avatar>
                          <AvatarImage src={person.avatar} />
                          <AvatarFallback>{person.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{person.name}</p>
                        <p className="text-xs text-muted-foreground">{person.bio.substring(0, 50)}...</p>
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                          {Math.floor(Math.random() * 5) + 1} contacts en commun
                        </p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/profiles/${person.id}`}>Voir</Link>
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

function getAllUsers() {
  return useAuth.getState().getAllUsers ? useAuth.getState().getAllUsers() : []
}

