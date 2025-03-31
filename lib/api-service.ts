// Service pour appeler l'API Mistral
export async function callMistralAPI(prompt: string) {
    try {
      const response = await fetch("https://hiu-interne-back.onrender.com/prompt-mistral", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })
  
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }
  
      const data = await response.json()

      return data.reponse || ""
    } catch (error) {
      console.error("Erreur lors de l'appel à l'API Mistral:", error)
      // Retourner l'URL YouTube de secours en cas d'échec
      return "https://www.youtube.com/watch?v=MzvAJgy2pfc&list=RDMzvAJgy2pfc&start_radio=1"
    }
  }
  
  // Fonction pour vérifier si une chaîne est une URL
  export function isValidURL(string: string) {
    try {
      new URL(string.trim())
      return true
    } catch (_) {
      return false
    }
  }
  
  // Fonction pour convertir les URL YouTube en URL embed
  export function convertYouTubeUrl(url: string) {
    try {
      // Vérifier si c'est une URL YouTube
      if (url.includes("youtube.com/watch") || url.includes("youtu.be/")) {
        // Extraire l'ID de la vidéo
        let videoId = ""
  
        if (url.includes("youtube.com/watch")) {
          const urlObj = new URL(url)
          videoId = urlObj.searchParams.get("v") || ""
        } else if (url.includes("youtu.be/")) {
          videoId = url.split("youtu.be/")[1].split("?")[0]
        }
  
        if (videoId) {
          // Retourner l'URL d'embed
          return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`
        }
      }
  
      // Si ce n'est pas une URL YouTube ou si la conversion échoue, retourner l'URL originale
      return url
    } catch (error) {
      console.error("Erreur lors de la conversion de l'URL YouTube:", error)
      return url
    }
  }  