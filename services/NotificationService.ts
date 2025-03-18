import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import type { MusicType } from "../data/musciTypes"

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

class NotificationService {
  // Initialiser les notifications
  async init() {
    // Demander la permission pour les notifications
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== "granted") {
      console.log("Permission for notifications not granted")
      return false
    }

    // Configurer les actions de notification pour iOS
    if (Platform.OS === "ios") {
      await Notifications.setNotificationCategoryAsync("playback", [
        {
          identifier: "prev",
          buttonTitle: "Précédent",
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: "play-pause",
          buttonTitle: "Lecture/Pause",
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: "next",
          buttonTitle: "Suivant",
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
      ])
    }

    return true
  }

  // Créer une notification de lecture
  async createPlaybackNotification(song: MusicType, isPlaying: boolean) {
    // Annuler les notifications précédentes
    await Notifications.dismissAllNotificationsAsync()

    // Créer une nouvelle notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: song.title,
        body: song.artist,
        data: { song },
        autoDismiss: false,
        sticky: true,
        ...(Platform.OS === "ios" && { categoryIdentifier: "playback" }),
        // Pour Android, les actions sont définies directement ici
        ...(Platform.OS === "android" && {
          actions: [
            { identifier: "prev", title: "Précédent" },
            { identifier: "play-pause", title: isPlaying ? "Pause" : "Lecture" },
            { identifier: "next", title: "Suivant" },
          ],
        }),
      },
      trigger: null, // Afficher immédiatement
    })
  }

  // Supprimer toutes les notifications
  async clearNotifications() {
    await Notifications.dismissAllNotificationsAsync()
  }

  // Configurer les écouteurs d'événements pour les actions de notification
  setupNotificationListeners(onPlayPause: () => void, onNext: () => void, onPrev: () => void) {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const actionId = response.actionIdentifier

      switch (actionId) {
        case "play-pause":
          onPlayPause()
          break
        case "next":
          onNext()
          break
        case "prev":
          onPrev()
          break
      }
    })

    return subscription
  }
}

export default new NotificationService()

