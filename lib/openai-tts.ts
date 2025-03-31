// Service pour l'API Text-to-Speech avec solution de secours

/**
 * Génère un fichier audio à partir d'un texte en utilisant l'API OpenAI TTS
 * ou l'API Web Speech comme solution de secours
 * @param text Le texte à convertir en audio
 * @param voice La voix à utiliser (alloy, echo, fable, onyx, nova, shimmer)
 * @returns URL de l'audio généré, null en cas d'erreur, ou "fallback" si utilisant la solution de secours
 */
export async function generateSpeech(text: string, voice = "alloy"): Promise<string | null | "fallback"> {
    try {
      console.log(`Demande de génération TTS pour: "${text.substring(0, 50)}..." avec la voix ${voice}`)
  
      // Vérifier si nous avons déjà rencontré une erreur de quota
      const quotaExceeded = localStorage.getItem("tts-quota-exceeded")
      if (quotaExceeded === "true") {
        console.log("Quota déjà dépassé, utilisation directe de la solution de secours")
        return "fallback"
      }
  
      // Appeler notre propre API
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, voice }),
      })
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur inconnue" }))
        const errorMessage = errorData.error || "Erreur inconnue"
  
        // Vérifier si c'est une erreur de quota
        if (response.status === 429 && errorMessage.includes("quota")) {
          console.warn("Quota OpenAI dépassé, passage à la solution de secours")
          // Marquer que le quota est dépassé pour les prochains appels
          localStorage.setItem("tts-quota-exceeded", "true")
          return "fallback"
        }
  
        throw new Error(`Erreur API TTS: ${response.status} - ${errorMessage}`)
      }
  
      // Récupérer le blob audio directement
      const audioBlob = await response.blob()
      console.log(`Audio reçu: ${audioBlob.size} octets, type: ${audioBlob.type}`)
  
      if (audioBlob.size === 0) {
        throw new Error("Le blob audio est vide")
      }
  
      // Créer une URL pour le blob
      const audioUrl = URL.createObjectURL(audioBlob)
      console.log("URL audio créée avec succès")
  
      return audioUrl
    } catch (error) {
      console.error("Erreur lors de la génération de la parole:", error)
  
      // Si l'erreur contient "quota", utiliser la solution de secours
      if (error instanceof Error && error.message.includes("quota")) {
        localStorage.setItem("tts-quota-exceeded", "true")
        return "fallback"
      }
  
      return null
    }
  }
  
  /**
   * Joue un fichier audio à partir d'une URL ou utilise l'API Web Speech comme solution de secours
   * @param audioUrl URL du fichier audio à jouer ou "fallback" pour utiliser la solution de secours
   * @param text Texte à lire (nécessaire pour la solution de secours)
   * @param onEnd Fonction à appeler lorsque la lecture est terminée
   * @returns L'élément audio créé ou null en cas d'erreur
   */
  export function playAudio(audioUrl: string | "fallback", text: string, onEnd?: () => void): HTMLAudioElement | null {
    // Utiliser l'API Web Speech comme solution de secours
    if (audioUrl === "fallback") {
      console.log("Utilisation de l'API Web Speech comme solution de secours")
  
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          // Annuler toute synthèse vocale en cours
          window.speechSynthesis.cancel()
  
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.lang = "fr-FR"
  
          // Essayer de trouver une voix française
          const voices = window.speechSynthesis.getVoices()
          const frenchVoice = voices.find((voice) => voice.lang.includes("fr"))
          if (frenchVoice) {
            utterance.voice = frenchVoice
          }
  
          if (onEnd) {
            utterance.onend = onEnd
          }
  
          utterance.onerror = (e) => {
            console.error("Erreur lors de la synthèse vocale du navigateur:", e)
            if (onEnd) onEnd()
          }
  
          window.speechSynthesis.speak(utterance)
          console.log("Lecture avec l'API Web Speech démarrée")
  
          // Créer un élément audio factice pour la compatibilité
          const dummyAudio = new Audio()
          dummyAudio.pause = () => {
            window.speechSynthesis.cancel()
            if (onEnd) onEnd()
          }
  
          return dummyAudio
        } catch (error) {
          console.error("Erreur lors de l'utilisation de l'API Web Speech:", error)
          if (onEnd) onEnd()
          return null
        }
      } else {
        console.error("L'API Web Speech n'est pas disponible dans ce navigateur")
        if (onEnd) onEnd()
        return null
      }
    }
  
    // Utiliser l'audio URL normalement
    if (!audioUrl) {
      console.error("URL audio invalide")
      if (onEnd) onEnd()
      return null
    }
  
    try {
      console.log("Création de l'élément audio")
      const audio = new Audio(audioUrl)
  
      if (onEnd) {
        audio.onended = () => {
          console.log("Lecture audio terminée")
          onEnd()
        }
      }
  
      // Ajouter des gestionnaires d'événements pour le débogage
      audio.onplay = () => console.log("Lecture audio démarrée")
      audio.onerror = (e) => {
        console.error("Erreur de lecture audio:", e)
        if (onEnd) onEnd()
      }
      audio.oncanplay = () => console.log("Audio prêt à être lu")
  
      // Démarrer la lecture avec une promesse pour mieux gérer les erreurs
      console.log("Démarrage de la lecture audio")
      const playPromise = audio.play()
  
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Erreur lors de la lecture audio:", error)
          if (onEnd) onEnd()
        })
      }
  
      return audio
    } catch (error) {
      console.error("Erreur lors de la création de l'audio:", error)
      if (onEnd) onEnd()
      return null
    }
  }
  
  /**
   * Arrête la lecture d'un élément audio
   * @param audio L'élément audio à arrêter
   */
  export function stopAudio(audio: HTMLAudioElement | null): void {
    if (audio) {
      console.log("Arrêt de la lecture audio")
      audio.pause()
      audio.currentTime = 0
    } else {
      // Arrêter également l'API Web Speech au cas où
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }
  
  /**
   * Sélectionne une voix en fonction du personnage
   * @param characterId L'identifiant du personnage
   * @returns Le nom de la voix à utiliser
   */
  export function selectVoiceForCharacter(characterId: string): string {
    switch (characterId) {
      case "max":
        return "onyx" // Voix masculine grave
      case "leo":
        return "echo" // Voix masculine
      case "emma":
        return "nova" // Voix féminine
      case "handi":
        return "alloy" // Voix neutre
      default:
        return "alloy" // Voix neutre par défaut
    }
  }
  
  /**
   * Réinitialise l'état du quota TTS
   */
  export function resetTTSQuotaState(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("tts-quota-exceeded")
      console.log("État du quota TTS réinitialisé")
    }
  }
  
  