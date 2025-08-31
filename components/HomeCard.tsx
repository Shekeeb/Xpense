import { ImageBackground, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Typo from './Typo'
import { colors, spacingX, spacingY } from '@/constants/theme'
import { scale, verticalScale } from '@/utils/style'
import card from "../assets/images/card.png"
import * as Icons from "phosphor-react-native"

const HomeCard = () => {
    return (
        <ImageBackground source={card} resizeMode='stretch' style={styles.bgImage}>
            <View style={styles.container}>

                <View>
                    <View style={styles.totalBalanceRow}>
                        <Typo size={17} fontWeight={"500"} color={colors.neutral800}>Total Balance</Typo>
                        <Icons.DotsThreeOutlineIcon size={verticalScale(23)} color={colors.black} weight='fill' />
                    </View>
                    <Typo size={30} color={colors.black} fontWeight={"bold"}>₹2255</Typo>
                </View>

                <View style={styles.stats}>

                    <View style={{ gap: verticalScale(5) }}>
                        <View style={styles.incomeExpense}>
                            <View style={styles.stats}>
                                <Icons.ArrowDownIcon size={verticalScale(15)} color={colors.black} weight='bold' />
                            </View>
                            <Typo size={16} color={colors.neutral700} fontWeight={"500"}>Income</Typo>
                        </View>
                        <View style={{ alignSelf: "center" }}>
                            <Typo size={17} color={colors.green} fontWeight={"600"}>₹2255</Typo>
                        </View>
                    </View>

                    <View style={{ gap: verticalScale(5) }}>
                        <View style={styles.incomeExpense}>
                            <View style={styles.stats}>
                                <Icons.ArrowUpIcon size={verticalScale(15)} color={colors.black} weight='bold' />
                            </View>
                            <Typo size={16} color={colors.neutral700} fontWeight={"500"}>Expense</Typo>
                        </View>
                        <View style={{ alignSelf: "center" }}>
                            <Typo size={17} color={colors.rose} fontWeight={"600"}>₹2255</Typo>
                        </View>
                    </View>
                </View>

            </View>
        </ImageBackground>
    )
}

export default HomeCard

const styles = StyleSheet.create({
    incomeExpense: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacingY._7
    },
    statsIcon: {
        backgroundColor: colors.neutral350,
        padding: spacingY._5,
        borderRadius: 50
    },
    stats: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    totalBalanceRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacingY._5
    },
    container: {
        justifyContent: "space-between",
        height: "87%",
        width: "100%",
        padding: spacingX._20,
        paddingHorizontal: scale(23)
    },
    bgImage: {
        width: "100%",
        height: scale(210)
    }
})