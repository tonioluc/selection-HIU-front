"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MainNavigation } from "@/components/main-navigation"

export default function CommunityPage() {
  const router = useRouter()
  const [isIframeLoaded, setIsIframeLoaded] = useState(false)



  return (
    <>
    <MainNavigation />
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Ma Communauté Virtuelle</CardTitle>
          <CardDescription>Explorez et interagissez avec votre communauté virtuelle HandiConnect</CardDescription>
        </CardHeader>
        <CardContent>
          {!isIframeLoaded && (
            <div className="flex flex-col items-center justify-center h-[500px]">
              <Skeleton className="h-[500px] w-full absolute" />
              <p className="text-center z-10">Chargement de votre espace communautaire...</p>
            </div>
          )}
          <iframe
            src="https://kzmklpg5gwlidqk9t9x5.lite.vusercontent.net/"
            className="w-full h-[600px] border-0 rounded-md"
            title="Communauté virtuelle HandiConnect"
            onLoad={() => setIsIframeLoaded(true)}
            style={{ display: isIframeLoaded ? "block" : "block", opacity: isIframeLoaded ? 1 : 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Cet espace communautaire vous permet d'interagir avec d'autres membres de HandiConnect dans un
              environnement virtuel accessible.
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setIsIframeLoaded(false)}>
                Rafraîchir
              </Button>
              <Button
                variant="default"
                onClick={() => window.open("https://kzmqzpxazjq5dhngjxag.lite.vusercontent.net/", "_blank")}
              >
                Ouvrir en plein écran
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  )
}