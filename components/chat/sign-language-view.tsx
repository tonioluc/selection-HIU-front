"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import * as tf from "@tensorflow/tfjs"
import "@tensorflow/tfjs-backend-webgl"
import * as handpose from "@tensorflow-models/handpose"

type SignLanguageViewProps = {
  onSignDetected?: (text: string) => void
}

// Définition des gestes et leurs correspondances textuelles
const signGestures = {
  // Positions des doigts pour "Bonjour" (pouce levé, autres doigts fermés)
  Bonjour: {
    thumb: "up",
    indexFinger: "closed",
    middleFinger: "closed",
    ringFinger: "closed",
    pinkyFinger: "closed",
  },
  // Positions des doigts pour "Merci" (main ouverte, doigts écartés)
  Merci: {
    thumb: "up",
    indexFinger: "up",
    middleFinger: "up",
    ringFinger: "up",
    pinkyFinger: "up",
  },
  // Positions des doigts pour "Oui" (poing fermé avec pouce levé)
  Oui: {
    thumb: "up",
    indexFinger: "closed",
    middleFinger: "closed",
    ringFinger: "closed",
    pinkyFinger: "closed",
  },
  // Positions des doigts pour "Non" (index levé, autres doigts fermés)
  Non: {
    thumb: "closed",
    indexFinger: "up",
    middleFinger: "closed",
    ringFinger: "closed",
    pinkyFinger: "closed",
  },
}

export function SignLanguageView({ onSignDetected }: SignLanguageViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [model, setModel] = useState<handpose.HandPose | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [detectedSign, setDetectedSign] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [prediction, setPrediction] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const requestRef = useRef<number | null>(null)

  // Fonction pour s'assurer que les références sont correctement initialisées
  const ensureReferences = () => {
    if (!videoRef.current) {
      console.warn("Référence vidéo non initialisée, création d'un nouvel élément")
      const videoElement = document.createElement("video")
      videoElement.autoplay = true
      videoElement.playsInline = true
      videoElement.muted = true
      videoRef.current = videoElement
    }

    if (!canvasRef.current) {
      console.warn("Référence canvas non initialisée, création d'un nouvel élément")
      const canvasElement = document.createElement("canvas")
      canvasRef.current = canvasElement
    }

    return {
      videoReady: !!videoRef.current,
      canvasReady: !!canvasRef.current,
    }
  }

  // Charger le modèle TensorFlow.js HandPose
  useEffect(() => {
    async function loadModel() {
      try {
        setLoading(true)

        // S'assurer que les références sont initialisées
        ensureReferences()

        // Initialiser TensorFlow.js
        await tf.ready()
        // Charger le modèle HandPose
        const loadedModel = await handpose.load()
        setModel(loadedModel)
        setLoading(false)
      } catch (err) {
        console.error("Erreur lors du chargement du modèle:", err)
        setError("Impossible de charger le modèle de reconnaissance de gestes. Veuillez réessayer.")
        setLoading(false)
      }
    }

    loadModel()

    // Nettoyer les ressources lors du démontage
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [])

  // Modifier la fonction toggleCamera pour corriger les problèmes de flux
  const toggleCamera = async () => {
    if (cameraActive) {
      // Arrêter la caméra
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
        requestRef.current = null
      }
      setCameraActive(false)
      setDetectedSign(null)

      // S'assurer que la vidéo est bien arrêtée
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    } else {
      try {
        // Vérifier si la référence vidéo existe
        if (!videoRef.current) {
          console.error("Référence vidéo non disponible")
          setError("Erreur technique: référence vidéo non disponible. Veuillez rafraîchir la page.")
          return
        }

        // Démarrer la caméra
        console.log("Tentative d'accès à la caméra...")
        const stream = await navigator.mediaDevices
          .getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: false,
          })
          .catch((err) => {
            console.error("Erreur lors de l'accès à la caméra:", err)
            throw new Error("Impossible d'accéder à la caméra. Veuillez vérifier les permissions.")
          })

        console.log("Accès à la caméra réussi, configuration du flux vidéo...")
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            console.log("Vidéo chargée, démarrage de la détection...")
            setCameraActive(true)
            // Démarrer la détection une fois la vidéo chargée
            detectHands()
          }

          // Forcer la lecture de la vidéo
          videoRef.current.play().catch((err) => {
            console.error("Erreur lors de la lecture de la vidéo:", err)
            setError("Impossible de lire le flux vidéo. Veuillez réessayer.")
          })
        } else {
          console.error("Référence vidéo non disponible après vérification")
          setError("Erreur technique: référence vidéo non disponible")
        }

        setError(null)
      } catch (err) {
        console.error("Erreur d'accès à la caméra:", err)
        setError("Impossible d'accéder à la caméra. Veuillez vérifier les permissions.")
      }
    }
  }

  // Fonction pour classifier la position des doigts
  const classifyFingerPosition = (landmarks: number[][], fingerBase: number, fingerTip: number) => {
    const baseY = landmarks[fingerBase][1]
    const tipY = landmarks[fingerTip][1]

    // Si le bout du doigt est plus haut que la base, le doigt est levé
    return tipY < baseY ? "up" : "closed"
  }

  // Fonction pour reconnaître le geste
  const recognizeGesture = (landmarks: number[][]) => {
    if (!landmarks || landmarks.length < 21) return null

    // Classifier la position de chaque doigt
    const thumbPosition = classifyFingerPosition(landmarks, 0, 4)
    const indexPosition = classifyFingerPosition(landmarks, 5, 8)
    const middlePosition = classifyFingerPosition(landmarks, 9, 12)
    const ringPosition = classifyFingerPosition(landmarks, 13, 16)
    const pinkyPosition = classifyFingerPosition(landmarks, 17, 20)

    // Créer un objet représentant la position actuelle des doigts
    const currentGesture = {
      thumb: thumbPosition,
      indexFinger: indexPosition,
      middleFinger: middlePosition,
      ringFinger: ringPosition,
      pinkyFinger: pinkyPosition,
    }

    // Comparer avec les gestes connus
    for (const [sign, gesture] of Object.entries(signGestures)) {
      // Vérifier si le geste actuel correspond à un geste connu
      if (
        currentGesture.thumb === gesture.thumb &&
        currentGesture.indexFinger === gesture.indexFinger &&
        currentGesture.middleFinger === gesture.middleFinger &&
        currentGesture.ringFinger === gesture.ringFinger &&
        currentGesture.pinkyFinger === gesture.pinkyFinger
      ) {
        return sign
      }
    }

    return null
  }

  // Fonction pour dessiner les points de la main sur le canvas
  const drawHand = (predictions: handpose.AnnotatedPrediction[], ctx: CanvasRenderingContext2D) => {
    // Dessiner chaque main détectée
    for (let i = 0; i < predictions.length; i++) {
      const prediction = predictions[i]

      // Dessiner les points des doigts
      for (let j = 0; j < prediction.landmarks.length; j++) {
        const landmark = prediction.landmarks[j]
        ctx.beginPath()
        ctx.arc(landmark[0], landmark[1], 5, 0, 2 * Math.PI)
        ctx.fillStyle = "aqua"
        ctx.fill()
      }

      // Dessiner les connexions entre les points
      const fingers = [
        [0, 1, 2, 3, 4], // pouce
        [0, 5, 6, 7, 8], // index
        [0, 9, 10, 11, 12], // majeur
        [0, 13, 14, 15, 16], // annulaire
        [0, 17, 18, 19, 20], // auriculaire
      ]

      for (let j = 0; j < fingers.length; j++) {
        const finger = fingers[j]
        for (let k = 1; k < finger.length; k++) {
          const p1 = prediction.landmarks[finger[k - 1]]
          const p2 = prediction.landmarks[finger[k]]

          ctx.beginPath()
          ctx.moveTo(p1[0], p1[1])
          ctx.lineTo(p2[0], p2[1])
          ctx.strokeStyle = "aqua"
          ctx.lineWidth = 2
          ctx.stroke()
        }
      }
    }
  }

  // Modifier la fonction detectHands pour ajouter des vérifications supplémentaires
  // Remplacer la fonction detectHands par cette version améliorée:

  // Fonction principale de détection des mains
  const detectHands = async () => {
    // Vérifier que toutes les dépendances sont disponibles
    if (!model) {
      console.warn("Modèle non disponible pour la détection")
      return
    }

    if (!videoRef.current) {
      console.warn("Référence vidéo non disponible pour la détection")
      return
    }

    if (!canvasRef.current) {
      console.warn("Référence canvas non disponible pour la détection")
      return
    }

    if (!cameraActive) {
      console.warn("Caméra inactive, détection annulée")
      return
    }

    try {
      // Vérifier que la vidéo est prête
      if (videoRef.current.readyState !== 4) {
        console.log("Vidéo pas encore prête, nouvelle tentative...")
        requestRef.current = requestAnimationFrame(detectHands)
        return
      }

      // Détecter les mains dans l'image
      const predictions = await model.estimateHands(videoRef.current)

      // Mettre à jour le canvas
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        // Effacer le canvas
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

        // Dessiner la vidéo sur le canvas (miroir)
        ctx.save()
        ctx.translate(canvasRef.current.width, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
        ctx.restore()

        // S'il y a des prédictions, dessiner les mains
        if (predictions.length > 0) {
          drawHand(predictions, ctx)

          // Reconnaître le geste
          const gesture = recognizeGesture(predictions[0].landmarks)

          if (gesture) {
            setDetectedSign(gesture)

            // Si le geste est stable pendant un moment, le considérer comme une prédiction
            if (gesture === detectedSign) {
              if (gesture !== prediction) {
                setPrediction(gesture)
                // Notifier le parent du geste détecté
                if (onSignDetected) {
                  onSignDetected(gesture)
                }
              }
            }
          }
        } else {
          setDetectedSign(null)
        }
      }
    } catch (err) {
      console.error("Erreur lors de la détection:", err)
    }

    // Continuer la détection seulement si la caméra est active
    if (cameraActive) {
      requestRef.current = requestAnimationFrame(detectHands)
    }
  }

  // Ajouter un effet pour initialiser le canvas quand la vidéo est chargée
  useEffect(() => {
    if (cameraActive && videoRef.current && canvasRef.current) {
      console.log("Configuration du canvas...")
      const video = videoRef.current
      const canvas = canvasRef.current

      // Attendre que les dimensions de la vidéo soient disponibles
      const checkVideoDimensions = () => {
        if (video.videoWidth && video.videoHeight) {
          console.log(`Dimensions vidéo: ${video.videoWidth}x${video.videoHeight}`)
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          // Démarrer la détection
          if (!requestRef.current) {
            console.log("Démarrage de la boucle de détection")
            detectHands()
          }
        } else {
          console.log("En attente des dimensions vidéo...")
          setTimeout(checkVideoDimensions, 100)
        }
      }

      checkVideoDimensions()
    }
  }, [cameraActive])

  // Ajuster la taille du canvas quand la vidéo est chargée
  useEffect(() => {
    const handleResize = () => {
      if (videoRef.current && canvasRef.current) {
        canvasRef.current.width = videoRef.current.videoWidth || 640
        canvasRef.current.height = videoRef.current.videoHeight || 480
      }
    }

    if (videoRef.current) {
      videoRef.current.addEventListener("loadeddata", handleResize)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener("loadeddata", handleResize)
      }
      window.removeEventListener("resize", handleResize)
    }
  }, [cameraActive])

  return (
    <div className="mt-4">
      <Card className="overflow-hidden mb-4">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Reconnaissance de langue des signes</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={toggleCamera} disabled={loading}>
                {cameraActive ? "Désactiver la caméra" : "Activer la caméra"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowHelp(!showHelp)} aria-label="Aide">
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading && (
            <div className="flex justify-center items-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
              <span className="ml-2">Chargement du modèle...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="relative mb-4 border rounded-md overflow-hidden bg-black">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto"
                  style={{ minHeight: "300px", display: "none" }}
                />
                <canvas ref={canvasRef} className="w-full h-auto" style={{ minHeight: "300px" }} />
                {detectedSign && (
                  <div className="absolute top-2 right-2 bg-purple-600 text-white px-3 py-1 rounded-full">
                    {detectedSign}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-gray-100 dark:bg-gray-800">
                <p className="text-center text-muted-foreground mb-4">
                  Activez la caméra pour commencer la reconnaissance de langue des signes
                </p>
                <Button onClick={toggleCamera} disabled={loading} variant="default">
                  {loading ? "Chargement..." : "Activer la caméra"}
                </Button>
              </div>
            )}
          </div>

          {prediction && (
            <div className="mt-4 p-3 bg-purple-100 dark:bg-purple-900/20 rounded-md">
              <p className="font-medium">
                Signe détecté : <span className="text-purple-700 dark:text-purple-400">{prediction}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">Ce texte a été ajouté à votre message</p>
            </div>
          )}
        </div>
      </Card>

      {showHelp && (
        <Alert className="mb-4">
          <div className="space-y-2">
            <p className="font-medium">Comment utiliser la reconnaissance de langue des signes :</p>
            <ol className="list-decimal pl-5 text-sm">
              <li>Activez la caméra et attendez que le modèle se charge</li>
              <li>Placez votre main bien visible devant la caméra</li>
              <li>Effectuez un des signes suivants :</li>
              <ul className="list-disc pl-5 mt-1">
                <li>
                  <strong>Bonjour</strong> : Pouce levé, autres doigts fermés
                </li>
                <li>
                  <strong>Merci</strong> : Main ouverte, doigts écartés
                </li>
                <li>
                  <strong>Oui</strong> : Poing fermé avec pouce levé
                </li>
                <li>
                  <strong>Non</strong> : Index levé, autres doigts fermés
                </li>
              </ul>
              <li>Le signe détecté sera automatiquement ajouté à votre message</li>
            </ol>
          </div>
        </Alert>
      )}
    </div>
  )
}

