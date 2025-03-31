import { MainNavigation } from "@/components/main-navigation"
import { RegistrationForm } from "@/components/auth/registration-form"

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      <MainNavigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-6 text-center">Créer un compte</h1>

          <RegistrationForm />
        </div>
      </div>
    </main>
  )
}

