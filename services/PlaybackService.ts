import { Audio, type AVPlaybackStatus, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av"
import type { MusicType } from "../data/musciTypes"
import NotificationService from "./NotificationService"
import * as BackgroundFetch from "expo-background-fetch"
import * as TaskManager from "expo-task-manager"

const BACKGROUND_PLAYBACK_TASK = "background-playback"

// Configurer la tâche de fond pour la lecture en arrière-plan
TaskManager.defineTask(BACKGROUND_PLAYBACK_TASK, async () => {
  // Cette tâche maintient la lecture en arrière-plan
  return BackgroundFetch.BackgroundFetchResult.NewData
})

class PlaybackService {
  sound: Audio.Sound | null = null
  currentSong: MusicType | null = null
  isPlaying = false
  position = 0
  duration = 1

  // Callbacks pour les mises à jour d'état
  onPlaybackStatusUpdate: ((status: AVPlaybackStatus) => void) | null = null
  onPlaybackStateChange: ((isPlaying: boolean) => void) | null = null
  onSongComplete: (() => void) | null = null

  // Initialiser le service de lecture
  async init() {
    // Configurer Audio pour fonctionner en arrière-plan
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      playThroughEarpieceAndroid: false,
    })

    // Enregistrer la tâche de fond
    await BackgroundFetch.registerTaskAsync(BACKGROUND_PLAYBACK_TASK, {
      minimumInterval: 60, // 1 minute
      stopOnTerminate: false,
      startOnBoot: true,
    })

    // Initialiser le service de notification
    await NotificationService.init()
  }

  // Charger et jouer une chanson
  async loadAndPlaySong(song: MusicType) {
    try {
      // Décharger la chanson précédente si elle existe
      if (this.sound) {
        await this.sound.unloadAsync()
      }

      // Créer une nouvelle instance de son
      const { sound } = await Audio.Sound.createAsync(
        { uri: song.url },
        { shouldPlay: true },
        this.handlePlaybackStatusUpdate,
      )

      this.sound = sound
      this.currentSong = song
      this.isPlaying = true

      // Mettre à jour l'état de lecture
      if (this.onPlaybackStateChange) {
        this.onPlaybackStateChange(true)
      }

      // Créer une notification
      await NotificationService.createPlaybackNotification(song, true)

      return true
    } catch (error) {
      console.error("Error loading song:", error)
      return false
    }
  }

  // Gérer les mises à jour d'état de lecture
  handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return

    // Mettre à jour la position et la durée
    this.position = status.positionMillis
    this.duration = status.durationMillis || 1

    // Appeler le callback de mise à jour d'état
    if (this.onPlaybackStatusUpdate) {
      this.onPlaybackStatusUpdate(status)
    }

    // Gérer la fin de la chanson
    if (status.didJustFinish && this.onSongComplete) {
      this.onSongComplete()
    }
  }

  // Mettre en pause ou reprendre la lecture
  async togglePlayPause() {
    if (!this.sound) return

    try {
      if (this.isPlaying) {
        await this.sound.pauseAsync()
      } else {
        await this.sound.playAsync()
      }

      this.isPlaying = !this.isPlaying

      // Mettre à jour l'état de lecture
      if (this.onPlaybackStateChange) {
        this.onPlaybackStateChange(this.isPlaying)
      }

      // Mettre à jour la notification
      if (this.currentSong) {
        await NotificationService.createPlaybackNotification(this.currentSong, this.isPlaying)
      }

      return true
    } catch (error) {
      console.error("Error toggling play/pause:", error)
      return false
    }
  }

  // Chercher une position spécifique dans la chanson
  async seekTo(positionMillis: number) {
    if (!this.sound) return false

    try {
      await this.sound.setPositionAsync(positionMillis)
      this.position = positionMillis
      return true
    } catch (error) {
      console.error("Error seeking:", error)
      return false
    }
  }

  // Nettoyer les ressources
  async cleanup() {
    if (this.sound) {
      await this.sound.unloadAsync()
      this.sound = null
    }

    await NotificationService.clearNotifications()
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_PLAYBACK_TASK)
  }

  // Définir le callback pour les mises à jour d'état
  setOnPlaybackStatusUpdate(callback: (status: AVPlaybackStatus) => void) {
    this.onPlaybackStatusUpdate = callback
  }

  // Définir le callback pour les changements d'état de lecture
  setOnPlaybackStateChange(callback: (isPlaying: boolean) => void) {
    this.onPlaybackStateChange = callback
  }

  // Définir le callback pour la fin de la chanson
  setOnSongComplete(callback: () => void) {
    this.onSongComplete = callback
  }
}

export default new PlaybackService()

