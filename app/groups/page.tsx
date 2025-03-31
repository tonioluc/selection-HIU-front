import { MainNavigation } from "@/components/main-navigation"
import { GroupsList } from "@/components/groups/groups-list"

export default function GroupsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      <MainNavigation />

      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-6">Groupes</h1>

        <GroupsList />
      </div>
    </main>
  )
}

