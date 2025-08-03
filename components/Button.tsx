import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { CustomButtonProps } from '@/types'
import { colors, radius } from '@/constants/theme'
import { verticalScale } from '@/utils/style'
import Loading from './Loading'

const Button = ({ style, loading = false, onPress, children }: CustomButtonProps) => {

    if (loading) {
        return (
            <View style={[styles.button, style, { backgroundColor: "transparent" }]}>
                <Loading />
            </View>
        )
    }

    return (
        <TouchableOpacity onPress={onPress} style={[styles.button, style]}>
            {children}
        </TouchableOpacity>
    )
}

export default Button

const styles = StyleSheet.create({
    button: {
        backgroundColor: colors.primary,
        borderRadius: radius._17,
        borderCurve: "continuous",
        height: verticalScale(52),
        justifyContent: "center",
        alignItems: "center"
    }
})