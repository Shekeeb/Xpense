import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { verticalScale } from '@/utils/style'
import * as Icons from "phosphor-react-native"
import { useRouter } from 'expo-router'
import useFetchData from '@/hooks/useFetchData'
import { WalletType } from '@/types'
import { useAuth } from '@/contexts/authContext'
import { orderBy, where } from 'firebase/firestore'
import Loading from '@/components/Loading'
import WalletListItem from '@/components/WalletListItem'

const wallet = () => {

  const router = useRouter()
  const { user } = useAuth()

  const { data: wallets, loading, error } = useFetchData<WalletType>("wallets", [
    where("uid", "==", user?.uid),
    orderBy("created", "desc")
  ])

  const getTotalBalance = () =>
    wallets.reduce((total, item) => {
      total = total + (item.amount || 0)
      return total;
    }, 0)

  return (
    <ScreenWrapper style={{ backgroundColor: colors.black }}>
      <View style={styles.container}>

        <View style={styles.balanceView}>
          <View style={{ alignItems: "center" }}>
            <Typo size={45} fontWeight={'500'}>₹{getTotalBalance()?.toFixed(2)}</Typo>
            <Typo size={16} color={colors.neutral300}>Total Balance</Typo>
          </View>
        </View>

        <View style={styles.wallets}>
          <View style={styles.flexow}>
            <Typo size={20} fontWeight={"500"}>My Wallets</Typo>
            <TouchableOpacity onPress={() => router.push("/(modals)/walletModal")}>
              <Icons.PlusCircleIcon size={verticalScale(33)} weight='fill' color={colors.primary} />
            </TouchableOpacity>
          </View>
          {loading && <Loading />}
          <FlatList data={wallets} renderItem={({ item, index }) => {
            return <WalletListItem item={item} index={index} router={router} />
          }}
            contentContainerStyle={styles.listStyle}
          />
        </View>

      </View>
    </ScreenWrapper>
  )
}

export default wallet

const styles = StyleSheet.create({
  listStyle: {
    paddingVertical: spacingY._25,
    paddingTop: spacingY._15
  },
  wallets: {
    flex: 1,
    backgroundColor: colors.neutral900,
    borderTopRightRadius: radius._30,
    borderTopLeftRadius: radius._30,
    padding: spacingX._20,
    paddingTop: spacingX._25
  },
  flexow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingY._10
  },
  balanceView: {
    height: verticalScale(160),
    backgroundColor: colors.black,
    justifyContent: "center",
    alignItems: "center"
  },
  container: {
    flex: 1,
    justifyContent: "space-between"
  }
})