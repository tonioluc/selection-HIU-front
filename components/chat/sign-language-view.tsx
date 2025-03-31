"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

// Définition des gestes de langue des signes
const signGestures = [
  {
    name: "Bonjour",
    description: "Main ouverte, paume vers l'avant, doigts écartés",
    confidence: 0.85,
  },
  {
    name: "Merci",
    description: "Main à plat sur le menton puis s'éloignant",
    confidence: 0.78,
  },
  {
    name: "Oui",
    description: "Poing fermé avec pouce levé",
    confidence: 0.92,
  },
  {
    name: "Non",
    description: "Index et majeur en V horizontal",
    confidence: 0.88,
  },
  {
    name: "S'il vous plaît",
    description: "Main à plat sur la poitrine avec mouvement circulaire",
    confidence: 0.75,
  },
  {
    name: "Comment ça va ?",
    description: "Mains ouvertes, paumes vers le haut, mouvement d'avant en arrière",
    confidence: 0.82,
  },
  {
    name: "Au revoir",
    description: "Main ouverte avec mouvement de gauche à droite",
    confidence: 0.9,
  },
]

type SignLanguageViewProps = {
  onSignDetected?: (text: string) => void
}

export function SignLanguageView({ onSignDetected }: SignLanguageViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [detectedSign, setDetectedSign] = useState<{ name: string; confidence: number } | null>(null)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [gestureHistory, setGestureHistory] = useState<string[]>([])
  const requestRef = useRef<number | null>(null)
  const lastDetectionTime = useRef<number>(0)

  // Configurer la caméra
  useEffect(() => {
    let stream: MediaStream | null = null

    async function setupCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
          audio: false,
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth
              canvasRef.current.height = videoRef.current.videoHeight

              // Simuler le chargement du modèle
              setTimeout(() => {
                setIsModelLoading(false)
                startHandTracking()
              }, 1500)
            }
          }
        }

        setError(null)
      } catch (err) {
        console.error("Erreur d'accès à la caméra:", err)
        setError("Impossible d'accéder à la caméra. Veuillez vérifier les permissions.")
      }
    }

    setupCamera()

    // Nettoyage
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [])

  // Fonction pour démarrer le suivi des mains
  const startHandTracking = () => {
    if (!videoRef.current || !canvasRef.current) return

    const detectHands = () => {
      if (!videoRef.current || !canvasRef.current) return

      try {
        const ctx = canvasRef.current.getContext("2d")
        if (ctx) {
          // Dessiner le flux vidéo sur le canvas
          ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)

          // Simuler la détection des mains
          drawSimulatedHand(ctx, canvasRef.current.width, canvasRef.current.height)

          // Détecter un geste périodiquement
          const now = Date.now()
          if (now - lastDetectionTime.current > 2000) {
            // Toutes les 2 secondes
            lastDetectionTime.current = now

            // 30% de chance de détecter un geste
            if (Math.random() < 0.3) {
              const randomGesture = signGestures[Math.floor(Math.random() * signGestures.length)]

              // Ajouter le geste à l'historique
              setGestureHistory((prev) => {
                const newHistory = [...prev, randomGesture.name]
                // Garder seulement les 3 derniers gestes
                if (newHistory.length > 3) {
                  newHistory.shift()
                }
                return newHistory
              })

              // Si le même geste est détecté plusieurs fois consécutivement
              if (
                gestureHistory.length >= 2 &&
                gestureHistory.every((g) => g === randomGesture.name) &&
                randomGesture.name !== detectedSign?.name
              ) {
                setIsProcessing(true)

                // Simuler un temps de traitement
                setTimeout(() => {
                  setDetectedSign({
                    name: randomGesture.name,
                    confidence: randomGesture.confidence,
                  })

                  if (onSignDetected) {
                    onSignDetected(randomGesture.name)
                  }

                  setIsProcessing(false)
                }, 500)
              }
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors de la détection des mains:", error)
      }

      // Continuer la boucle de détection
      requestRef.current = requestAnimationFrame(detectHands)
    }

    detectHands()
  }

  // Fonction pour dessiner une main simulée
  const drawSimulatedHand = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Position de base de la main
    const centerX = width / 2 + Math.sin(Date.now() / 1000) * 50
    const centerY = height / 2 + Math.cos(Date.now() / 1000) * 30

    // Dessiner la paume
    ctx.beginPath()
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI)
    ctx.fillStyle = "rgba(0, 255, 255, 0.5)"
    ctx.fill()
    ctx.strokeStyle = "aqua"
    ctx.lineWidth = 2
    ctx.stroke()

    // Dessiner les doigts
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI) / 2.5 + Math.sin(Date.now() / 1000 + i) * 0.2
      const length = 60 + Math.sin(Date.now() / 800 + i * 0.5) * 15

      // Point de départ (paume)
      const startX = centerX
      const startY = centerY

      // Premier segment du doigt
      const midX = startX + Math.cos(angle) * (length * 0.5)
      const midY = startY - Math.sin(angle) * (length * 0.5)

      // Bout du doigt
      const endX = startX + Math.cos(angle) * length
      const endY = startY - Math.sin(angle) * length

      // Dessiner les segments
      ctx.beginPath()
      ctx.moveTo(startX, startY)
      ctx.lineTo(midX, midY)
      ctx.lineTo(endX, endY)
      ctx.strokeStyle = ["red", "blue", "yellow", "green", "purple"][i]
      ctx.lineWidth = 3
      ctx.stroke()

      // Dessiner les articulations
      ctx.beginPath()
      ctx.arc(midX, midY, 5, 0, 2 * Math.PI)
      ctx.fillStyle = "white"
      ctx.fill()

      ctx.beginPath()
      ctx.arc(endX, endY, 5, 0, 2 * Math.PI)
      ctx.fillStyle = "white"
      ctx.fill()
    }
  }

  return (
    <div className="mt-4">
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : isModelLoading ? (
        <div className="text-center py-4">
          <p className="mb-2">Chargement du modèle de reconnaissance...</p>
          <Progress value={Math.random() * 100} className="h-2" />
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="relative">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto" />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />

            {isProcessing && (
              <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-2">
                <p className="text-center text-sm mb-1">Analyse en cours...</p>
                <Progress value={Math.random() * 100} className="h-2" />
              </div>
            )}

            {detectedSign && !isProcessing && (
              <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-2">
                <p className="text-center text-sm font-medium">Signe détecté : {detectedSign.name}</p>
                <div className="flex items-center mt-1">
                  <span className="text-xs mr-2">Confiance :</span>
                  <Progress value={detectedSign.confidence * 100} className="h-2 flex-1" />
                  <span className="text-xs ml-2">{Math.round(detectedSign.confidence * 100)}%</span>
                </div>
              </div>
            )}
          </div>
          <p className="text-center text-sm p-2 bg-muted">Système de reconnaissance de langue des signes actif</p>
        </Card>
      )}
    </div>
  )
}

