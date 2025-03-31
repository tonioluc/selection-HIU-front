"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Users, MessageSquare, Plus, Check, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth"
import { useGroups } from "@/lib/groups"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export function GroupsList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [joiningGroup, setJoiningGroup] = useState<string | null>(null)
  const { toast } = useToast()
  const { user, isAuthenticated, joinGroup } = useAuth()
  const { groups, createGroup } = useGroups()

  // New group form state
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    category: "",
    accessibility: [] as string[],
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Check if user is member of a group
  const isUserMember = (groupId: string) => {
    if (!user) return false
    return user.joinedGroups.includes(groupId)
  }

  // Handle joining a group
  const handleJoin = async (groupId: string, groupName: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour rejoindre ce groupe.",
        variant: "destructive",
      })
      return
    }

    setJoiningGroup(groupId)

    try {
      const success = await joinGroup(groupId)

      if (success) {
        const action = isUserMember(groupId) ? "quitté" : "rejoint"
        toast({
          title: isUserMember(groupId) ? "Groupe quitté" : "Groupe rejoint",
          description: `Vous avez ${action} le groupe "${groupName}".`,
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setJoiningGroup(null)
    }
  }

  // Handle creating a new group
  const handleCreateGroup = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour créer un groupe.",
        variant: "destructive",
      })
      return
    }

    if (!newGroup.name || !newGroup.description || !newGroup.category) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      })
      return
    }

    setIsCreatingGroup(true)

    try {
      await createGroup({
        name: newGroup.name,
        description: newGroup.description,
        category: newGroup.category,
        accessibility: newGroup.accessibility,
        members: 1,
        posts: 0,
        image: "/placeholder.svg?height=200&width=400",
        createdBy: user!.id,
      })

      toast({
        title: "Groupe créé",
        description: `Le groupe "${newGroup.name}" a été créé avec succès.`,
      })

      // Reset form
      setNewGroup({
        name: "",
        description: "",
        category: "",
        accessibility: [],
      })

      // Close dialog
      setIsDialogOpen(false)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du groupe.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingGroup(false)
    }
  }

  // Handle accessibility checkbox change
  const handleAccessibilityChange = (value: string) => {
    setNewGroup((prev) => {
      const accessibility = [...prev.accessibility]
      const index = accessibility.indexOf(value)

      if (index === -1) {
        accessibility.push(value)
      } else {
        accessibility.splice(index, 1)
      }

      return { ...prev, accessibility }
    })
  }

  // Filter groups based on search term and active tab
  const filteredGroups = groups.filter((group) => {
    const matchesSearch =
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "my-groups" && isUserMember(group.id)) ||
      group.category.toLowerCase() === activeTab.toLowerCase()

    return matchesSearch && matchesTab
  })

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un groupe..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Créer un groupe
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Créer un nouveau groupe</DialogTitle>
              <DialogDescription>
                Créez un groupe pour échanger avec d'autres membres sur un sujet qui vous passionne.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom du groupe</Label>
                <Input
                  id="name"
                  placeholder="Nom du groupe"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Description du groupe"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select
                  value={newGroup.category}
                  onValueChange={(value) => setNewGroup({ ...newGroup, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Art">Art</SelectItem>
                    <SelectItem value="Sport">Sport</SelectItem>
                    <SelectItem value="Technologie">Technologie</SelectItem>
                    <SelectItem value="Cuisine">Cuisine</SelectItem>
                    <SelectItem value="Voyage">Voyage</SelectItem>
                    <SelectItem value="Emploi">Emploi</SelectItem>
                    <SelectItem value="Santé">Santé</SelectItem>
                    <SelectItem value="Éducation">Éducation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Accessibilité</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Descriptions détaillées",
                    "Contenu adapté",
                    "Vidéos sous-titrées",
                    "Descriptions audio",
                    "Contenu simplifié",
                    "Alternatives textuelles",
                    "Instructions étape par étape",
                    "Vidéos descriptives",
                  ].map((item) => (
                    <div key={item} className="flex items-center space-x-2">
                      <Checkbox
                        id={`accessibility-${item}`}
                        checked={newGroup.accessibility.includes(item)}
                        onCheckedChange={() => handleAccessibilityChange(item)}
                      />
                      <Label htmlFor={`accessibility-${item}`} className="text-sm">
                        {item}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateGroup} disabled={isCreatingGroup}>
                {isCreatingGroup ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Création en cours...
                  </>
                ) : (
                  "Créer le groupe"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-8 w-full">
          <TabsTrigger value="all">Tous</TabsTrigger>
          {isAuthenticated && <TabsTrigger value="my-groups">Mes groupes</TabsTrigger>}
          <TabsTrigger value="art">Art</TabsTrigger>
          <TabsTrigger value="sport">Sport</TabsTrigger>
          <TabsTrigger value="technologie">Tech</TabsTrigger>
          <TabsTrigger value="cuisine">Cuisine</TabsTrigger>
          <TabsTrigger value="voyage">Voyage</TabsTrigger>
          <TabsTrigger value="emploi">Emploi</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group) => (
            <Card key={group.id} className="overflow-hidden flex flex-col">
              <div className="relative h-48 w-full">
                <img src={group.image || "/placeholder.svg"} alt={group.name} className="object-cover w-full h-full" />
                <div className="absolute top-2 right-2">
                  <Badge className="bg-purple-600">{group.category}</Badge>
                </div>
                {isUserMember(group.id) && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-green-600">Membre</Badge>
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{group.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <div className="flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {group.members} membres
                  </div>
                  <span>•</span>
                  <div className="flex items-center">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    {group.posts} publications
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm mb-4">{group.description}</p>
                <div className="mt-2">
                  <p className="text-sm font-medium mb-2">Accessibilité :</p>
                  <div className="flex flex-wrap gap-1">
                    {group.accessibility.map((item, index) => (
                      <Badge key={index} variant="outline" className="bg-green-50 dark:bg-green-900/20">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/groups/${group.id}`}>Voir</Link>
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleJoin(group.id, group.name)}
                  disabled={joiningGroup === group.id}
                  variant={isUserMember(group.id) ? "destructive" : "default"}
                >
                  {joiningGroup === group.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isUserMember(group.id) ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Quitter
                    </>
                  ) : (
                    "Rejoindre"
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Aucun groupe trouvé</p>
            <p className="text-muted-foreground">
              Essayez de modifier vos critères de recherche ou créez un nouveau groupe.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

