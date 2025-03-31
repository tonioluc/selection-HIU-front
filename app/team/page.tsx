import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Github, Linkedin, Mail } from "lucide-react"

export default function TeamPage() {
  const teamMembers = [
    {
      name: "Sophie Martin",
      role: "Fondatrice & CEO",
      bio: "Experte en accessibilité numérique avec plus de 10 ans d'expérience. Sophie a fondé HandiConnect avec la vision de créer un réseau social véritablement inclusif.",
      image: "/placeholder.svg?height=300&width=300",
      skills: ["Accessibilité", "UX Design", "Gestion de projet"],
      email: "sophie@handiconnect.com",
      github: "sophiemartin",
      linkedin: "sophiemartin",
    },
    {
      name: "Thomas Dubois",
      role: "CTO",
      bio: "Ingénieur en informatique spécialisé dans les technologies d'assistance. Thomas supervise tous les aspects techniques de la plateforme.",
      image: "/placeholder.svg?height=300&width=300",
      skills: ["Développement web", "IA", "Technologies d'assistance"],
      email: "thomas@handiconnect.com",
      github: "thomasdubois",
      linkedin: "thomasdubois",
    },
    {
      name: "Emma Leroy",
      role: "Responsable UX/UI",
      bio: "Designer passionnée par l'accessibilité numérique. Emma s'assure que l'interface de HandiConnect est à la fois belle et accessible à tous.",
      image: "/placeholder.svg?height=300&width=300",
      skills: ["Design inclusif", "Recherche utilisateur", "Prototypage"],
      email: "emma@handiconnect.com",
      github: "emmaleroy",
      linkedin: "emmaleroy",
    },
    {
      name: "Lucas Bernard",
      role: "Développeur IA",
      bio: "Spécialiste en intelligence artificielle et en traitement du langage naturel. Lucas développe les fonctionnalités IA de la plateforme.",
      image: "/placeholder.svg?height=300&width=300",
      skills: ["Machine Learning", "NLP", "Computer Vision"],
      email: "lucas@handiconnect.com",
      github: "lucasbernard",
      linkedin: "lucasbernard",
    },
    {
      name: "Marie Petit",
      role: "Responsable Communauté",
      bio: "Experte en communication inclusive. Marie anime la communauté HandiConnect et s'assure que chaque membre se sente bienvenu.",
      image: "/placeholder.svg?height=300&width=300",
      skills: ["Community Management", "Communication inclusive", "Événementiel"],
      email: "marie@handiconnect.com",
      github: "mariepetit",
      linkedin: "mariepetit",
    },
    {
      name: "Antoine Moreau",
      role: "Responsable Accessibilité",
      bio: "Consultant en accessibilité numérique. Antoine veille à ce que HandiConnect respecte les normes d'accessibilité les plus strictes.",
      image: "/placeholder.svg?height=300&width=300",
      skills: ["WCAG", "ARIA", "Tests d'accessibilité"],
      email: "antoine@handiconnect.com",
      github: "antoinemoreau",
      linkedin: "antoinemoreau",
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      <MainNavigation />

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-purple-700 dark:text-purple-400 mb-4">Notre Équipe</h1>
          <p className="text-xl max-w-3xl mx-auto text-gray-700 dark:text-gray-300">
            Découvrez les personnes passionnées qui travaillent chaque jour pour rendre HandiConnect plus inclusif et
            accessible à tous.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member) => (
            <Card key={member.name} className="overflow-hidden">
              <div className="aspect-square overflow-hidden">
                <img
                  src={member.image || "/placeholder.svg"}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle>{member.name}</CardTitle>
                <CardDescription>{member.role}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{member.bio}</p>

                <div>
                  <p className="text-sm font-medium mb-2">Compétences :</p>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <a
                    href={`mailto:${member.email}`}
                    className="text-gray-500 hover:text-purple-600 transition-colors"
                    aria-label={`Envoyer un email à ${member.name}`}
                  >
                    <Mail className="h-5 w-5" />
                  </a>
                  <a
                    href={`https://github.com/${member.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-purple-600 transition-colors"
                    aria-label={`Profil GitHub de ${member.name}`}
                  >
                    <Github className="h-5 w-5" />
                  </a>
                  <a
                    href={`https://linkedin.com/in/${member.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-purple-600 transition-colors"
                    aria-label={`Profil LinkedIn de ${member.name}`}
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}

