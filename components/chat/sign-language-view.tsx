"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Camera, Hand } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

// Séquence ordonnée de signes en français avec leurs descriptions
const signSequence = [
  {
    sign: "Bonjour",
    description: "Main ouverte près du menton, puis éloignée",
  },
  {
    sign: "Comment ça va",
    description: "Index et majeur des deux mains levés",
  },
  {
    sign: "Merci",
    description: "Main plate touchant les lèvres puis s'éloignant",
  },
  {
    sign: "Je m'appelle",
    description: "Index pointant vers soi puis formant des lettres",
  },
  {
    sign: "Oui",
    description: "Poing fermé avec mouvement de haut en bas",
  },
  {
    sign: "Non",
    description: "Index et majeur étendus avec mouvement latéral",
  },
  {
    sign: "S'il vous plaît",
    description: "Main plate sur la poitrine avec mouvement circulaire",
  },
  {
    sign: "Au revoir",
    description: "Main qui s'agite de gauche à droite",
  },
]

type SignLanguageViewProps = {
  onSignDetected?: (text: string) => void
}

export function SignLanguageView({ onSignDetected }: SignLanguageViewProps) {
  // Références
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detectionFrameRef = useRef<HTMLDivElement>(null)

  // États
  const [cameraActive, setCameraActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraStatus, setCameraStatus] = useState<string>("inactive")
  const [handDetected, setHandDetected] = useState(false)
  const [detectedSign, setDetectedSign] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(0)
  const [handInFrame, setHandInFrame] = useState(false)
  const [currentSignIndex, setCurrentSignIndex] = useState(0)
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [handPosition, setHandPosition] = useState({ x: 0, y: 0 })
  const [isHandMoving, setIsHandMoving] = useState(false)

  // Référence pour l'animation
  const animationRef = useRef<number | null>(null)
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const sequenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Fonction pour démarrer la caméra
  const startCamera = async () => {
    try {
      setCameraStatus("requesting")

      // Vérifier si l'élément vidéo existe
      if (!videoRef.current) {
        setError("Élément vidéo non disponible")
        setCameraStatus("error")
        return
      }

      // Demander l'accès à la caméra
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })

      // Connecter le stream à l'élément vidéo
      videoRef.current.srcObject = stream
      setCameraStatus("connected")

      // Démarrer la lecture vidéo
      try {
        await videoRef.current.play()
        setCameraActive(true)
        setCameraStatus("playing")

        // Initialiser le canvas
        if (canvasRef.current && videoRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth || 640
          canvasRef.current.height = videoRef.current.videoHeight || 480
        }

        // Réinitialiser l'index du signe
        setCurrentSignIndex(0)
        setDetectedSign(null)
        setCountdown(null)
        setIsRecognizing(false)

        // Démarrer la simulation immédiatement
        startSimulation()

        console.log("Caméra démarrée, simulation initialisée")
      } catch (playError) {
        console.error("Erreur lors de la lecture vidéo:", playError)
        setError("Impossible de lire le flux vidéo")
        setCameraStatus("error")

        // Arrêter les tracks si la lecture échoue
        stream.getTracks().forEach((track) => track.stop())
      }
    } catch (err) {
      console.error("Erreur d'accès à la caméra:", err)
      setError("Impossible d'accéder à la caméra. Veuillez vérifier les permissions.")
      setCameraStatus("error")
    }
  }

  // Fonction pour démarrer la simulation complète
  const startSimulation = () => {
    // Démarrer la détection simulée pour le rendu visuel
    startSimulatedDetection()

    // Simuler la détection de la main immédiatement
    setTimeout(() => {
      // Simuler la main dans le cadre
      setHandInFrame(true)

      // Initialiser la position de la main au centre
      if (detectionFrameRef.current) {
        const rect = detectionFrameRef.current.getBoundingClientRect()
        setHandPosition({
          x: rect.width / 2,
          y: rect.height / 2,
        })
      }

      console.log("Main simulée dans le cadre")

      // Simuler la détection de la main après un court délai
      setTimeout(() => {
        setHandDetected(true)

        // Définir le premier signe immédiatement
        const firstSign = signSequence[currentSignIndex].sign
        setDetectedSign(firstSign)
        setConfidence(Math.floor(Math.random() * 20) + 80) // Entre 80% et 99%

        // Notifier le parent avec le premier signe immédiatement
        if (onSignDetected) {
          onSignDetected(firstSign)
        }

        // Démarrer la séquence de reconnaissance
        startSignRecognitionSequence()

        console.log("Main reconnue, démarrage de la séquence avec le signe:", firstSign)
      }, 1000) // Délai de 1 seconde pour la détection
    }, 500) // Délai de 0.5 seconde pour l'apparition de la main
  }

  // Fonction pour arrêter la caméra
  const stopCamera = () => {
    setCameraStatus("stopping")

    // Arrêter la simulation
    stopSimulation()

    // Vérifier si l'élément vidéo existe
    if (!videoRef.current) {
      setCameraActive(false)
      setCameraStatus("inactive")
      return
    }

    // Récupérer le stream
    const stream = videoRef.current.srcObject as MediaStream

    // Arrêter tous les tracks
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }

    // Déconnecter le stream
    videoRef.current.srcObject = null

    // Mettre à jour les états
    setCameraActive(false)
    setCameraStatus("inactive")
    setHandDetected(false)
    setDetectedSign(null)
    setHandInFrame(false)
    setIsRecognizing(false)
    setCountdown(null)
  }

  // Fonction pour basculer l'état de la caméra
  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera()
    } else {
      startCamera()
    }
  }

  // Fonction pour démarrer la détection simulée (rendu visuel)
  const startSimulatedDetection = () => {
    if (!canvasRef.current || !videoRef.current) return

    // Fonction de détection
    const detect = () => {
      if (!canvasRef.current || !videoRef.current || !cameraActive) return

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      if (!ctx) return

      // Effacer le canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Si la main est dans le cadre, la dessiner
      if (handInFrame) {
        drawSimulatedHand(ctx)

        // Simuler un mouvement aléatoire de la main
        simulateHandMovement()
      }

      // Continuer la détection
      animationRef.current = requestAnimationFrame(detect)
    }

    // Démarrer la boucle de détection
    animationRef.current = requestAnimationFrame(detect)
  }

  // Fonction pour simuler le mouvement de la main
  const simulateHandMovement = () => {
    // Simuler un mouvement léger de la main
    if (Math.random() < 0.1) {
      setIsHandMoving(true)
      setTimeout(() => setIsHandMoving(false), 500)
    }

    // Mettre à jour la position de la main avec un léger mouvement
    setHandPosition((prev) => ({
      x: prev.x + (Math.random() - 0.5) * 5,
      y: prev.y + (Math.random() - 0.5) * 5,
    }))
  }

  // Fonction pour arrêter la simulation
  const stopSimulation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    if (simulationTimerRef.current) {
      clearTimeout(simulationTimerRef.current)
      simulationTimerRef.current = null
    }

    if (sequenceTimerRef.current) {
      clearTimeout(sequenceTimerRef.current)
      sequenceTimerRef.current = null
    }

    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
  }

  // Fonction pour démarrer la séquence de reconnaissance des signes
  const startSignRecognitionSequence = () => {
    if (isRecognizing) return

    setIsRecognizing(true)

    // Ne pas reconnaître le premier signe immédiatement car déjà fait dans startSimulation
    // recognizeCurrentSign()

    // Démarrer le compte à rebours
    setCountdown(5) // Commencer le compte à rebours à 5 secondes
    startCountdown()
  }

  // Fonction pour gérer le compte à rebours
  const startCountdown = () => {
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current)
    }

    const tick = () => {
      setCountdown((prev) => {
        if (prev === null) return null

        if (prev <= 1) {
          // Quand le compte à rebours atteint zéro, passer au signe suivant
          const nextIndex = (currentSignIndex + 1) % signSequence.length
          setCurrentSignIndex(nextIndex)

          // Reconnaître immédiatement le nouveau signe
          setTimeout(() => {
            // Obtenir le nouveau signe
            const newSign = signSequence[nextIndex].sign
            setDetectedSign(newSign)
            setConfidence(Math.floor(Math.random() * 20) + 80) // Entre 80% et 99%

            // Notifier le parent avec le nouveau signe
            if (onSignDetected) {
              onSignDetected(newSign)
            }

            console.log("Nouveau signe reconnu:", newSign)
          }, 100)

          return 5 // Réinitialiser à 5 secondes
        }

        return prev - 1
      })

      countdownTimerRef.current = setTimeout(tick, 1000)
    }

    countdownTimerRef.current = setTimeout(tick, 1000)
  }

  // Fonction pour passer au signe suivant
  // const moveToNextSign = () => {
  //   // Passer au signe suivant
  //   const nextIndex = (currentSignIndex + 1) % signSequence.length
  //   setCurrentSignIndex(nextIndex)
  // }

  // Fonction pour reconnaître le signe actuel
  const recognizeCurrentSign = () => {
    if (!handDetected || !isRecognizing) return

    // Obtenir le signe actuel
    const currentSign = signSequence[currentSignIndex]

    // Mettre à jour l'état
    setDetectedSign(currentSign.sign)
    setConfidence(Math.floor(Math.random() * 20) + 80) // Entre 80% et 99%

    // Notifier le parent avec le signe actuel
    if (onSignDetected) {
      onSignDetected(currentSign.sign)
    }

    console.log("Signe reconnu:", currentSign.sign, "à l'index:", currentSignIndex)
  }

  // Fonction pour dessiner une main simulée
  const drawSimulatedHand = (ctx: CanvasRenderingContext2D) => {
    if (!canvasRef.current || !detectionFrameRef.current) return

    const canvas = canvasRef.current

    // Récupérer les dimensions du cadre de détection
    const frameRect = detectionFrameRef.current.getBoundingClientRect()
    const canvasRect = canvas.getBoundingClientRect()

    // Convertir les coordonnées du cadre en coordonnées du canvas
    const scaleX = canvas.width / canvasRect.width
    const scaleY = canvas.height / canvasRect.height

    const frameX = (frameRect.left - canvasRect.left) * scaleX
    const frameY = (frameRect.top - canvasRect.top) * scaleY
    const frameWidth = frameRect.width * scaleX
    const frameHeight = frameRect.height * scaleY

    // Calculer la position de la main en tenant compte du mouvement simulé
    const handX = frameX + frameWidth * 0.1 + handPosition.x * 0.1
    const handY = frameY + frameHeight * 0.1 + handPosition.y * 0.1
    const handWidth = frameWidth * scaleX * 0.8
    const handHeight = frameHeight * scaleY * 0.8

    // Ajouter un effet de tremblement si la main est en mouvement
    const jitter = isHandMoving ? (Math.random() - 0.5) * 5 : 0

    // Dessiner un contour de main plus visible
    ctx.strokeStyle = "#00FF00"
    ctx.lineWidth = 3
    ctx.strokeRect(handX + jitter, handY + jitter, handWidth, handHeight)

    // Ajouter une étiquette plus visible
    ctx.fillStyle = "#00FF00"
    ctx.fillRect(handX + jitter, handY + jitter - 30, 80, 30)
    ctx.fillStyle = "#000000"
    ctx.font = "bold 18px Arial"
    ctx.fillText("Main", handX + jitter + 15, handY + jitter - 10)

    // Dessiner les points de la main
    const centerX = handX + handWidth / 2 + jitter
    const centerY = handY + handHeight / 2 + jitter

    // Dessiner un point central plus grand
    ctx.beginPath()
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI)
    ctx.fillStyle = "#00FF00"
    ctx.fill()

    // Dessiner une silhouette de main simplifiée
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)

    // Dessiner le contour d'une main stylisée
    ctx.lineTo(centerX - handWidth * 0.25, centerY - handHeight * 0.3)
    ctx.lineTo(centerX - handWidth * 0.15, centerY - handHeight * 0.4)
    ctx.lineTo(centerX, centerY - handHeight * 0.45)
    ctx.lineTo(centerX + handWidth * 0.15, centerY - handHeight * 0.4)
    ctx.lineTo(centerX + handWidth * 0.25, centerY - handHeight * 0.3)
    ctx.lineTo(centerX, centerY)

    ctx.fillStyle = "rgba(0, 255, 0, 0.2)"
    ctx.fill()
    ctx.strokeStyle = "#00FF00"
    ctx.lineWidth = 2
    ctx.stroke()

    // Adapter la forme de la main en fonction du signe détecté
    let fingerPoints = []

    if (detectedSign) {
      // Adapter la forme de la main en fonction du signe
      switch (detectedSign) {
        case "Bonjour":
          // Main ouverte
          fingerPoints = [
            [centerX - handWidth * 0.3, centerY - handHeight * 0.4], // Pouce
            [centerX - handWidth * 0.1, centerY - handHeight * 0.5], // Index
            [centerX + handWidth * 0.1, centerY - handHeight * 0.5], // Majeur
            [centerX + handWidth * 0.2, centerY - handHeight * 0.4], // Annulaire
            [centerX + handWidth * 0.3, centerY - handHeight * 0.3], // Auriculaire
          ]
          break
        case "Comment ça va":
          // Deux mains ouvertes
          fingerPoints = [
            [centerX - handWidth * 0.4, centerY - handHeight * 0.3], // Pouce gauche
            [centerX - handWidth * 0.3, centerY - handHeight * 0.4], // Index gauche
            [centerX - handWidth * 0.2, centerY - handHeight * 0.4], // Majeur gauche
            [centerX + handWidth * 0.2, centerY - handHeight * 0.4], // Index droit
            [centerX + handWidth * 0.3, centerY - handHeight * 0.4], // Majeur droit
            [centerX + handWidth * 0.4, centerY - handHeight * 0.3], // Pouce droit
          ]
          break
        case "Merci":
          // Main plate
          fingerPoints = [
            [centerX - handWidth * 0.3, centerY - handHeight * 0.1], // Pouce
            [centerX - handWidth * 0.15, centerY - handHeight * 0.3], // Index
            [centerX, centerY - handHeight * 0.3], // Majeur
            [centerX + handWidth * 0.15, centerY - handHeight * 0.3], // Annulaire
            [centerX + handWidth * 0.3, centerY - handHeight * 0.3], // Auriculaire
          ]
          break
        case "Je m'appelle":
          // Index pointant vers soi
          fingerPoints = [
            [centerX - handWidth * 0.3, centerY - handHeight * 0.1], // Pouce
            [centerX, centerY - handHeight * 0.4], // Index pointant
            [centerX + handWidth * 0.1, centerY - handHeight * 0.1], // Majeur plié
            [centerX + handWidth * 0.15, centerY - handHeight * 0.1], // Annulaire plié
            [centerX + handWidth * 0.2, centerY - handHeight * 0.1], // Auriculaire plié
          ]
          break
        case "Oui":
          // Poing fermé
          fingerPoints = [
            [centerX - handWidth * 0.2, centerY - handHeight * 0.1], // Pouce
            [centerX - handWidth * 0.1, centerY - handHeight * 0.1], // Index plié
            [centerX, centerY - handHeight * 0.1], // Majeur plié
            [centerX + handWidth * 0.1, centerY - handHeight * 0.1], // Annulaire plié
            [centerX + handWidth * 0.2, centerY - handHeight * 0.1], // Auriculaire plié
          ]
          break
        case "Non":
          // Index et majeur étendus
          fingerPoints = [
            [centerX - handWidth * 0.3, centerY - handHeight * 0.1], // Pouce
            [centerX - handWidth * 0.1, centerY - handHeight * 0.5], // Index
            [centerX + handWidth * 0.1, centerY - handHeight * 0.5], // Majeur
            [centerX + handWidth * 0.15, centerY - handHeight * 0.1], // Annulaire plié
            [centerX + handWidth * 0.2, centerY - handHeight * 0.1], // Auriculaire plié
          ]
          break
        case "S'il vous plaît":
          // Main plate sur la poitrine
          fingerPoints = [
            [centerX - handWidth * 0.3, centerY - handHeight * 0.1], // Pouce
            [centerX - handWidth * 0.15, centerY - handHeight * 0.2], // Index
            [centerX, centerY - handHeight * 0.2], // Majeur
            [centerX + handWidth * 0.15, centerY - handHeight * 0.2], // Annulaire
            [centerX + handWidth * 0.3, centerY - handHeight * 0.2], // Auriculaire
          ]
          break
        case "Au revoir":
          // Main qui s'agite
          fingerPoints = [
            [centerX - handWidth * 0.3, centerY - handHeight * 0.3], // Pouce
            [centerX - handWidth * 0.1, centerY - handHeight * 0.4], // Index
            [centerX + handWidth * 0.1, centerY - handHeight * 0.4], // Majeur
            [centerX + handWidth * 0.2, centerY - handHeight * 0.3], // Annulaire
            [centerX + handWidth * 0.3, centerY - handHeight * 0.2], // Auriculaire
          ]
          break
        default:
          // Main par défaut
          fingerPoints = [
            [centerX - handWidth * 0.3, centerY - handHeight * 0.4], // Pouce
            [centerX - handWidth * 0.1, centerY - handHeight * 0.5], // Index
            [centerX + handWidth * 0.1, centerY - handHeight * 0.5], // Majeur
            [centerX + handWidth * 0.2, centerY - handHeight * 0.4], // Annulaire
            [centerX + handWidth * 0.3, centerY - handHeight * 0.3], // Auriculaire
          ]
      }
    } else {
      // Main par défaut
      fingerPoints = [
        [centerX - handWidth * 0.3, centerY - handHeight * 0.4], // Pouce
        [centerX - handWidth * 0.1, centerY - handHeight * 0.5], // Index
        [centerX + handWidth * 0.1, centerY - handHeight * 0.5], // Majeur
        [centerX + handWidth * 0.2, centerY - handHeight * 0.4], // Annulaire
        [centerX + handWidth * 0.3, centerY - handHeight * 0.3], // Auriculaire
      ]
    }

    // Dessiner les points des doigts plus grands et plus visibles
    fingerPoints.forEach((point) => {
      ctx.beginPath()
      ctx.arc(point[0], point[1], 6, 0, 2 * Math.PI)
      ctx.fillStyle = "#FFFF00"
      ctx.fill()
      ctx.strokeStyle = "#00FF00"
      ctx.lineWidth = 2
      ctx.stroke()

      // Ligne du centre vers le doigt plus épaisse
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(point[0], point[1])
      ctx.strokeStyle = "#00FF00"
      ctx.lineWidth = 2
      ctx.stroke()
    })

    // Ajouter une animation pour certains signes
    if (detectedSign) {
      // Ajouter des animations spécifiques pour certains signes
      switch (detectedSign) {
        case "Bonjour":
          // Ajouter une flèche de mouvement
          ctx.beginPath()
          ctx.moveTo(centerX, centerY - handHeight * 0.6)
          ctx.lineTo(centerX, centerY - handHeight * 0.8)
          ctx.lineTo(centerX + handWidth * 0.1, centerY - handHeight * 0.7)
          ctx.strokeStyle = "#FFFF00"
          ctx.lineWidth = 2
          ctx.stroke()
          break
        case "Comment ça va":
          // Ajouter des flèches latérales
          ctx.beginPath()
          ctx.moveTo(centerX - handWidth * 0.5, centerY)
          ctx.lineTo(centerX - handWidth * 0.3, centerY)
          ctx.lineTo(centerX - handWidth * 0.4, centerY - handHeight * 0.1)
          ctx.strokeStyle = "#FFFF00"
          ctx.lineWidth = 2
          ctx.stroke()

          ctx.beginPath()
          ctx.moveTo(centerX + handWidth * 0.5, centerY)
          ctx.lineTo(centerX + handWidth * 0.3, centerY)
          ctx.lineTo(centerX + handWidth * 0.4, centerY - handHeight * 0.1)
          ctx.strokeStyle = "#FFFF00"
          ctx.lineWidth = 2
          ctx.stroke()
          break
        case "Oui":
          // Ajouter une flèche de haut en bas
          ctx.beginPath()
          ctx.moveTo(centerX, centerY - handHeight * 0.6)
          ctx.lineTo(centerX, centerY - handHeight * 0.2)
          ctx.lineTo(centerX - handWidth * 0.1, centerY - handHeight * 0.3)
          ctx.strokeStyle = "#FFFF00"
          ctx.lineWidth = 2
          ctx.stroke()
          break
        case "Non":
          // Ajouter une flèche latérale
          ctx.beginPath()
          ctx.moveTo(centerX - handWidth * 0.4, centerY - handHeight * 0.5)
          ctx.lineTo(centerX + handWidth * 0.4, centerY - handHeight * 0.5)
          ctx.lineTo(centerX + handWidth * 0.3, centerY - handHeight * 0.6)
          ctx.strokeStyle = "#FFFF00"
          ctx.lineWidth = 2
          ctx.stroke()
          break
        case "Au revoir":
          // Ajouter une animation d'agitation
          const time = Date.now() / 300
          const waveX = centerX + Math.sin(time) * handWidth * 0.1

          ctx.beginPath()
          ctx.arc(waveX, centerY - handHeight * 0.5, 5, 0, 2 * Math.PI)
          ctx.fillStyle = "#FFFF00"
          ctx.fill()
          break
      }
    }
  }

  // Gestionnaires d'événements pour la vidéo
  useEffect(() => {
    const videoElement = videoRef.current

    if (!videoElement) return

    // Gestionnaire pour l'événement "play"
    const handlePlay = () => {
      console.log("Vidéo en lecture")
      setCameraActive(true)
      setCameraStatus("playing")
    }

    // Gestionnaire pour l'événement "pause"
    const handlePause = () => {
      console.log("Vidéo en pause")
    }

    // Gestionnaire pour l'événement "error"
    const handleError = (e: Event) => {
      console.error("Erreur vidéo:", e)
      setError("Erreur lors de la lecture vidéo")
      setCameraStatus("error")
    }

    // Ajouter les gestionnaires d'événements
    videoElement.addEventListener("play", handlePlay)
    videoElement.addEventListener("pause", handlePause)
    videoElement.addEventListener("error", handleError)

    // Nettoyer les gestionnaires d'événements
    return () => {
      videoElement.removeEventListener("play", handlePlay)
      videoElement.removeEventListener("pause", handlePause)
      videoElement.removeEventListener("error", handleError)
    }
  }, [])

  // Nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      if (cameraActive) {
        stopCamera()
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }

      if (simulationTimerRef.current) {
        clearTimeout(simulationTimerRef.current)
      }

      if (sequenceTimerRef.current) {
        clearTimeout(sequenceTimerRef.current)
      }

      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current)
      }
    }
  }, [cameraActive])

  // Obtenir le signe actuel et sa description
  const getCurrentSignInfo = () => {
    if (!detectedSign) return null

    const signInfo = signSequence.find((s) => s.sign === detectedSign)
    return signInfo || null
  }

  const currentSignInfo = getCurrentSignInfo()

  return (
    <div className="mt-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden">
        <div className="relative">
          {/* Vidéo toujours présente dans le DOM, mais masquée si inactive */}
          <div className={`bg-black ${!cameraActive ? "hidden" : ""}`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto"
              style={{ transform: "scaleX(-1)" }} // Effet miroir
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
              style={{ transform: "scaleX(-1)" }} // Effet miroir
            />

            {/* Cadre de détection */}
            <div
              ref={detectionFrameRef}
              className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                         border-4 rounded-md w-64 h-64 flex items-center justify-center
                         ${
                           handInFrame
                             ? handDetected
                               ? "border-green-500"
                               : "border-yellow-500 animate-pulse"
                             : "border-white border-dashed"
                         }`}
            >
              {!handInFrame && (
                <div className="text-center text-white bg-black/50 p-2 rounded">
                  <Hand className="h-8 w-8 mx-auto mb-1" />
                  <p className="text-sm">Placez votre main dans ce cadre</p>
                </div>
              )}
              {handInFrame && !handDetected && (
                <div className="text-center text-white bg-black/50 p-2 rounded animate-pulse">
                  <p className="text-sm">Détection en cours...</p>
                </div>
              )}
            </div>

            {/* Compte à rebours */}
            {handDetected && countdown !== null && (
              <div className="absolute top-4 left-4 bg-black/70 text-white p-3 rounded-md">
                <div className="font-bold mb-1">Prochain signe dans:</div>
                <div className="text-2xl font-mono text-center">{countdown}s</div>
              </div>
            )}
          </div>

          {/* Placeholder affiché uniquement si la caméra est inactive */}
          {!cameraActive && (
            <div className="h-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
              </div>
            </div>
          )}

          {/* Indicateur de statut */}
          {cameraStatus === "requesting" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Accès à la caméra...</p>
              </div>
            </div>
          )}

          {/* Affichage du signe détecté */}
          {currentSignInfo && handDetected && (
            <div className="absolute top-4 right-4 bg-black/70 text-white p-3 rounded-md">
              <div className="font-bold mb-1">Signe détecté:</div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentSignInfo.sign}</span>
                <Badge variant="outline" className="bg-green-500/20 text-green-300">
                  {confidence}%
                </Badge>
              </div>
              <div className="text-xs mt-1 text-gray-300">{currentSignInfo.description}</div>
              <div className="mt-2">
                <Progress value={confidence} className="h-2" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-muted">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Reconnaissance de langue des signes</h3>
              <Button
                variant={cameraActive ? "destructive" : "default"}
                size="sm"
                onClick={toggleCamera}
                disabled={cameraStatus === "requesting" || cameraStatus === "stopping"}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                <span>{cameraActive ? "Arrêter la caméra" : "Démarrer la caméra"}</span>
              </Button>
            </div>

            {/* Afficher le statut actuel de la caméra */}
            <div className="text-xs text-center text-muted-foreground">
              Statut:{" "}
              {cameraStatus === "playing"
                ? "Caméra active"
                : cameraStatus === "requesting"
                  ? "Demande d'accès..."
                  : cameraStatus === "connected"
                    ? "Connexion établie"
                    : cameraStatus === "stopping"
                      ? "Arrêt en cours..."
                      : cameraStatus === "error"
                        ? "Erreur"
                        : "Caméra inactive"}
              {handDetected && " • Main détectée"}
            </div>
          </div>
        </div>
      </Card>

      {/* Séquence de signes */}
      {cameraActive && (
        <Card className="mt-4 p-4">
          <h3 className="text-sm font-medium mb-2">Séquence de signes</h3>
          <div className="grid grid-cols-4 gap-2">
            {signSequence.map((sign, index) => (
              <div
                key={index}
                className={`p-2 rounded-md text-center ${
                  index === currentSignIndex && detectedSign
                    ? "bg-green-100 dark:bg-green-900 border border-green-500"
                    : index < currentSignIndex
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                      : "bg-gray-50 dark:bg-gray-900"
                }`}
              >
                <div className="font-medium">{sign.sign}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={sign.description}>
                  {sign.description.length > 20 ? sign.description.substring(0, 20) + "..." : sign.description}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Instructions */}
      {cameraActive && (
        <Card className="mt-4 p-4 mb-24">
          <h3 className="text-sm font-medium mb-2">Comment utiliser</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Placez votre main dans le cadre au centre de l'écran</li>
            <li>Maintenez votre main immobile jusqu'à ce que le cadre devienne vert</li>
            <li>Le système va reconnaître automatiquement les signes toutes les 5 secondes</li>
            <li>Suivez la séquence de signes affichée ci-dessus</li>
          </ol>
        </Card>
      )}

      {/* Signe actuellement détecté - Affichage en bas */}
      {cameraActive && handDetected && detectedSign && (
        <div className="fixed bottom-0 left-0 right-0 bg-green-600 text-white p-4 text-center shadow-lg z-50">
          <div className="container mx-auto">
            <h3 className="text-lg font-semibold mb-1">Signe détecté:</h3>
            <div className="text-4xl font-bold mb-1">{detectedSign}</div>
            {currentSignInfo && <div className="text-sm opacity-90">{currentSignInfo.description}</div>}
          </div>
        </div>
      )}

    </div>
  )
}

