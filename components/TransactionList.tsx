import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { TransactionItemProps, TransactionListType } from '@/types'
import { verticalScale } from '@/utils/style'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import Typo from './Typo'
import { FlashList } from "@shopify/flash-list";
import Loading from './Loading'
import { expenseCategories, incomeCategory } from '@/constants/data'
import Animated, { FadeInDown } from 'react-native-reanimated'

const TransactionList = ({ data, loading, title, emptyListMessage }: TransactionListType) => {

    const handleClick = () => {

    }

    return (
        <View style={styles.container}>
            {
                title && (
                    <Typo size={20} fontWeight={"500"}>{title}</Typo>
                )
            }
            <View style={styles.list}>
                <FlashList data={data} renderItem={({ item, index }) => <TransactionItem item={item} index={index} handleClick={handleClick} />} estimatedItemSize={60} />
            </View>
            {
                !loading && data.length == 0 && (
                    <Typo size={15} color={colors.neutral400} style={{ textAlign: "center", marginTop: spacingY._15 }}>{emptyListMessage}</Typo>
                )
            }
            {
                loading && (
                    <View style={{ top: verticalScale(100) }}><Loading /></View>
                )
            }
        </View>
    )
}

const TransactionItem = ({ item, index, handleClick }: TransactionItemProps) => {
    let category = incomeCategory;
    const IconComponent = category.icon

    return (
        <Animated.View entering={FadeInDown.delay(index * 150).springify().damping(14)}>
            <TouchableOpacity style={styles.row} onPress={() => handleClick(item)}>

                <View style={[styles.icon, { backgroundColor: category.bgColor }]}>
                    {IconComponent && (
                        <IconComponent size={verticalScale(18)} weight='fill' color={colors.white} />
                    )}
                </View>

                <View style={[styles.categoryDes, !item?.description && { justifyContent: "center" }]}>
                    <Typo size={17}>{category.label}</Typo>
                    {item?.description && (
                        <Typo size={12} color={colors.neutral400} numberOfLines={1}>
                            {item.description}
                        </Typo>
                    )}
                </View>

                <View style={styles.amountDate}>
                    <Typo fontWeight={"500"} color={colors.primary}>+₹2255</Typo>
                    <Typo size={13} color={colors.neutral400}>16 Aug</Typo>
                </View>
            </TouchableOpacity>
        </Animated.View>
    )
}

export default TransactionList

const styles = StyleSheet.create({
    amountDate: {
        gap: 3,
        alignItems: "flex-end"
    },
    categoryDes: {
        flex: 1,
        justifyContent: "center",
        gap: 2.5
    },
    icon: {
        height: verticalScale(36),
        width: verticalScale(36),
        aspectRatio: 1,
        justifyContent: "center",
        alignItems: "center",
        borderCurve: "continuous",
        borderRadius: radius._12
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacingX._12,
        marginBottom: spacingY._12,
        padding: spacingX._12,
        borderRadius: radius._12,
        backgroundColor: colors.neutral800,
    },
    list: {
        minHeight: 3
    },
    container: {
        gap: spacingY._17
    }
})