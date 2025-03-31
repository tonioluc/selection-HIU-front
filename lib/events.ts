"use client"

import { create } from "zustand"

export type Event = {
  id: string
  title: string
  description: string
  date: Date
  location: string
  category: string
  accessibility: string[]
  attendees: number
  image: string
  createdBy: string
}

type EventsState = {
  events: Event[]
  getEventById: (id: string) => Event | undefined
  createEvent: (event: Omit<Event, "id">) => Promise<Event>
  updateEvent: (id: string, event: Partial<Event>) => Promise<boolean>
  deleteEvent: (id: string) => Promise<boolean>
}

// Sample events data
const eventsData: Event[] = [
  {
    id: "1",
    title: "Atelier d'art inclusif",
    description:
      "Un atelier d'art adapté à tous les types de handicap. Venez exprimer votre créativité dans un environnement bienveillant.",
    date: new Date(2025, 3, 15, 15, 0),
    location: "Centre culturel, Paris",
    category: "Art",
    accessibility: ["Accès fauteuil roulant", "Interprète LSF", "Documents en braille"],
    attendees: 18,
    image: "/placeholder.svg?height=200&width=400",
    createdBy: "1",
  },
  {
    id: "2",
    title: "Café-rencontre HandiConnect",
    description:
      "Une occasion de rencontrer d'autres membres de la communauté HandiConnect autour d'un café dans un lieu accessible.",
    date: new Date(2025, 3, 10, 14, 30),
    location: "Café Inclusif, Lyon",
    category: "Social",
    accessibility: ["Accès fauteuil roulant", "Menu en braille", "Personnel formé"],
    attendees: 25,
    image: "/placeholder.svg?height=200&width=400",
    createdBy: "2",
  },
  {
    id: "3",
    title: "Conférence sur les technologies d'assistance",
    description:
      "Découvrez les dernières innovations en matière de technologies d'assistance pour tous types de handicap.",
    date: new Date(2025, 3, 20, 10, 0),
    location: "Centre de conférences, Bordeaux",
    category: "Technologie",
    accessibility: ["Accès fauteuil roulant", "Boucle magnétique", "Sous-titrage en direct"],
    attendees: 42,
    image: "/placeholder.svg?height=200&width=400",
    createdBy: "3",
  },
  {
    id: "4",
    title: "Initiation au handisport",
    description: "Venez découvrir et essayer différents sports adaptés, encadrés par des professionnels.",
    date: new Date(2025, 3, 25, 9, 0),
    location: "Complexe sportif, Marseille",
    category: "Sport",
    accessibility: ["Accès fauteuil roulant", "Équipement adapté", "Vestiaires accessibles"],
    attendees: 30,
    image: "/placeholder.svg?height=200&width=400",
    createdBy: "4",
  },
  {
    id: "5",
    title: "Groupe de parole",
    description: "Un espace d'échange et de partage d'expériences entre personnes en situation de handicap.",
    date: new Date(2025, 3, 12, 18, 0),
    location: "Centre associatif, Lille",
    category: "Bien-être",
    accessibility: ["Accès fauteuil roulant", "Interprète LSF", "Salle calme"],
    attendees: 15,
    image: "/placeholder.svg?height=200&width=400",
    createdBy: "5",
  },
  {
    id: "6",
    title: "Projection de film avec audiodescription",
    description: "Projection d'un film récent avec audiodescription et sous-titrage pour sourds et malentendants.",
    date: new Date(2025, 3, 18, 20, 0),
    location: "Cinéma Le Central, Toulouse",
    category: "Culture",
    accessibility: ["Accès fauteuil roulant", "Audiodescription", "Sous-titrage SME"],
    attendees: 35,
    image: "/placeholder.svg?height=200&width=400",
    createdBy: "1",
  },
]

export const useEvents = create<EventsState>((set, get) => ({
  events: eventsData,
  getEventById: (id) => {
    return get().events.find((event) => event.id === id)
  },
  createEvent: async (event) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newEvent: Event = {
      ...event,
      id: String(get().events.length + 1),
    }

    set((state) => ({
      events: [...state.events, newEvent],
    }))

    return newEvent
  },
  updateEvent: async (id, eventData) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const eventIndex = get().events.findIndex((event) => event.id === id)
    if (eventIndex === -1) return false

    const updatedEvents = [...get().events]
    updatedEvents[eventIndex] = { ...updatedEvents[eventIndex], ...eventData }

    set({ events: updatedEvents })

    return true
  },
  deleteEvent: async (id) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    set((state) => ({
      events: state.events.filter((event) => event.id !== id),
    }))

    return true
  },
}))

