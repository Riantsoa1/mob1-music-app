"use client"

import { useEffect } from "react"
import { View } from "react-native"
import Layout from "../components/Layout"
import PlaybackService from "../services/PlaybackService"
import React from "react"

export default function Index() {
  useEffect(() => {
    // Initialiser le service de lecture au démarrage de l'application
    const initPlayback = async () => {
      await PlaybackService.init()
    }

    initPlayback()

    // Nettoyer les ressources lors de la fermeture de l'application
    return () => {
      PlaybackService.cleanup()
    }
  }, [])

  return (
    <View className="flex-1">
      <Layout />
    </View>
  )
}

