import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { colors, spacingX, spacingY } from '@/constants/theme'
import { scale, verticalScale } from '@/utils/style'
import ModalWrapper from '@/components/ModalWrapper'
import Header from '@/components/Header'
import BackButton from '@/components/BackButton'
import Typo from '@/components/Typo'
import Input from '@/components/Input'
import { WalletType } from '@/types'
import Button from '@/components/Button'
import { useAuth } from '@/contexts/authContext'
import { useRouter } from 'expo-router'
import * as ImagePicker from "expo-image-picker"
import ImageUpload from '@/components/ImageUpload'
import { createOrUpdateWallet } from '@/services/walletService'

const walletModal = () => {

    const { user, updateUserData } = useAuth()

    const router = useRouter()

    const [wallet, setWallet] = useState<WalletType>({
        name: "",
        image: null
    })

    const onsubmit = async () => {
        let { name, image } = wallet;
        if (!name.trim()) {
            Alert.alert("Wallet", "Wallet Name is required");
            return;
        }

        const data: WalletType = {
            name,
            image,
            uid: user?.uid
        }

        setLoading(true);
        const response = await createOrUpdateWallet(data);
        setLoading(false);
        if (response.success) {
            updateUserData(user?.uid as string);
            router.back()
        }
        else {
            Alert.alert("Wallet", response.msg)
        }
    }

    const [loading, setLoading] = useState(false)

    return (
        <ModalWrapper>
            <View style={styles.container}>
                <Header title='New Wallet' leftIcon={<BackButton />} style={{ marginBottom: spacingY._10 }} />
                <ScrollView contentContainerStyle={styles.form}>

                    <View style={styles.inputContainer}>
                        <Typo color={colors.neutral200}>Wallet Name</Typo>
                        <Input placeholder='Salary' value={wallet.name} onChangeText={value => { setWallet({ ...wallet, name: value }) }} />
                    </View>

                    <View style={styles.inputContainer}>
                        <Typo color={colors.neutral200}>Wallet Icon</Typo>
                        <ImageUpload file={wallet.image} onClear={() => setWallet({ ...wallet, image: null })} onSelect={file => setWallet({ ...wallet, image: file })} placeholder='Upload Image' />
                    </View>
                </ScrollView>
            </View>

            <View style={styles.footer}>
                <Button loading={loading} style={{ flex: 1 }} onPress={onsubmit}>
                    <Typo color={colors.black} fontWeight={'700'}>Add Wallet</Typo>
                </Button>
            </View>
        </ModalWrapper>
    )
}

export default walletModal

const styles = StyleSheet.create({
    editIcon: {
        position: "absolute",
        bottom: spacingY._5,
        right: spacingY._7,
        borderRadius: 100,
        backgroundColor: colors.neutral100,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
        padding: spacingY._7
    },
    inputContainer: {
        gap: spacingY._10
    },
    avatar: {
        alignSelf: "center",
        backgroundColor: colors.neutral300,
        height: verticalScale(135),
        width: verticalScale(135),
        borderRadius: 200,
        borderWidth: 1,
        borderColor: colors.neutral500
    },
    avatarContainer: {
        position: "relative",
        alignSelf: "center"
    },
    form: {
        gap: spacingY._30,
        marginTop: spacingY._15
    },
    footer: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        paddingHorizontal: spacingX._20,
        gap: scale(12),
        paddingTop: spacingY._15,
        borderTopColor: colors.neutral700,
        marginBottom: spacingY._5,
        borderTopWidth: 1
    },
    container: {
        flex: 1,
        justifyContent: "space-between",
        paddingHorizontal: spacingY._20
    }
})