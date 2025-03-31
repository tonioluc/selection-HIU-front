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
  // Positions des doigts pour "Comment ça va" (index et majeur levés, autres doigts fermés)
  "Comment ça va": {
    thumb: "closed",
    indexFinger: "up",
    middleFinger: "up",
    ringFinger: "closed",
    pinkyFinger: "closed",
  },
}

// Définition des noms des doigts pour l'affichage
const fingerNames = [
  "Pouce", // 0-4
  "Index", // 5-8
  "Majeur", // 9-12
  "Annulaire", // 13-16
  "Auriculaire" // 17-20
]

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
  
  // Référence pour la stabilité de la détection
  const gestureHistory = useRef<string[]>([])
  const HISTORY_LENGTH = 10
  const THRESHOLD = 6 // Nombre minimum d'occurrences pour confirmer un geste
  
  // Référence pour le cadre de détection
  const handBoundingBox = useRef<{x: number, y: number, width: number, height: number} | null>(null)

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
        await tf.setBackend('webgl')
        await tf.ready()
        
        // Charger le modèle HandPose
        console.log("Chargement du modèle HandPose...")
        const loadedModel = await handpose.load({
          detectionConfidence: 0.8,
          maxContinuousChecks: 10,
          iouThreshold: 0.3,
          scoreThreshold: 0.75,
        })
        console.log("Modèle HandPose chargé avec succès!")
        
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

  // Fonction pour basculer l'état de la caméra
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
      setPrediction(null)
      handBoundingBox.current = null

      // S'assurer que la vidéo est bien arrêtée
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    } else {
      try {
        // Vérifier si la référence vidéo existe
        const { videoReady } = ensureReferences()
        
        if (!videoReady) {
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
          
          // Promesse pour s'assurer que la vidéo est bien chargée
          await new Promise<void>((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                console.log("Vidéo chargée, dimensions:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight)
                resolve()
              }
            } else {
              resolve()
            }
          })
          
          // Forcer la lecture de la vidéo
          try {
            await videoRef.current.play()
            setCameraActive(true)
            
            // Réinitialiser l'historique des gestes
            gestureHistory.current = []
            
            // Initialiser le canvas après que la vidéo soit chargée
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth || 640
              canvasRef.current.height = videoRef.current.videoHeight || 480
              
              // Démarrer la détection
              detectHands()
            }
          } catch (err) {
            console.error("Erreur lors de la lecture de la vidéo:", err)
            setError("Impossible de lire le flux vidéo. Veuillez réessayer.")
          }
        } else {
          console.error("Référence vidéo non disponible après vérification")
          setError("Erreur technique: référence vidéo non disponible")
        }

        setError(null)
      } catch (err) {
        console.error("Erreur d'accès à la caméra:", err)
        setError(`Impossible d'accéder à la caméra: ${err.message}. Veuillez vérifier les permissions.`)
      }
    }
  }

  // Fonction améliorée pour classifier la position des doigts avec plus de précision
  const classifyFingerPosition = (landmarks: number[][], fingerBase: number, fingerTip: number) => {
    // Utiliser la position Y pour déterminer si le doigt est levé ou fermé
    const baseY = landmarks[fingerBase][1]
    const tipY = landmarks[fingerTip][1]
    
    // Calculer la différence de hauteur
    const diff = baseY - tipY
    
    // Si la différence est significative, le doigt est considéré comme levé
    return diff > 40 ? "up" : "closed"
  }

  // Fonction pour reconnaître le geste en tenant compte de l'angle et de la position des mains
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

  // Fonction pour calculer le cadre englobant de la main
  const calculateHandBoundingBox = (landmarks: number[][]) => {
    let minX = Number.MAX_VALUE
    let minY = Number.MAX_VALUE
    let maxX = 0
    let maxY = 0

    // Trouver les coordonnées minimales et maximales
    landmarks.forEach(point => {
      minX = Math.min(minX, point[0])
      minY = Math.min(minY, point[1])
      maxX = Math.max(maxX, point[0])
      maxY = Math.max(maxY, point[1])
    })

    // Ajouter une marge au cadre
    const padding = 30
    minX = Math.max(0, minX - padding)
    minY = Math.max(0, minY - padding)
    maxX = maxX + padding
    maxY = maxY + padding

    // Retourner le cadre sous forme d'objet
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  // Fonction pour dessiner les points et connexions de la main sur le canvas avec des labels
  const drawHand = (predictions: handpose.AnnotatedPrediction[], ctx: CanvasRenderingContext2D) => {
    // Dessiner chaque main détectée
    for (let i = 0; i < predictions.length; i++) {
      const prediction = predictions[i]
      
      // Calculer le cadre englobant
      handBoundingBox.current = calculateHandBoundingBox(prediction.landmarks)
      
      // Dessiner le cadre englobant avec un effet de pulsation
      if (handBoundingBox.current) {
        const time = Date.now() * 0.002
        const pulseIntensity = Math.sin(time) * 0.5 + 0.5 // Valeur entre 0 et 1
        
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 + pulseIntensity * 0.5})`
        ctx.lineWidth = 2 + pulseIntensity * 2
        ctx.strokeRect(
          handBoundingBox.current.x,
          handBoundingBox.current.y,
          handBoundingBox.current.width,
          handBoundingBox.current.height
        )
      }

      // Dessiner les connexions entre les points (structure de la main)
      const fingers = [
        [0, 1, 2, 3, 4], // pouce
        [0, 5, 6, 7, 8], // index
        [0, 9, 10, 11, 12], // majeur
        [0, 13, 14, 15, 16], // annulaire
        [0, 17, 18, 19, 20], // auriculaire
      ]

      // Dessiner les lignes connectant les articulations
      for (let j = 0; j < fingers.length; j++) {
        const finger = fingers[j]
        
        // Sélectionner une couleur différente pour chaque doigt
        const fingerColors = [
          "#FF9500", // pouce - orange
          "#4CAF50", // index - vert
          "#03A9F4", // majeur - bleu clair
          "#9C27B0", // annulaire - violet
          "#F44336"  // auriculaire - rouge
        ]
        
        ctx.strokeStyle = fingerColors[j]
        ctx.lineWidth = 3
        
        // Tracer les lignes entre les points
        for (let k = 1; k < finger.length; k++) {
          const p1 = prediction.landmarks[finger[k - 1]]
          const p2 = prediction.landmarks[finger[k]]

          ctx.beginPath()
          ctx.moveTo(p1[0], p1[1])
          ctx.lineTo(p2[0], p2[1])
          ctx.stroke()
        }
        
        // Ajouter le nom du doigt près de la base
        if (j > 0) { // Ignorer le pouce pour éviter l'encombrement
          const basePoint = prediction.landmarks[finger[1]] // Point à la base du doigt
          ctx.font = "12px Arial"
          ctx.fillStyle = fingerColors[j]
          ctx.fillText(fingerNames[j], basePoint[0] + 5, basePoint[1])
        }
      }

      // Dessiner les points des articulations par-dessus
      for (let j = 0; j < prediction.landmarks.length; j++) {
        const landmark = prediction.landmarks[j]
        
        // Déterminer l'apparence du point en fonction de sa position
        const isKnuckle = [0, 1, 5, 9, 13, 17].includes(j)
        const isFingerTip = [4, 8, 12, 16, 20].includes(j)
        
        // Tracer un cercle pour le point
        ctx.beginPath()
        
        // Taille du point selon son importance
        const radius = isFingerTip ? 8 : isKnuckle ? 6 : 4
        
        ctx.arc(landmark[0], landmark[1], radius, 0, 2 * Math.PI)
        
        // Couleur du point selon son type
        if (isFingerTip) {
          ctx.fillStyle = "#ffff00" // Bout des doigts en jaune vif
          ctx.strokeStyle = "#000000"
          ctx.lineWidth = 1
          ctx.fill()
          ctx.stroke()
        } else if (isKnuckle) {
          ctx.fillStyle = "#00ffff" // Articulations principales en cyan
          ctx.fill()
        } else {
          ctx.fillStyle = "#ffffff" // Autres points en blanc
          ctx.fill()
        }
        
        // Ajouter un effet de lueur pour les points importants
        if (isFingerTip || isKnuckle) {
          ctx.beginPath()
          ctx.arc(landmark[0], landmark[1], radius + 4, 0, 2 * Math.PI)
          ctx.fillStyle = `rgba(255, 255, 255, 0.2)`
          ctx.fill()
        }
      }
      
      // Dessiner un indicateur pour la paume de la main
      const palmCenter = prediction.landmarks[0]
      ctx.beginPath()
      ctx.arc(palmCenter[0], palmCenter[1], 10, 0, 2 * Math.PI)
      ctx.fillStyle = "#FF5722"
      ctx.fill()
      ctx.strokeStyle = "#FFFFFF"
      ctx.lineWidth = 2
      ctx.stroke()
      
      // Ajouter un label pour la paume
      ctx.font = "14px Arial"
      ctx.fillStyle = "#FFFFFF"
      ctx.fillText("Paume", palmCenter[0] - 20, palmCenter[1] - 15)
    }
  }

  // Fonction pour déterminer le geste le plus fréquent dans l'historique
  const getMostFrequentGesture = () => {
    if (gestureHistory.current.length === 0) return null
    
    // Compter les occurrences de chaque geste
    const counts: Record<string, number> = {}
    
    for (const gesture of gestureHistory.current) {
      if (gesture) {
        counts[gesture] = (counts[gesture] || 0) + 1
      }
    }
    
    // Trouver le geste le plus fréquent
    let maxCount = 0
    let mostFrequentGesture: string | null = null
    
    for (const [gesture, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count
        mostFrequentGesture = gesture
      }
    }
    
    // Retourner le geste le plus fréquent seulement s'il dépasse le seuil
    return maxCount >= THRESHOLD ? mostFrequentGesture : null
  }

  // Fonction principale de détection des mains
  const detectHands = async () => {
    // Vérifier que toutes les dépendances sont disponibles
    if (!model || !videoRef.current || !canvasRef.current || !cameraActive) {
      if (cameraActive && requestRef.current) {
        requestRef.current = requestAnimationFrame(detectHands)
      }
      return
    }

    try {
      // Vérifier que la vidéo est prête
      if (videoRef.current.readyState !== 4) {
        requestRef.current = requestAnimationFrame(detectHands)
        return
      }

      // Détecter les mains dans l'image
      const predictions = await model.estimateHands(videoRef.current)

      // Mettre à jour le canvas
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        // Ajuster la taille du canvas si nécessaire
        if (canvasRef.current.width !== videoRef.current.videoWidth) {
          canvasRef.current.width = videoRef.current.videoWidth
        }
        if (canvasRef.current.height !== videoRef.current.videoHeight) {
          canvasRef.current.height = videoRef.current.videoHeight
        }
        
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
          
          // Ajouter à l'historique des gestes
          gestureHistory.current.push(gesture || "")
          if (gestureHistory.current.length > HISTORY_LENGTH) {
            gestureHistory.current.shift()
          }
          
          // Déterminer le geste le plus stable
          const stableGesture = getMostFrequentGesture()
          
          // Mettre à jour le signe détecté
          setDetectedSign(gesture)
          
          // Si un geste stable est détecté et qu'il est différent de la prédiction actuelle
          if (stableGesture && stableGesture !== prediction) {
            setPrediction(stableGesture)
            // Notifier le parent du geste détecté
            if (onSignDetected) {
              onSignDetected(stableGesture)
            }
          }
          
          // Ajouter une notification visuelle du geste détecté sur le canvas
          if (gesture) {
            // Dessiner une bulle de texte en haut
            ctx.fillStyle = "rgba(75, 0, 130, 0.7)"
            ctx.beginPath()
            // Utilisez fillRect au lieu de roundRect qui peut être non supporté dans certains navigateurs
            ctx.fillRect(10, 10, 190, 40)
            ctx.fill()
            
            ctx.fillStyle = "#FFFFFF"
            ctx.font = "bold 16px Arial"
            ctx.fillText(`Geste détecté: ${gesture}`, 20, 35)
          }
        } else {
          setDetectedSign(null)
          handBoundingBox.current = null
        }
        
        // Si aucune main n'est détectée, afficher un message d'instruction
        if (predictions.length === 0) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
          ctx.fillRect(0, canvasRef.current.height - 40, canvasRef.current.width, 40)
          
          ctx.fillStyle = "#FFFFFF"
          ctx.font = "16px Arial"
          ctx.textAlign = "center"
          ctx.fillText("Placez votre main devant la caméra", canvasRef.current.width / 2, canvasRef.current.height - 15)
          ctx.textAlign = "start"
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
                {/* Ne pas cacher la vidéo, c'est nécessaire pour que HandPose puisse analyser l'image */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto"
                  style={{ 
                    minHeight: "300px",
                    position: "absolute",
                    opacity: 0  // Rendre la vidéo invisible mais présente dans le DOM
                  }}
                />
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-auto" 
                  style={{ minHeight: "300px", zIndex: 1 }} 
                />
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
                  <strong>Oui</strong> : Poing fermé avec pouce levé (similaire à "Bonjour")
                </li>
                <li>
                  <strong>Non</strong> : Index levé, autres doigts fermés
                </li>
                <li>
                  <strong>Comment ça va</strong> : Index et majeur levés en "V", autres doigts fermés
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