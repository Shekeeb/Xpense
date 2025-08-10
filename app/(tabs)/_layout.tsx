import { StyleSheet, View } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import CustomTabs from '@/components/CustomTabs'
import { colors } from '@/constants/theme'


export default function _layout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral900 }}>
      <Tabs tabBar={(props) => <CustomTabs {...props} />} screenOptions={{ headerShown: false, }}>
        <Tabs.Screen name='index' />
        <Tabs.Screen name='statistics' />
        <Tabs.Screen name='wallet' />
        <Tabs.Screen name='profile' />
      </Tabs>
    </View>
  )
}
