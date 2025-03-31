"use client"

import { create } from "zustand"

export type Group = {
  id: string
  name: string
  description: string
  members: number
  posts: number
  category: string
  accessibility: string[]
  image: string
  createdBy: string
  createdAt: Date
}

export type GroupPost = {
  id: string
  groupId: string
  content: string
  author: string
  date: Date
  likes: number
  comments: number
}

type GroupsState = {
  groups: Group[]
  groupPosts: Record<string, GroupPost[]>
  getGroupById: (id: string) => Group | undefined
  createGroup: (group: Omit<Group, "id" | "createdAt">) => Promise<Group>
  updateGroup: (id: string, group: Partial<Group>) => Promise<boolean>
  deleteGroup: (id: string) => Promise<boolean>
  getGroupPosts: (groupId: string) => GroupPost[]
  createGroupPost: (post: Omit<GroupPost, "id" | "date">) => Promise<GroupPost>
}

// Sample groups data
const groupsData: Group[] = [
  {
    id: "1",
    name: "Photographie Accessible",
    description:
      "Groupe dédié à la photographie adaptée pour tous les types de handicap. Partagez vos astuces, techniques et photos !",
    members: 128,
    posts: 342,
    category: "Art",
    accessibility: ["Descriptions détaillées", "Contenu adapté"],
    image: "/placeholder.svg?height=200&width=400",
    createdBy: "1",
    createdAt: new Date(2024, 1, 15),
  },
  {
    id: "2",
    name: "Handisport Passion",
    description:
      "Échangez sur les sports adaptés, partagez vos expériences et organisez des rencontres sportives inclusives.",
    members: 95,
    posts: 210,
    category: "Sport",
    accessibility: ["Vidéos sous-titrées", "Descriptions audio"],
    image: "/placeholder.svg?height=200&width=400",
    createdBy: "4",
    createdAt: new Date(2024, 2, 5),
  },
  {
    id: "3",
    name: "Tech & Accessibilité",
    description:
      "Discussions sur les technologies d'assistance, les applications accessibles et les innovations pour l'autonomie.",
    members: 156,
    posts: 423,
    category: "Technologie",
    accessibility: ["Contenu simplifié", "Alternatives textuelles"],
    image: "/placeholder.svg?height=200&width=400",
    createdBy: "2",
    createdAt: new Date(2024, 0, 20),
  },
  {
    id: "4",
    name: "Cuisine pour tous",
    description:
      "Partagez des recettes adaptées, des astuces de cuisine et des techniques accessibles pour cuisiner en toute autonomie.",
    members: 87,
    posts: 178,
    category: "Cuisine",
    accessibility: ["Instructions étape par étape", "Vidéos descriptives"],
    image: "/placeholder.svg?height=200&width=400",
    createdBy: "3",
    createdAt: new Date(2024, 2, 15),
  },
  {
    id: "5",
    name: "Voyages sans limites",
    description:
      "Conseils, bons plans et retours d'expérience pour voyager avec un handicap. Partagez vos destinations accessibles !",
    members: 112,
    posts: 265,
    category: "Voyage",
    accessibility: ["Photos décrites", "Guides détaillés"],
    image: "/placeholder.svg?height=200&width=400",
    createdBy: "5",
    createdAt: new Date(2024, 1, 10),
  },
  {
    id: "6",
    name: "Emploi & Handicap",
    description:
      "Entraide pour la recherche d'emploi, conseils pour les entretiens et partage d'opportunités professionnelles inclusives.",
    members: 143,
    posts: 320,
    category: "Emploi",
    accessibility: ["Documents accessibles", "Ressources adaptées"],
    image: "/placeholder.svg?height=200&width=400",
    createdBy: "1",
    createdAt: new Date(2024, 0, 5),
  },
]

// Sample group posts
const groupPostsData: Record<string, GroupPost[]> = {
  "1": [
    {
      id: "1",
      groupId: "1",
      content:
        "Bonjour à tous ! Je viens de découvrir une technique de photographie adaptée pour les personnes à mobilité réduite. Je partage ça avec vous bientôt !",
      author: "1",
      date: new Date(2025, 2, 25),
      likes: 15,
      comments: 3,
    },
    {
      id: "2",
      groupId: "1",
      content: "Quelqu'un connaît-il des applications de photographie accessibles avec lecteur d'écran ?",
      author: "2",
      date: new Date(2025, 2, 24),
      likes: 8,
      comments: 5,
    },
  ],
  "2": [
    {
      id: "3",
      groupId: "2",
      content:
        "Je participe à une compétition de natation adaptée le mois prochain. Des conseils pour l'entraînement ?",
      author: "4",
      date: new Date(2025, 2, 23),
      likes: 12,
      comments: 7,
    },
  ],
  "3": [
    {
      id: "4",
      groupId: "3",
      content:
        "Je viens de tester cette nouvelle application de reconnaissance vocale, elle est incroyable pour les personnes malvoyantes !",
      author: "2",
      date: new Date(2025, 2, 22),
      likes: 24,
      comments: 9,
    },
    {
      id: "5",
      groupId: "3",
      content: "Quelqu'un a-t-il essayé les derniers modèles de claviers adaptés ?",
      author: "5",
      date: new Date(2025, 2, 21),
      likes: 10,
      comments: 4,
    },
  ],
}

export const useGroups = create<GroupsState>((set, get) => ({
  groups: groupsData,
  groupPosts: groupPostsData,
  getGroupById: (id) => {
    return get().groups.find((group) => group.id === id)
  },
  createGroup: async (group) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newGroup: Group = {
      ...group,
      id: String(get().groups.length + 1),
      createdAt: new Date(),
    }

    set((state) => ({
      groups: [...state.groups, newGroup],
      groupPosts: { ...state.groupPosts, [newGroup.id]: [] },
    }))

    return newGroup
  },
  updateGroup: async (id, groupData) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const groupIndex = get().groups.findIndex((group) => group.id === id)
    if (groupIndex === -1) return false

    const updatedGroups = [...get().groups]
    updatedGroups[groupIndex] = { ...updatedGroups[groupIndex], ...groupData }

    set({ groups: updatedGroups })

    return true
  },
  deleteGroup: async (id) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    set((state) => ({
      groups: state.groups.filter((group) => group.id !== id),
      groupPosts: Object.fromEntries(Object.entries(state.groupPosts).filter(([groupId]) => groupId !== id)),
    }))

    return true
  },
  getGroupPosts: (groupId) => {
    return get().groupPosts[groupId] || []
  },
  createGroupPost: async (post) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newPost: GroupPost = {
      ...post,
      id: String(Date.now()),
      date: new Date(),
    }

    set((state) => {
      const groupPosts = { ...state.groupPosts }
      const posts = groupPosts[post.groupId] || []
      groupPosts[post.groupId] = [newPost, ...posts]

      // Update post count in group
      const groupIndex = state.groups.findIndex((group) => group.id === post.groupId)
      if (groupIndex !== -1) {
        const updatedGroups = [...state.groups]
        updatedGroups[groupIndex] = {
          ...updatedGroups[groupIndex],
          posts: updatedGroups[groupIndex].posts + 1,
        }

        return { groupPosts, groups: updatedGroups }
      }

      return { groupPosts }
    })

    return newPost
  },
}))

