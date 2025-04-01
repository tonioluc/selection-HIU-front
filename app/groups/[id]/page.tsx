"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { useGroups, type Group, type GroupPost } from "@/lib/groups"
import { useAuth } from "@/lib/auth"
import { getUserById } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import {
  Users,
  MessageSquare,
  ArrowLeft,
  Check,
  Loader2,
  ThumbsUp,
  MessageCircle,
  Calendar,
  Share2,
} from "lucide-react"
import Link from "next/link"

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { groups, getGroupById, getGroupPosts, createGroupPost } = useGroups()
  const { user, isAuthenticated, joinGroup } = useAuth()
  const { toast } = useToast()
  const [group, setGroup] = useState<Group | null>(null)
  const [posts, setPosts] = useState<GroupPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [newPostContent, setNewPostContent] = useState("")
  const [isPostingContent, setIsPostingContent] = useState(false)
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (params.id) {
      const groupId = Array.isArray(params.id) ? params.id[0] : params.id
      const foundGroup = getGroupById(groupId)

      if (foundGroup) {
        setGroup(foundGroup)
        setPosts(getGroupPosts(groupId))
      } else {
        toast({
          title: "Groupe introuvable",
          description: "Le groupe que vous recherchez n'existe pas.",
          variant: "destructive",
        })
        router.push("/groups")
      }

      setIsLoading(false)
    }
  }, [params.id, getGroupById, getGroupPosts, router, toast])

  // Check if user is member of this group
  const isUserMember = () => {
    if (!user || !group) return false
    return user.joinedGroups.includes(group.id)
  }

  // Handle joining a group
  const handleJoin = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour rejoindre ce groupe.",
        variant: "destructive",
      })
      return
    }

    if (!group) return

    setIsJoining(true)

    try {
      const success = await joinGroup(group.id)

      if (success) {
        const action = isUserMember() ? "quitté" : "rejoint"
        toast({
          title: isUserMember() ? "Groupe quitté" : "Groupe rejoint",
          description: `Vous avez ${action} le groupe "${group.name}".`,
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  // Handle creating a new post
  const handleCreatePost = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour publier un message.",
        variant: "destructive",
      })
      return
    }

    if (!group) return

    if (!newPostContent.trim()) {
      toast({
        title: "Message vide",
        description: "Veuillez écrire un message avant de publier.",
        variant: "destructive",
      })
      return
    }

    setIsPostingContent(true)

    try {
      const newPost = await createGroupPost({
        groupId: group.id,
        content: newPostContent,
        author: user!.id,
        likes: 0,
        comments: 0,
      })

      setPosts([newPost, ...posts])
      setNewPostContent("")

      toast({
        title: "Message publié",
        description: "Votre message a été publié avec succès.",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la publication du message.",
        variant: "destructive",
      })
    } finally {
      setIsPostingContent(false)
    }
  }

  // Handle liking a post
  const handleLikePost = (postId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour aimer ce message.",
        variant: "destructive",
      })
      return
    }

    setLikedPosts((prev) => {
      const newState = { ...prev, [postId]: !prev[postId] }
      return newState
    })

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const delta = likedPosts[postId] ? -1 : 1
          return { ...post, likes: post.likes + delta }
        }
        return post
      }),
    )
  }

  // Copy group link to clipboard
  const copyGroupLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast({
      title: "Lien copié",
      description: "Le lien du groupe a été copié dans le presse-papier.",
    })
  }

  // Share group
  const shareGroup = () => {
    if (navigator.share) {
      navigator
        .share({
          title: group?.name || "Groupe HandiConnect",
          text: `Rejoignez le groupe ${group?.name} sur HandiConnect!`,
          url: window.location.href,
        })
        .catch(() => {
          copyGroupLink()
        })
    } else {
      copyGroupLink()
    }
  }

  // Get user name by ID
  const getUserName = (userId: string) => {
    const foundUser = getUserById(userId)
    return foundUser ? foundUser.name : "Utilisateur inconnu"
  }

  // Get user avatar by ID
  const getUserAvatar = (userId: string) => {
    const foundUser = getUserById(userId)
    return foundUser ? foundUser.avatar : "/placeholder.svg?height=40&width=40"
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

  if (!group) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
        <MainNavigation />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Groupe introuvable</h1>
            <p className="mb-6">Le groupe que vous recherchez n'existe pas ou a été supprimé.</p>
            <Button asChild>
              <Link href="/groups">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux groupes
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
          <Link href="/groups">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux groupes
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <div className="relative h-48 w-full">
                <img src={group.image || "/placeholder.svg"} alt={group.name} className="object-cover w-full h-full" />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-purple-600">{group.category}</Badge>
                </div>
                {isUserMember() && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-green-600">Membre</Badge>
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">{group.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {group.members} membres
                  </div>
                  <span>•</span>
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {group.posts} publications
                  </div>
                  <span>•</span>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Créé le {group.createdAt.toLocaleDateString()}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Description</h3>
                    <p>{group.description}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Accessibilité</h3>
                    <div className="flex flex-wrap gap-2">
                      {group.accessibility.map((item, index) => (
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
                  onClick={handleJoin}
                  disabled={isJoining}
                  variant={isUserMember() ? "destructive" : "default"}
                >
                  {isJoining ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : isUserMember() ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Quitter le groupe
                    </>
                  ) : (
                    "Rejoindre le groupe"
                  )}
                </Button>
              </CardFooter>
            </Card>

            {isUserMember() && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Publier un message</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Partagez quelque chose avec le groupe..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={3}
                  />
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={handleCreatePost} disabled={isPostingContent}>
                    {isPostingContent ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Publier"}
                  </Button>
                </CardFooter>
              </Card>
            )}

            <div className="space-y-4">
              <h2 className="text-xl font-bold">Publications récentes</h2>

              {posts.length > 0 ? (
                posts.map((post) => (
                  <Card key={post.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={getUserAvatar(post.author)} />
                          <AvatarFallback>{getUserName(post.author).substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{getUserName(post.author)}</CardTitle>
                          <CardDescription>
                            {post.date.toLocaleDateString()} à{" "}
                            {post.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p>{post.content}</p>
                    </CardContent>
                    <CardFooter className="border-t pt-3 flex gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex gap-1 ${likedPosts[post.id] ? "text-blue-600" : ""}`}
                        onClick={() => handleLikePost(post.id)}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{post.likes}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="flex gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comments}</span>
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Aucune publication</p>
                  <p className="text-muted-foreground">Soyez le premier à publier dans ce groupe !</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Membres</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((_, index) => {
                    const randomUserId = String(Math.floor(Math.random() * 5) + 1)
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={getUserAvatar(randomUserId)} />
                          <AvatarFallback>{getUserName(randomUserId).substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{getUserName(randomUserId)}</p>
                          <p className="text-xs text-muted-foreground">Membre actif</p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/profiles/${randomUserId}`}>Voir</Link>
                        </Button>
                      </div>
                    )
                  })}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Voir tous les membres
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Partager</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={copyGroupLink}>
                    Copier le lien
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={shareGroup}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Inviter
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

