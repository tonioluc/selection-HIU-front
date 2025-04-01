"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, MapPin, MessageSquare, UserPlus, Check, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { getAllUsers } from "@/lib/auth"

export function ProfileList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")
  const [followingUser, setFollowingUser] = useState<string | null>(null)
  const { user, isAuthenticated, followUser } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Get all users
  const profiles = getAllUsers().filter((u) => u.id !== user?.id)

  // Check if user is following a profile
  const isFollowing = (userId: string) => {
    if (!user) return false
    return user.contacts.includes(userId)
  }

  // Handle follow/unfollow
  const handleFollow = async (userId: string, userName: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour suivre cet utilisateur.",
        variant: "destructive",
      })
      return
    }

    setFollowingUser(userId)

    try {
      const success = await followUser(userId)

      if (success) {
        const action = isFollowing(userId) ? "ne suivez plus" : "suivez maintenant"
        toast({
          title: isFollowing(userId) ? "Utilisateur non suivi" : "Utilisateur suivi",
          description: `Vous ${action} ${userName}.`,
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setFollowingUser(null)
    }
  }

  // Handle message
  const handleMessage = (userId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour envoyer un message.",
        variant: "destructive",
      })
      return
    }

    router.push(`/new-message`)
  }

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch =
      profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.interests.some((interest) => interest.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFilter =
      filter === "all" ||
      (filter === "following" && isFollowing(profile.id)) ||
      profile.accessibilityNeeds.some((need) => need.toLowerCase().includes(filter.toLowerCase()))

    return matchesSearch && matchesFilter
  })

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, intérêts..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrer par besoin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les profils</SelectItem>
              {isAuthenticated && <SelectItem value="following">Mes contacts</SelectItem>}
              <SelectItem value="auditive">Déficience auditive</SelectItem>
              <SelectItem value="visuelle">Déficience visuelle</SelectItem>
              <SelectItem value="motrice">Déficience motrice</SelectItem>
              <SelectItem value="autistique">Trouble du spectre autistique</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfiles.length > 0 ? (
          filteredProfiles.map((profile) => (
            <Card key={profile.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile.avatar} alt={profile.name} />
                    <AvatarFallback>{profile.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{profile.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {profile.location}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">{profile.bio}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {profile.interests.map((interest, index) => (
                    <Badge key={index} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {profile.accessibilityNeeds.map((need, index) => (
                    <Badge key={index} variant="outline" className="bg-purple-50 dark:bg-purple-900/20">
                      {need}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 border-t pt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleMessage(profile.id)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleFollow(profile.id, profile.name)}
                  disabled={followingUser === profile.id}
                  variant={isFollowing(profile.id) ? "destructive" : "default"}
                >
                  {followingUser === profile.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isFollowing(profile.id) ? (
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
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">Aucun profil ne correspond à votre recherche.</p>
          </div>
        )}
      </div>
    </div>
  )
}

