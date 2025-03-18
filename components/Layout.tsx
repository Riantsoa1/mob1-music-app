"use client"

import { SafeAreaView, Alert } from "react-native"
import { useEffect, useState } from "react"
import MusicList from "./MusicList"
import Playing from "./Playing"
import { LinearGradient } from "expo-linear-gradient"
import type { AVPlaybackStatus } from "expo-av"
import type { MusicType } from "../data/musciTypes"
import PlaybackService from "../services/PlaybackService"
import MediaService, { type Playlist } from "../services/MediaService"
import NotificationService from "../services/NotificationService"
import PlaylistModal from "./PlaylistModal"
import React from "react"

const Layout = () => {
  const [tabSelected, setTabSelected] = useState<"list" | "playing">("list")
  const [musicData, setMusicData] = useState<MusicType[]>([])
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [position, setPosition] = useState<number>(0)
  const [duration, setDuration] = useState<number>(1)
  const [isPlaylistModalVisible, setIsPlaylistModalVisible] = useState<boolean>(false)
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Charger les chansons locales et les playlists au démarrage
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)

      // Charger les chansons locales
      const songs = await MediaService.getLocalSongs()
      setMusicData(songs)

      // Charger les playlists
      const loadedPlaylists = await MediaService.getPlaylists()
      setPlaylists(loadedPlaylists)

      // Récupérer la playlist actuelle
      const currentId = await MediaService.getCurrentPlaylistId()
      if (currentId) {
        setCurrentPlaylistId(currentId)

        // Charger les chansons de la playlist actuelle
        if (songs.length > 0) {
          const playlistSongs = await MediaService.getPlaylistSongs(currentId, songs)
          if (playlistSongs.length > 0) {
            setMusicData(playlistSongs)
          }
        }
      } else if (loadedPlaylists.length > 0) {
        // Définir la première playlist comme playlist par défaut
        setCurrentPlaylistId(loadedPlaylists[0].id)
        await MediaService.setCurrentPlaylist(loadedPlaylists[0].id)
      }

      setIsLoading(false)
    }

    loadData()

    // Configurer les écouteurs de notification
    const subscription = NotificationService.setupNotificationListeners(handlePlayPause, handleNext, handlePrev)

    // Configurer les callbacks du service de lecture
    PlaybackService.setOnPlaybackStatusUpdate(handlePlaybackStatusUpdate)
    PlaybackService.setOnPlaybackStateChange(setIsPlaying)
    PlaybackService.setOnSongComplete(handleNext)

    return () => {
      subscription.remove()
    }
  }, [])

  // Gérer les mises à jour d'état de lecture
  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return

    setPosition(status.positionMillis)
    setDuration(status.durationMillis || 1)
  }

  // Jouer une chanson
  const playSound = async (index: number) => {
    if (index < 0 || index >= musicData.length) return

    const song = musicData[index]
    const success = await PlaybackService.loadAndPlaySong(song)

    if (success) {
      setCurrentSongIndex(index)
    } else {
      Alert.alert("Erreur", "Impossible de lire ce fichier audio")
    }
  }

  // Mettre en pause ou reprendre la lecture
  const handlePlayPause = async () => {
    if (musicData.length === 0) return

    // Si aucune chanson n'est en cours de lecture, en démarrer une
    if (!PlaybackService.currentSong) {
      await playSound(currentSongIndex)
      return
    }

    await PlaybackService.togglePlayPause()
  }

  // Passer à la chanson suivante
  const handleNext = () => {
    if (musicData.length === 0) return

    const nextIndex = (currentSongIndex + 1) % musicData.length
    playSound(nextIndex)
  }

  // Revenir à la chanson précédente
  const handlePrev = () => {
    if (musicData.length === 0) return

    const prevIndex = currentSongIndex - 1 < 0 ? musicData.length - 1 : currentSongIndex - 1
    playSound(prevIndex)
  }

  // Chercher une position spécifique dans la chanson
  const handleSeek = async (value: number) => {
    await PlaybackService.seekTo(value)
  }

  // Sélectionner une playlist
  const handleSelectPlaylist = async (playlistId: string) => {
    setCurrentPlaylistId(playlistId)
    await MediaService.setCurrentPlaylist(playlistId)

    // Charger les chansons de la playlist
    const playlistSongs = await MediaService.getPlaylistSongs(playlistId, await MediaService.getLocalSongs())

    if (playlistSongs.length > 0) {
      setMusicData(playlistSongs)
      setCurrentSongIndex(0)

      // Arrêter la lecture actuelle
      if (PlaybackService.isPlaying) {
        await PlaybackService.togglePlayPause()
      }
    } else {
      // Si la playlist est vide, charger toutes les chansons
      const allSongs = await MediaService.getLocalSongs()
      setMusicData(allSongs)
    }

    setIsPlaylistModalVisible(false)
  }

  const currentSong = musicData[currentSongIndex]

  return (
    <>
      <LinearGradient colors={["#212528", "#111315"]} className="flex-1">
        <SafeAreaView className="flex-1">
          {tabSelected === "list" ? (
            <MusicList
              musicData={musicData}
              setTabSelected={setTabSelected}
              playSound={playSound}
              currentSong={currentSong}
              isPlaying={isPlaying}
              currentSongIndex={currentSongIndex}
              handlePlayPause={handlePlayPause}
              onOpenPlaylistModal={() => setIsPlaylistModalVisible(true)}
              isLoading={isLoading}
            />
          ) : (
            <Playing
              setTabSelected={setTabSelected}
              currentSong={currentSong}
              handlePlayPause={handlePlayPause}
              isPlaying={isPlaying}
              handleNext={handleNext}
              handlePrev={handlePrev}
              handleSeek={handleSeek}
              duration={duration}
              position={position}
            />
          )}
        </SafeAreaView>
      </LinearGradient>

      <PlaylistModal
        visible={isPlaylistModalVisible}
        onClose={() => setIsPlaylistModalVisible(false)}
        onSelectPlaylist={handleSelectPlaylist}
        currentPlaylistId={currentPlaylistId}
        allSongs={musicData}
      />
    </>
  )
}

export default Layout

