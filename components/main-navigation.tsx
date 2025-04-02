"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MoonIcon, SunIcon, Menu, X, User, LogOut, Settings, Mic } from "lucide-react"
import { useTheme } from "next-themes"
import { AccessibilityMenu } from "./accessibility-menu"
import { useAuth } from "@/lib/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SettingsPanel } from "./settings-panel"

export function MainNavigation() {
  const { theme, setTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  if (!mounted) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">HandiConnect</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {isAuthenticated && (
            <>
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400 ${
                  pathname === "/dashboard" ? "text-purple-600 dark:text-purple-400" : ""
                }`}
              >
                Tableau de bord
              </Link>
              <Link
                href="/chat"
                className={`text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400 ${
                  pathname === "/chat" || pathname.startsWith("/chat/") ? "text-purple-600 dark:text-purple-400" : ""
                }`}
              >
                Chat
              </Link>
              <Link
                href="/profiles"
                className={`text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400 ${
                  pathname === "/profiles" || pathname.startsWith("/profiles/")
                    ? "text-purple-600 dark:text-purple-400"
                    : ""
                }`}
              >
                Profils
              </Link>
              <Link
                href="/groups"
                className={`text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400 ${
                  pathname === "/events" || pathname.startsWith("/events/")
                    ? "text-purple-600 dark:text-purple-400"
                    : ""
                }`}
              >
                Groupes
              </Link>
              <Link
                href="/community"
                className={`text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400 ${
                  pathname === "/events" || pathname.startsWith("/events/")
                    ? "text-purple-600 dark:text-purple-400"
                    : ""
                }`}
              >
                Ma communauté virtuelle
              </Link>
              <Link
                href="/events"
                className={`text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400 ${
                  pathname === "/events" || pathname.startsWith("/events/")
                    ? "text-purple-600 dark:text-purple-400"
                    : ""
                }`}
              >
                Événements
              </Link>
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className={`text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400 ${
                    pathname === "/admin" || pathname.startsWith("/admin/")
                      ? "text-purple-600 dark:text-purple-400"
                      : ""
                  }`}
                >
                  Admin
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Passer au mode clair" : "Passer au mode sombre"}
          >
            {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => document.dispatchEvent(new CustomEvent("toggleVoiceAssistant"))}
            aria-label="Assistant vocal"
          >
            <Mic className="h-5 w-5" />
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Paramètres complets">
                <Settings className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Paramètres</SheetTitle>
                <SheetDescription>Personnalisez votre expérience HandiConnect</SheetDescription>
              </SheetHeader>
              <SettingsPanel />
            </SheetContent>
          </Sheet>

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Mon profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild variant="ghost">
                <Link href="/login">Se connecter</Link>
              </Button>
              <Button asChild>
                <Link href="/register">S'inscrire</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden p-4 bg-background border-b">
          <nav className="flex flex-col space-y-4">
            {isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400 ${
                    pathname === "/dashboard" ? "text-purple-600 dark:text-purple-400" : ""
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Tableau de bord
                </Link>
                <Link
                  href="/chat"
                  className={`text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400 ${
                    pathname === "/chat" || pathname.startsWith("/chat/") ? "text-purple-600 dark:text-purple-400" : ""
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Chat
                </Link>
                <Link
                  href="/profiles"
                  className={`text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400 ${
                    pathname === "/profiles" || pathname.startsWith("/profiles/")
                      ? "text-purple-600 dark:text-purple-400"
                      : ""
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profils
                </Link>
                <Link
                  href="/groups"
                  className={`text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400 ${
                    pathname === "/profiles" || pathname.startsWith("/profiles/")
                      ? "text-purple-600 dark:text-purple-400"
                      : ""
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Groupes
                </Link>
                <Link
                  href="/community"
                  className={`text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400 ${
                    pathname === "/profiles" || pathname.startsWith("/profiles/")
                      ? "text-purple-600 dark:text-purple-400"
                      : ""
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Ma communauté virtuelle
                </Link>
                <Link
                  href="/events"
                  className={`text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400 ${
                    pathname === "/events" || pathname.startsWith("/events/")
                      ? "text-purple-600 dark:text-purple-400"
                      : ""
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Événements
                </Link>
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className={`text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400 ${
                      pathname === "/admin" || pathname.startsWith("/admin/")
                        ? "text-purple-600 dark:text-purple-400"
                        : ""
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <div className="border-t my-2 pt-2">
                  <Button variant="ghost" className="w-full justify-start px-2" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Se déconnecter
                  </Button>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

