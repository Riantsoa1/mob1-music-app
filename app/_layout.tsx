import "../global.css"
import { StatusBar } from "react-native"
import { Stack } from "expo-router"
import React from "react"

const RootLayout = () => {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#111315" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}

export default RootLayout
