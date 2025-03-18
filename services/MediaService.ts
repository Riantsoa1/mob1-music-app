import * as MediaLibrary from "expo-media-library"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { MusicType } from "../data/musciTypes"

// Clés pour le stockage local
const PLAYLISTS_KEY = "@music_app:playlists"
const CURRENT_PLAYLIST_KEY = "@music_app:current_playlist"

// Type pour les playlists
export type Playlist = {
  id: string
  name: string
  songs: string[] // IDs des chansons
  createdAt: number
}

class MediaService {
  // Récupérer tous les fichiers audio du téléphone
  async getLocalSongs(): Promise<MusicType[]> {
    try {
      // Demander la permission d'accéder à la médiathèque
      const permission = await MediaLibrary.requestPermissionsAsync()

      if (!permission.granted) {
        console.log("Permission to access media library not granted")
        return []
      }

      // Récupérer tous les assets audio
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: "audio",
        first: 1000, // Limiter à 1000 chansons pour éviter les problèmes de performance
      })

      // Transformer les assets en format MusicType
      const songs: MusicType[] = await Promise.all(
        media.assets.map(async (asset, index) => {
          // Récupérer plus d'informations sur l'asset
          const assetInfo = await MediaLibrary.getAssetInfoAsync(asset)

          return {
            id: asset.id,
            title: asset.filename.replace(/\.[^/.]+$/, "") || "Unknown Title",
            artist: assetInfo.creationTime ? "Unknown Artist" : "Unknown Artist",
            artwork: asset.uri, // Utiliser l'URI de l'asset comme artwork par défaut
            url: asset.uri,
          }
        }),
      )

      return songs
    } catch (error) {
      console.error("Error fetching local songs:", error)
      return []
    }
  }

  // Récupérer toutes les playlists
  async getPlaylists(): Promise<Playlist[]> {
    try {
      const playlistsJson = await AsyncStorage.getItem(PLAYLISTS_KEY)
      if (playlistsJson) {
        return JSON.parse(playlistsJson)
      }
      // Créer une playlist par défaut si aucune n'existe
      const defaultPlaylist: Playlist = {
        id: "default",
        name: "Ma Playlist",
        songs: [],
        createdAt: Date.now(),
      }
      await this.savePlaylists([defaultPlaylist])
      return [defaultPlaylist]
    } catch (error) {
      console.error("Error fetching playlists:", error)
      return []
    }
  }

  // Sauvegarder les playlists
  async savePlaylists(playlists: Playlist[]): Promise<void> {
    try {
      await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists))
    } catch (error) {
      console.error("Error saving playlists:", error)
    }
  }

  // Créer une nouvelle playlist
  async createPlaylist(name: string): Promise<Playlist> {
    const playlists = await this.getPlaylists()
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      songs: [],
      createdAt: Date.now(),
    }

    playlists.push(newPlaylist)
    await this.savePlaylists(playlists)
    return newPlaylist
  }

  // Ajouter une chanson à une playlist
  async addSongToPlaylist(playlistId: string, songId: string): Promise<void> {
    const playlists = await this.getPlaylists()
    const playlistIndex = playlists.findIndex((p) => p.id === playlistId)

    if (playlistIndex !== -1) {
      // Vérifier si la chanson n'est pas déjà dans la playlist
      if (!playlists[playlistIndex].songs.includes(songId)) {
        playlists[playlistIndex].songs.push(songId)
        await this.savePlaylists(playlists)
      }
    }
  }

  // Supprimer une chanson d'une playlist
  async removeSongFromPlaylist(playlistId: string, songId: string): Promise<void> {
    const playlists = await this.getPlaylists()
    const playlistIndex = playlists.findIndex((p) => p.id === playlistId)

    if (playlistIndex !== -1) {
      playlists[playlistIndex].songs = playlists[playlistIndex].songs.filter((id) => id !== songId)
      await this.savePlaylists(playlists)
    }
  }

  // Supprimer une playlist
  async deletePlaylist(playlistId: string): Promise<void> {
    const playlists = await this.getPlaylists()
    const filteredPlaylists = playlists.filter((p) => p.id !== playlistId)
    await this.savePlaylists(filteredPlaylists)
  }

  // Définir la playlist actuelle
  async setCurrentPlaylist(playlistId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(CURRENT_PLAYLIST_KEY, playlistId)
    } catch (error) {
      console.error("Error setting current playlist:", error)
    }
  }

  // Récupérer la playlist actuelle
  async getCurrentPlaylistId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(CURRENT_PLAYLIST_KEY)
    } catch (error) {
      console.error("Error getting current playlist:", error)
      return null
    }
  }

  // Récupérer les chansons d'une playlist
  async getPlaylistSongs(playlistId: string, allSongs: MusicType[]): Promise<MusicType[]> {
    const playlists = await this.getPlaylists()
    const playlist = playlists.find((p) => p.id === playlistId)

    if (!playlist) return []

    return playlist.songs
      .map((songId) => allSongs.find((song) => song.id === songId))
      .filter((song) => song !== undefined) as MusicType[]
  }
}

export default new MediaService()

