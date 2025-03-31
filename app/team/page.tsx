import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Github, Linkedin, Mail } from "lucide-react"

export default function TeamPage() {
  const teamMembers = [
    {
      name: "RAZAFIMBAHINY Anjara Nasolo Ericka",
      role: "Cheffe de Projet",
      bio: "Pionnière en accessibilité numérique, Ericka met à profit plus de 10 ans d'expertise pour diriger HandiConnect. Sa vision innovante et sa passion pour l'inclusion inspirent chaque aspect du projet, garantissant une plateforme où chacun peut se sentir chez soi.",
      image: "/Ericka.jpg?height=300&width=300",
      skills: ["Gestion de projet", "Full-stack", "DevOps"],
      email: "anjaranasoloericka@gmail.com",
      github: "Anjaranasoloericka",
      linkedin: "anjaranasoloericka",
    },
    {
      name: "Fenosoa RANDRIAMAMPIONONA",
      role: "Design",
      bio: "Visionnaire en design inclusif, Fenosoa façonne l'expérience utilisateur de HandiConnect. Sa créativité et son expertise en design 3D et web garantissent une interface intuitive, esthétique et accessible à tous.",
      image: "/Feno.jpg?height=300&width=300",
      skills: ["UI/UX Design", "Design 3D", "Front-end"],
      email: "fenorandriamampionona2@gmail.com",
      github: "fenorandria",
      linkedin: "fenorandriamampionona",
    },
    {
      name: "RANDRIAMIHAJA Luc Antonio",
      role: "Intégrateur API",
      bio: "Antonio, véritable expert en informatique, s'assure que chaque intégration technique fonctionne à la perfection. Grâce à ses compétences pointues en développement back-end et API, il joue un rôle essentiel dans la fluidité de la plateforme.",
      image: "/Antonio.jpg?height=300&width=300",
      skills: ["API", "Back-end", "Cloud"],
      email: "antoniorandria3342@gmail.com",
      github: "tonioluc",
    },
    {
      name: "RANDRIANASOLO Tafita Fitia",
      role: "Back-end",
      bio: "Avec une maîtrise des technologies d'IA et du traitement du langage naturel, Tafita révolutionne les fonctionnalités intelligentes de HandiConnect, rendant la plateforme plus intuitive et réactive que jamais.",
      image: "/Tafita.jpg?height=300&width=300",
      skills: ["Back-end", "IA", "NLP"],
      email: "tafitaran05@gmail.com",
      github: "Tafitia",
    },
    {
      name: "ANDRIATSARA Iratra Fernand",
      role: "Back-end",
      bio: "Iratra excelle dans la conception de solutions robustes pour HandiConnect. Avec un talent unique pour le back-end et les tests d'API, il garantit une performance technique irréprochable tout en s'assurant de l'accessibilité de la plateforme.",
      image: "/Iratra.jpg?height=300&width=300",
      skills: ["Back-end", "Tests d'API", "Bases de données"],
      email: "iratra53@gmail.com",
      github: "shinyiratra",
    },
];


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

