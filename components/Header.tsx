import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { HeaderProps } from '@/types'
import Typo from './Typo'

const Header = ({ title = "", leftIcon, style }: HeaderProps) => {
    return (
        <View style={[styles.container, style]}>
            {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
            {title && <Typo size={22} fontWeight={"600"}>{title}</Typo>}
        </View>
    )
}

export default Header

const styles = StyleSheet.create({
    container: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    leftIcon: {
        position: "absolute",
        left: 0,
    },
})