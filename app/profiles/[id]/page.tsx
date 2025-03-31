"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth, getUserById } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { MapPin, MessageSquare, UserPlus, Check, Loader2, Calendar, Users, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ProfileDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser, isAuthenticated, followUser } = useAuth()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followingUser, setFollowingUser] = useState(false)

  useEffect(() => {
    if (params.id) {
      const userId = Array.isArray(params.id) ? params.id[0] : params.id
      const foundUser = getUserById(userId)

      if (foundUser) {
        setUser(foundUser)

        // Check if current user is following this user
        if (currentUser) {
          setIsFollowing(currentUser.contacts.includes(userId))
        }
      } else {
        toast({
          title: "Profil introuvable",
          description: "Le profil que vous recherchez n'existe pas.",
          variant: "destructive",
        })
        router.push("/profiles")
      }

      setIsLoading(false)
    }
  }, [params.id, currentUser, router, toast])

  // Handle follow/unfollow
  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour suivre cet utilisateur.",
        variant: "destructive",
      })
      return
    }

    if (!user) return

    setFollowingUser(true)

    try {
      const success = await followUser(user.id)

      if (success) {
        setIsFollowing(!isFollowing)
        const action = isFollowing ? "ne suivez plus" : "suivez maintenant"
        toast({
          title: isFollowing ? "Utilisateur non suivi" : "Utilisateur suivi",
          description: `Vous ${action} ${user.name}.`,
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setFollowingUser(false)
    }
  }

  // Handle message
  const handleMessage = () => {
    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour envoyer un message.",
        variant: "destructive",
      })
      return
    }

    if (!user) return

    router.push(`/chat?user=${user.id}`)
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

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
        <MainNavigation />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Profil introuvable</h1>
            <p className="mb-6">Le profil que vous recherchez n'existe pas ou a été supprimé.</p>
            <Button asChild>
              <Link href="/profiles">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux profils
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
          <Link href="/profiles">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux profils
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <Avatar className="h-32 w-32 mb-4">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {user.location}
                  </p>

                  <div className="flex gap-2 mt-6 w-full">
                    <Button variant="outline" className="flex-1" onClick={handleMessage}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleFollow}
                      disabled={followingUser}
                      variant={isFollowing ? "destructive" : "default"}
                    >
                      {followingUser ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Ne plus suivre
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Suivre
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Besoins d'accessibilité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.accessibilityNeeds.length > 0 ? (
                    user.accessibilityNeeds.map((need: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-purple-50 dark:bg-purple-900/20">
                        {need}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">Aucun besoin spécifié</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Centres d'intérêt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.interests.length > 0 ? (
                    user.interests.map((interest: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {interest}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">Aucun intérêt spécifié</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>À propos</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{user.bio || "Aucune biographie disponible."}</p>
              </CardContent>
            </Card>

            <Tabs defaultValue="activities" className="mt-6">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="activities">Activités</TabsTrigger>
                <TabsTrigger value="events">Événements</TabsTrigger>
                <TabsTrigger value="groups">Groupes</TabsTrigger>
              </TabsList>

              <TabsContent value="activities">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">Aucune activité récente</p>
                      <p className="text-muted-foreground">Les activités récentes de {user.name} apparaîtront ici.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="events">
                <Card>
                  <CardHeader>
                    <CardTitle>Événements</CardTitle>
                    <CardDescription>Événements auxquels {user.name} participe</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {user.registeredEvents.length > 0 ? (
                      <div className="space-y-4">
                        {user.registeredEvents.map((eventId: string) => (
                          <div key={eventId} className="flex items-center gap-3 p-3 rounded-md border">
                            <Calendar className="h-10 w-10 text-purple-500" />
                            <div>
                              <p className="font-medium">Événement #{eventId}</p>
                              <p className="text-sm text-muted-foreground">Voir les détails de l'événement</p>
                            </div>
                            <Button variant="outline" size="sm" className="ml-auto" asChild>
                              <Link href={`/events/${eventId}`}>Voir</Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">Aucun événement</p>
                        <p className="text-muted-foreground">
                          {user.name} ne participe à aucun événement pour le moment.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="groups">
                <Card>
                  <CardHeader>
                    <CardTitle>Groupes</CardTitle>
                    <CardDescription>Groupes dont {user.name} est membre</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {user.joinedGroups.length > 0 ? (
                      <div className="space-y-4">
                        {user.joinedGroups.map((groupId: string) => (
                          <div key={groupId} className="flex items-center gap-3 p-3 rounded-md border">
                            <Users className="h-10 w-10 text-purple-500" />
                            <div>
                              <p className="font-medium">Groupe #{groupId}</p>
                              <p className="text-sm text-muted-foreground">Voir les détails du groupe</p>
                            </div>
                            <Button variant="outline" size="sm" className="ml-auto" asChild>
                              <Link href={`/groups/${groupId}`}>Voir</Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">Aucun groupe</p>
                        <p className="text-muted-foreground">{user.name} n'est membre d'aucun groupe pour le moment.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  )
}

