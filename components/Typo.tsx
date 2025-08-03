import { StyleSheet, Text, TextStyle, View } from 'react-native'
import React from 'react'
import { TypoProps } from '@/types'
import { colors } from '@/constants/theme'
import { verticalScale } from '@/utils/style'

const Typo = ({ size, color = colors.text, fontWeight = "400", children, style, textProps = {}, }: TypoProps) => {

    const textStyle: TextStyle = {
        fontSize: size ? verticalScale(size) : verticalScale(18),
        color,
        fontWeight
    }

    return (
        <View>
            <Text style={[textStyle,style]} {...textProps}>{children}</Text>
        </View>
    )
}

export default Typo

const styles = StyleSheet.create({})