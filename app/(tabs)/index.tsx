import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import Typo from '@/components/Typo'
import { colors, spacingX, spacingY } from '@/constants/theme'
import { useAuth } from '@/contexts/authContext'
import ScreenWrapper from '@/components/ScreenWrapper'
import { verticalScale } from '@/utils/style'
import * as Icons from "phosphor-react-native"
import { ScrollView } from 'react-native'
import HomeCard from '@/components/HomeCard'
import TransactionList from '@/components/TransactionList'
import Button from '@/components/Button'
import { useRouter } from 'expo-router'
import { limit, orderBy, where } from 'firebase/firestore'
import useFetchData from '@/hooks/useFetchData'
import { TransactionType } from '@/types'

const Home = () => {

  const router = useRouter()
  const { user } = useAuth()

  const constraints = [
    where("uid", "==", user?.uid),
    orderBy("date", "desc"),
    limit(10)
  ]

  const { data: recentTransactions, loading: transactionsLoading, error } = useFetchData<TransactionType>("transactions", constraints)

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ gap: 4 }}>
            <Typo size={16} color={colors.neutral400}>Hello,</Typo>
            <Typo size={20} fontWeight={"500"}>{user?.name}</Typo>
          </View>
          <TouchableOpacity style={styles.searchIcon}>
            <Icons.MagnifyingGlassIcon size={verticalScale(22)} color={colors.neutral200} weight='bold' />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollViewStyle} showsVerticalScrollIndicator={false}>
          <View>
            <HomeCard />
          </View>
          <TransactionList data={recentTransactions} loading={transactionsLoading} emptyListMessage='No Transactions' title='Recent Transactions' />
        </ScrollView>

        <Button onPress={() => router.push("/(modals)/transactionModal")} style={styles.floatingButtons}> <Icons.PlusIcon color={colors.black} weight='bold' size={verticalScale(24)} /> </Button>

      </View>
    </ScreenWrapper>
  )
}

export default Home

const styles = StyleSheet.create({
  scrollViewStyle: {
    marginTop: spacingY._10,
    paddingBottom: verticalScale(100),
    gap: spacingY._25
  },
  floatingButtons: {
    height: verticalScale(50),
    width: verticalScale(50),
    borderRadius: 100,
    position: "absolute",
    bottom: verticalScale(30),
    right: verticalScale(30)
  },
  searchIcon: {
    backgroundColor: colors.neutral700,
    padding: spacingX._10,
    borderRadius: 50
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingY._10
  },
  container: {
    flex: 1,
    marginTop: verticalScale(8),
    paddingHorizontal: spacingX._20
  }
})