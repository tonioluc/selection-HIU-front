// Fonctionnalités de reconnaissance vocale (Speech-to-Text)

// Vérifier si l'API SpeechRecognition est disponible
export const isSpeechRecognitionAvailable = (): boolean => {
    return typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  }
  
  // Créer une instance de SpeechRecognition
  export const createSpeechRecognition = (): SpeechRecognition | null => {
    if (!isSpeechRecognitionAvailable()) return null
  
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
  
    // Configuration de base
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "fr-FR"
  
    return recognition
  }
  
  // Interface pour les options de reconnaissance vocale
  export interface SpeechRecognitionOptions {
    onResult?: (transcript: string) => void
    onStart?: () => void
    onEnd?: () => void
    onError?: (error: any) => void
  }
  
  // Classe pour gérer la reconnaissance vocale
  export class SpeechRecognizer {
    private recognition: SpeechRecognition | null = null
    private isListening = false
    private options: SpeechRecognitionOptions
  
    constructor(options: SpeechRecognitionOptions = {}) {
      this.options = options
      this.init()
    }
  
    private init() {
      if (!isSpeechRecognitionAvailable()) {
        console.error("La reconnaissance vocale n'est pas disponible dans ce navigateur")
        return
      }
  
      this.recognition = createSpeechRecognition()
  
      if (!this.recognition) return
  
      // Configurer les événements
      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((result: SpeechRecognitionResult) => result[0])
          .map((result: SpeechRecognitionAlternative) => result.transcript)
          .join("")
  
        if (this.options.onResult) {
          this.options.onResult(transcript)
        }
      }
  
      this.recognition.onstart = () => {
        this.isListening = true
        if (this.options.onStart) {
          this.options.onStart()
        }
      }
  
      this.recognition.onend = () => {
        this.isListening = false
        if (this.options.onEnd) {
          this.options.onEnd()
        }
      }
  
      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Erreur de reconnaissance vocale:", event.error)
        if (this.options.onError) {
          this.options.onError(event)
        }
      }
    }
  
    public start() {
      if (!this.recognition) {
        this.init()
        if (!this.recognition) return false
      }
  
      try {
        this.recognition.start()
        return true
      } catch (error) {
        console.error("Erreur lors du démarrage de la reconnaissance vocale:", error)
        return false
      }
    }
  
    public stop() {
      if (this.recognition && this.isListening) {
        try {
          this.recognition.stop()
          return true
        } catch (error) {
          console.error("Erreur lors de l'arrêt de la reconnaissance vocale:", error)
          return false
        }
      }
      return false
    }
  
    public isActive(): boolean {
      return this.isListening
    }
  
    public setLanguage(lang: string) {
      if (this.recognition) {
        this.recognition.lang = lang
      }
    }
  }
  
  