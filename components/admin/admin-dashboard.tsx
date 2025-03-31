"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllUsers } from "@/lib/auth"
import { useEvents } from "@/lib/events"
import { useGroups } from "@/lib/groups"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Users, Calendar, MessageSquare, UserPlus } from "lucide-react"

export function AdminDashboard() {
  const users = getAllUsers()
  const { events } = useEvents()
  const { groups } = useGroups()

  // User statistics
  const totalUsers = users.length
  const activeUsers = Math.floor(totalUsers * 0.8) // Simulated active users (80%)
  const newUsersThisMonth = Math.floor(totalUsers * 0.2) // Simulated new users this month (20%)

  // Accessibility needs distribution
  const accessibilityNeeds = users.reduce((acc: Record<string, number>, user) => {
    user.accessibilityNeeds.forEach((need) => {
      acc[need] = (acc[need] || 0) + 1
    })
    return acc
  }, {})

  const accessibilityData = Object.entries(accessibilityNeeds).map(([name, value]) => ({
    name,
    value,
  }))

  // Monthly registrations data (simulated)
  const monthlyRegistrations = [
    { name: "Jan", users: 12 },
    { name: "Fév", users: 19 },
    { name: "Mar", users: 25 },
    { name: "Avr", users: 32 },
    { name: "Mai", users: 40 },
    { name: "Juin", users: 45 },
  ]

  // Pie chart colors
  const COLORS = ["#8884d8", "#83a6ed", "#8dd1e1", "#82ca9d", "#a4de6c", "#d0ed57"]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-500" />
              Utilisateurs
            </CardTitle>
            <CardDescription>Total des utilisateurs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">{activeUsers} utilisateurs actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <UserPlus className="h-5 w-5 mr-2 text-blue-500" />
              Nouveaux
            </CardTitle>
            <CardDescription>Nouveaux ce mois-ci</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newUsersThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(newUsersThisMonth * 0.15)} par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-green-500" />
              Événements
            </CardTitle>
            <CardDescription>Total des événements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              {events.filter((e) => e.date > new Date()).length} événements à venir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-amber-500" />
              Groupes
            </CardTitle>
            <CardDescription>Total des groupes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
            <p className="text-xs text-muted-foreground">
              {Math.floor(groups.reduce((acc, group) => acc + group.posts, 0))} publications
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inscriptions mensuelles</CardTitle>
            <CardDescription>Nombre d'inscriptions par mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRegistrations} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill="#8884d8" name="Utilisateurs" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Besoins d'accessibilité</CardTitle>
            <CardDescription>Distribution des besoins d'accessibilité</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={accessibilityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {accessibilityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

