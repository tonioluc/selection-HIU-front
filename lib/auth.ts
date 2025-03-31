"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type User = {
  id: string
  name: string
  email: string
  avatar: string
  accessibilityNeeds: string[]
  communicationPreference: string
  interests: string[]
  bio: string
  location: string
  role: "user" | "admin"
  registeredEvents: string[]
  joinedGroups: string[]
  contacts: string[]
}

type AuthState = {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  register: (userData: Partial<User> & { password: string }) => Promise<{ success: boolean; message: string }>
  logout: () => void
  updateUser: (userData: Partial<User>) => Promise<boolean>
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>
  followUser: (userId: string) => Promise<boolean>
  registerForEvent: (eventId: string) => Promise<boolean>
  joinGroup: (groupId: string) => Promise<boolean>
}

// Mock users database
const mockUsers: (User & { password: string })[] = [
  {
    id: "1",
    name: "Marie Dupont",
    email: "marie@example.com",
    password: "password123",
    avatar: "/placeholder.svg?height=100&width=100",
    accessibilityNeeds: ["Déficience auditive"],
    communicationPreference: "visual",
    interests: ["Photographie", "Nature", "Lecture"],
    bio: "Passionnée de photographie et de nature. J'aime partager mes expériences et découvrir de nouvelles personnes.",
    location: "Paris, France",
    role: "user",
    registeredEvents: ["1", "3"],
    joinedGroups: ["2", "5"],
    contacts: ["2", "3"],
  },
  {
    id: "2",
    name: "Thomas Martin",
    email: "thomas@example.com",
    password: "password123",
    avatar: "/placeholder.svg?height=100&width=100",
    accessibilityNeeds: ["Déficience visuelle"],
    communicationPreference: "audio",
    interests: ["Technologie", "Jeux vidéo", "Cinéma"],
    bio: "Développeur web et amateur de jeux vidéo. Je cherche à rencontrer des personnes partageant mes centres d'intérêt.",
    location: "Lyon, France",
    role: "user",
    registeredEvents: ["2", "4"],
    joinedGroups: ["1", "3"],
    contacts: ["1", "5"],
  },
  {
    id: "3",
    name: "Sophie Leroy",
    email: "sophie@example.com",
    password: "password123",
    avatar: "/placeholder.svg?height=100&width=100",
    accessibilityNeeds: ["Déficience motrice"],
    communicationPreference: "standard",
    interests: ["Art", "Musique", "Théâtre"],
    bio: "Artiste et musicienne. J'adore l'art sous toutes ses formes et je suis toujours à la recherche de nouvelles inspirations.",
    location: "Bordeaux, France",
    role: "user",
    registeredEvents: ["1", "6"],
    joinedGroups: ["4", "6"],
    contacts: ["1", "4"],
  },
  {
    id: "4",
    name: "Lucas Bernard",
    email: "lucas@example.com",
    password: "password123",
    avatar: "/placeholder.svg?height=100&width=100",
    accessibilityNeeds: ["Déficience motrice"],
    communicationPreference: "standard",
    interests: ["Sport", "Voyage", "Cuisine"],
    bio: "Sportif et aventurier. Je pratique le handisport et j'aime les défis. Toujours partant pour de nouvelles aventures !",
    location: "Marseille, France",
    role: "user",
    registeredEvents: ["4", "5"],
    joinedGroups: ["2", "6"],
    contacts: ["3", "5"],
  },
  {
    id: "5",
    name: "Emma Petit",
    email: "emma@example.com",
    password: "password123",
    avatar: "/placeholder.svg?height=100&width=100",
    accessibilityNeeds: ["Trouble du spectre autistique"],
    communicationPreference: "simplified",
    interests: ["Psychologie", "Littérature", "Philosophie"],
    bio: "Étudiante en psychologie et passionnée de littérature. J'aime les discussions profondes et les échanges culturels.",
    location: "Lille, France",
    role: "user",
    registeredEvents: ["3", "5"],
    joinedGroups: ["1", "4"],
    contacts: ["2", "4"],
  },
  {
    id: "6",
    name: "Admin HandiConnect",
    email: "admin@handiconnect.com",
    password: "admin123",
    avatar: "/placeholder.svg?height=100&width=100",
    accessibilityNeeds: [],
    communicationPreference: "standard",
    interests: ["Administration", "Accessibilité", "Inclusion"],
    bio: "Administrateur de la plateforme HandiConnect.",
    location: "Paris, France",
    role: "admin",
    registeredEvents: [],
    joinedGroups: [],
    contacts: [],
  },
]

// Reported users
export const reportedUsers = [
  {
    id: "7",
    name: "Utilisateur Signalé 1",
    email: "signale1@example.com",
    reason: "Contenu inapproprié",
    reportedBy: "2",
    date: new Date(2025, 2, 15),
  },
  {
    id: "8",
    name: "Utilisateur Signalé 2",
    email: "signale2@example.com",
    reason: "Harcèlement",
    reportedBy: "3",
    date: new Date(2025, 2, 20),
  },
]

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: async (email, password) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const user = mockUsers.find((u) => u.email === email && u.password === password)

        if (user) {
          const { password, ...userWithoutPassword } = user
          set({ user: userWithoutPassword, isAuthenticated: true })
          return { success: true, message: "Connexion réussie" }
        }

        return { success: false, message: "Email ou mot de passe incorrect" }
      },
      register: async (userData) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Check if email already exists
        if (mockUsers.some((u) => u.email === userData.email)) {
          return { success: false, message: "Cette adresse email est déjà utilisée" }
        }

        // Create new user (in a real app, this would be saved to a database)
        const newUser: User & { password: string } = {
          id: String(mockUsers.length + 1),
          name: userData.name || "",
          email: userData.email || "",
          password: userData.password,
          avatar: "/placeholder.svg?height=100&width=100",
          accessibilityNeeds: userData.accessibilityNeeds || [],
          communicationPreference: userData.communicationPreference || "standard",
          interests: userData.interests || [],
          bio: userData.bio || "",
          location: userData.location || "",
          role: "user",
          registeredEvents: [],
          joinedGroups: [],
          contacts: [],
        }

        mockUsers.push(newUser)

        const { password, ...userWithoutPassword } = newUser
        set({ user: userWithoutPassword, isAuthenticated: true })

        return { success: true, message: "Inscription réussie" }
      },
      logout: () => {
        set({ user: null, isAuthenticated: false })
      },
      updateUser: async (userData) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const { user } = get()
        if (!user) return false

        // Update user in mock database
        const userIndex = mockUsers.findIndex((u) => u.id === user.id)
        if (userIndex === -1) return false

        const updatedUser = { ...mockUsers[userIndex], ...userData }
        mockUsers[userIndex] = updatedUser

        // Update user in state
        const { password, ...userWithoutPassword } = updatedUser
        set({ user: userWithoutPassword })

        return true
      },
      resetPassword: async (email) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const user = mockUsers.find((u) => u.email === email)

        if (user) {
          // In a real app, this would send an email with a reset link
          return {
            success: true,
            message: "Un email de réinitialisation a été envoyé à votre adresse email",
          }
        }

        return {
          success: false,
          message: "Aucun compte n'est associé à cette adresse email",
        }
      },
      followUser: async (userId) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const { user } = get()
        if (!user) return false

        // Update user contacts
        const updatedContacts = [...user.contacts]
        const contactIndex = updatedContacts.indexOf(userId)

        if (contactIndex === -1) {
          updatedContacts.push(userId)
        } else {
          updatedContacts.splice(contactIndex, 1)
        }

        // Update user in state and mock database
        const updatedUser = { ...user, contacts: updatedContacts }
        set({ user: updatedUser })

        const userIndex = mockUsers.findIndex((u) => u.id === user.id)
        if (userIndex !== -1) {
          mockUsers[userIndex] = { ...mockUsers[userIndex], contacts: updatedContacts }
        }

        return true
      },
      registerForEvent: async (eventId) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const { user } = get()
        if (!user) return false

        // Update user registered events
        const updatedEvents = [...user.registeredEvents]
        const eventIndex = updatedEvents.indexOf(eventId)

        if (eventIndex === -1) {
          updatedEvents.push(eventId)
        } else {
          updatedEvents.splice(eventIndex, 1)
        }

        // Update user in state and mock database
        const updatedUser = { ...user, registeredEvents: updatedEvents }
        set({ user: updatedUser })

        const userIndex = mockUsers.findIndex((u) => u.id === user.id)
        if (userIndex !== -1) {
          mockUsers[userIndex] = { ...mockUsers[userIndex], registeredEvents: updatedEvents }
        }

        return true
      },
      joinGroup: async (groupId) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const { user } = get()
        if (!user) return false

        // Update user joined groups
        const updatedGroups = [...user.joinedGroups]
        const groupIndex = updatedGroups.indexOf(groupId)

        if (groupIndex === -1) {
          updatedGroups.push(groupId)
        } else {
          updatedGroups.splice(groupIndex, 1)
        }

        // Update user in state and mock database
        const updatedUser = { ...user, joinedGroups: updatedGroups }
        set({ user: updatedUser })

        const userIndex = mockUsers.findIndex((u) => u.id === user.id)
        if (userIndex !== -1) {
          mockUsers[userIndex] = { ...mockUsers[userIndex], joinedGroups: updatedGroups }
        }

        return true
      },
    }),
    {
      name: "auth-storage",
    },
  ),
)

// Helper function to get user by ID
export const getUserById = (userId: string): User | null => {
  const user = mockUsers.find((u) => u.id === userId)
  if (!user) return null

  const { password, ...userWithoutPassword } = user
  return userWithoutPassword
}

// Helper function to get all users
export const getAllUsers = (): User[] => {
  return mockUsers.map(({ password, ...user }) => user)
}

export const addreportedUsers = (newUser : 
{
  id: string,
  name: string,
  email: string,
  reason: string,
  reportedBy: string,
  date: Date,
}): void => {
  reportedUsers.push(newUser);
}