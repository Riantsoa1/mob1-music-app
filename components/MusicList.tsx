"use client"

import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native"
import { useState } from "react"
import type { MusicType } from "../data/musciTypes"
import { Ionicons } from "@expo/vector-icons"
import NeumorphicButton from "./NeumorphicButton"
import coverimage from "../assets/assets.jpeg"
import SongOptionsModal from "./SongOptionsModal"
import React from "react"

interface Props {
  musicData: MusicType[]
  setTabSelected: any
  playSound: any
  currentSong: MusicType
  isPlaying: boolean
  currentSongIndex: number
  handlePlayPause: Function
  onOpenPlaylistModal: () => void
  isLoading: boolean
}

const MusicList = ({
  musicData,
  setTabSelected,
  playSound,
  currentSong,
  isPlaying,
  currentSongIndex,
  handlePlayPause,
  onOpenPlaylistModal,
  isLoading,
}: Props) => {
  const [selectedSong, setSelectedSong] = useState<MusicType | null>(null)
  const [isSongOptionsVisible, setIsSongOptionsVisible] = useState(false)

  const handleLongPress = (song: MusicType) => {
    setSelectedSong(song)
    setIsSongOptionsVisible(true)
  }

  return (
    <View className="h-screen">
      <View className="flex-row justify-between items-center mt-3 px-7">
        <Text className="text-white font-semibold text-sm">&copy; ASHISH SIGDEL • 2025</Text>
        <TouchableOpacity onPress={onOpenPlaylistModal}>
          <Text className="text-orange-500 font-semibold">Playlists</Text>
        </TouchableOpacity>
      </View>
      <View className="my-10">
        <View className="flex items-center flex-row justify-between px-7">
          <NeumorphicButton icon="heart" style="p-4 bg-gray-700" onPress={() => null} />
          <View className="rounded-full border-2 border-[#2a2d2fcd] shadow-inner shadow-gray-700">
            <Image
              source={currentSong ? { uri: currentSong.artwork } : coverimage}
              alt="image"
              width={150}
              height={150}
              className="rounded-full shadow-lg shadow-black w-52 h-52"
            />
          </View>
          <NeumorphicButton
            icon="ellipsis-horizontal"
            style="p-4 bg-gray-700"
            onPress={() => setTabSelected("playing")}
          />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#e17645" />
          <Text className="text-white mt-4">Chargement des chansons...</Text>
        </View>
      ) : musicData.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="musical-notes" size={50} color="#e17645" />
          <Text className="text-white text-center mt-4 text-lg">Aucune chanson trouvée</Text>
          <Text className="text-gray-400 text-center mt-2">
            Ajoutez des chansons à votre appareil ou accordez les permissions nécessaires
          </Text>
        </View>
      ) : (
        <ScrollView>
          <View className="px-4">
            {musicData.map((music, index) => (
              <TouchableOpacity
                onPress={() => playSound(index)}
                onLongPress={() => handleLongPress(music)}
                key={music.id}
                className={`rounded-2xl mb-2 ${
                  currentSongIndex === index
                    ? "bg-black border-2 border-[#2a2d2fcd] shadow-inner shadow-gray-800"
                    : "bg-transparent border-0 shadow-none"
                }`}
              >
                <View
                  className={`rounded-2xl flex-row justify-between items-center px-4 py-5 ${
                    currentSongIndex === index && "border border-[#2a2d2fcd]"
                  }`}
                >
                  <View className="flex-1 mr-2">
                    <Text className="text-white text-xl" numberOfLines={1}>
                      {music.title}
                    </Text>
                    <Text className="text-gray-300 text-sm" numberOfLines={1}>
                      {music.artist}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => handleLongPress(music)} className="mr-2">
                      <Ionicons name="ellipsis-vertical" size={18} color="#ccc" />
                    </TouchableOpacity>
                    <NeumorphicButton
                      icon={currentSongIndex === index && isPlaying ? "pause" : "play"}
                      style={`p-3 ${currentSongIndex === index ? "bg-orange-700" : "bg-gray-700"}`}
                      onPress={() => (currentSongIndex === index ? handlePlayPause() : playSound(index))}
                      iconSize={18}
                      showShadow={false}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      <SongOptionsModal
        visible={isSongOptionsVisible}
        onClose={() => setIsSongOptionsVisible(false)}
        song={selectedSong}
      />
    </View>
  )
}

export default MusicList

