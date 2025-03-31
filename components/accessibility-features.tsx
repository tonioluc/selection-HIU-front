import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, MessageSquare, Eye, Brain } from "lucide-react"

export function AccessibilityFeatures() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-12">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            <span>Pour les personnes sourdes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Chat avec traduction en langue des signes via IA et webcam. Visualisez les conversations en temps réel.</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-green-500" />
            <span>Pour les personnes muettes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Générateur de voix IA qui lit vos messages à haute voix. Exprimez-vous sans contraintes.</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-amber-500" />
            <span>Pour les personnes aveugles</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Synthèse vocale avancée et retour haptique pour lire les messages et naviguer dans l'interface.</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <span>Pour les personnes autistes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Mode simplifié avec emojis et pictogrammes pour mieux exprimer et comprendre les émotions.</p>
        </CardContent>
      </Card>
    </div>
  )
}

