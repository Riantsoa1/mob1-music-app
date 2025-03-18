"use client"

import { useState, useEffect } from "react"
import { View, Text, Modal, TouchableOpacity, FlatList, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import NeumorphicButton from "./NeumorphicButton"
import MediaService, { type Playlist } from "../services/MediaService"
import type { MusicType } from "../data/musciTypes"
import React from "react"

interface SongOptionsModalProps {
  visible: boolean
  onClose: () => void
  song: MusicType | null
}

const SongOptionsModal = ({ visible, onClose, song }: SongOptionsModalProps) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([])

  // Charger les playlists
  useEffect(() => {
    if (visible && song) {
      loadPlaylists()
    }
  }, [visible, song])

  const loadPlaylists = async () => {
    const loadedPlaylists = await MediaService.getPlaylists()
    setPlaylists(loadedPlaylists)
  }

  // Ajouter une chanson à une playlist
  const handleAddToPlaylist = async (playlistId: string) => {
    if (!song) return

    try {
      await MediaService.addSongToPlaylist(playlistId, song.id)
      Alert.alert("Succès", "Chanson ajoutée à la playlist")
      onClose()
    } catch (error) {
      console.error("Error adding song to playlist:", error)
      Alert.alert("Erreur", "Impossible d'ajouter la chanson à la playlist")
    }
  }

  // Vérifier si la chanson est déjà dans la playlist
  const isSongInPlaylist = (playlist: Playlist) => {
    if (!song) return false
    return playlist.songs.includes(song.id)
  }

  // Supprimer une chanson d'une playlist
  const handleRemoveFromPlaylist = async (playlistId: string) => {
    if (!song) return

    try {
      await MediaService.removeSongFromPlaylist(playlistId, song.id)
      Alert.alert("Succès", "Chanson supprimée de la playlist")
      loadPlaylists()
    } catch (error) {
      console.error("Error removing song from playlist:", error)
      Alert.alert("Erreur", "Impossible de supprimer la chanson de la playlist")
    }
  }

  if (!song) return null

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/70">
        <View className="w-11/12 bg-[#212528] rounded-2xl p-5 border-2 border-[#2a2d2fcd]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-bold">Options</Text>
            <NeumorphicButton icon="close" onPress={onClose} style="p-2 bg-gray-700" iconSize={18} />
          </View>

          <View className="mb-4 p-3 bg-gray-800 rounded-lg">
            <Text className="text-white font-medium">{song.title}</Text>
            <Text className="text-gray-400">{song.artist}</Text>
          </View>

          <Text className="text-white text-lg mb-2">Ajouter à une playlist</Text>

          <FlatList
            data={playlists}
            keyExtractor={(item) => item.id}
            className="max-h-80"
            renderItem={({ item }) => {
              const songInPlaylist = isSongInPlaylist(item)

              return (
                <TouchableOpacity
                  className="p-4 mb-2 rounded-lg flex-row justify-between items-center bg-gray-800"
                  onPress={() => (songInPlaylist ? handleRemoveFromPlaylist(item.id) : handleAddToPlaylist(item.id))}
                >
                  <Text className="text-white font-medium">{item.name}</Text>

                  {songInPlaylist ? (
                    <View className="flex-row items-center">
                      <Text className="text-gray-400 mr-2">Ajouté</Text>
                      <Ionicons name="checkmark-circle" size={20} color="#e17645" />
                    </View>
                  ) : (
                    <Ionicons name="add-circle-outline" size={20} color="#e17645" />
                  )}
                </TouchableOpacity>
              )
            }}
          />
        </View>
      </View>
    </Modal>
  )
}

export default SongOptionsModal

