"use client"

import { useState, useEffect } from "react"
import { View, Text, Modal, TouchableOpacity, TextInput, FlatList, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import NeumorphicButton from "./NeumorphicButton"
import MediaService, { type Playlist } from "../services/MediaService"
import type { MusicType } from "../data/musciTypes"
import React from "react"

interface PlaylistModalProps {
  visible: boolean
  onClose: () => void
  onSelectPlaylist: (playlistId: string) => void
  currentPlaylistId: string | null
  allSongs: MusicType[]
}

const PlaylistModal = ({ visible, onClose, onSelectPlaylist, currentPlaylistId, allSongs }: PlaylistModalProps) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false)

  // Charger les playlists
  useEffect(() => {
    if (visible) {
      loadPlaylists()
    }
  }, [visible])

  const loadPlaylists = async () => {
    const loadedPlaylists = await MediaService.getPlaylists()
    setPlaylists(loadedPlaylists)
  }

  // Créer une nouvelle playlist
  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un nom pour la playlist")
      return
    }

    await MediaService.createPlaylist(newPlaylistName)
    setNewPlaylistName("")
    setIsCreatingPlaylist(false)
    loadPlaylists()
  }

  // Supprimer une playlist
  const handleDeletePlaylist = async (playlistId: string) => {
    Alert.alert("Confirmation", "Êtes-vous sûr de vouloir supprimer cette playlist ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await MediaService.deletePlaylist(playlistId)
          loadPlaylists()
        },
      },
    ])
  }

  // Afficher le nombre de chansons dans une playlist
  const getPlaylistSongCount = (playlist: Playlist) => {
    return playlist.songs.length
  }

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/70">
        <View className="w-11/12 bg-[#212528] rounded-2xl p-5 border-2 border-[#2a2d2fcd]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-bold">Mes Playlists</Text>
            <NeumorphicButton icon="close" onPress={onClose} style="p-2 bg-gray-700" iconSize={18} />
          </View>

          {isCreatingPlaylist ? (
            <View className="mb-4 flex-row items-center">
              <TextInput
                className="flex-1 bg-gray-800 text-white p-3 rounded-l-lg border border-gray-700"
                placeholder="Nom de la playlist"
                placeholderTextColor="#999"
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
              />
              <TouchableOpacity className="bg-orange-700 p-3 rounded-r-lg" onPress={handleCreatePlaylist}>
                <Ionicons name="checkmark" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="mb-4 flex-row items-center bg-gray-800 p-3 rounded-lg border border-gray-700"
              onPress={() => setIsCreatingPlaylist(true)}
            >
              <Ionicons name="add-circle" size={24} color="#e17645" />
              <Text className="text-white ml-2">Nouvelle playlist</Text>
            </TouchableOpacity>
          )}

          <FlatList
            data={playlists}
            keyExtractor={(item) => item.id}
            className="max-h-80"
            renderItem={({ item }) => (
              <TouchableOpacity
                className={`p-4 mb-2 rounded-lg flex-row justify-between items-center ${
                  currentPlaylistId === item.id ? "bg-gray-700" : "bg-gray-800"
                }`}
                onPress={() => onSelectPlaylist(item.id)}
              >
                <View className="flex-1">
                  <Text className="text-white font-medium">{item.name}</Text>
                  <Text className="text-gray-400 text-sm">{getPlaylistSongCount(item)} chansons</Text>
                </View>

                {playlists.length > 1 && (
                  <TouchableOpacity onPress={() => handleDeletePlaylist(item.id)} className="p-2">
                    <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
                  </TouchableOpacity>
                )}

                {currentPlaylistId === item.id && (
                  <View className="ml-2">
                    <Ionicons name="checkmark-circle" size={24} color="#e17645" />
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  )
}

export default PlaylistModal

