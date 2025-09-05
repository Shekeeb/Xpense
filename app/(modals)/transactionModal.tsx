import { Alert, Platform, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { scale, verticalScale } from '@/utils/style'
import ModalWrapper from '@/components/ModalWrapper'
import Header from '@/components/Header'
import BackButton from '@/components/BackButton'
import Typo from '@/components/Typo'
import { TransactionType, WalletType } from '@/types'
import Button from '@/components/Button'
import { useAuth } from '@/contexts/authContext'
import { useLocalSearchParams, useRouter } from 'expo-router'
import ImageUpload from '@/components/ImageUpload'
import { createOrUpdateWallet, deleteWallet } from '@/services/walletService'
import * as Icons from "phosphor-react-native"
import { Dropdown } from 'react-native-element-dropdown';
import { expenseCategories, transactionTypes } from '@/constants/data'
import useFetchData from '@/hooks/useFetchData'
import { orderBy, where } from 'firebase/firestore'
import DateTimePicker from '@react-native-community/datetimepicker';
import Input from '@/components/Input'

const transactionModal = () => {

    const { user } = useAuth()

    const router = useRouter()

    const { data: wallets, loading: walletLoading, error: walletError } = useFetchData<WalletType>("wallets", [
        where("uid", "==", user?.uid),
        orderBy("created", "desc")
    ])

    const [transaction, setTransaction] = useState<TransactionType>({
        type: "expense",
        amount: 0,
        description: "",
        category: "",
        date: new Date(),
        walletId: "",
        image: null
    })

    const [showDatePicker, setShowDatePicker] = useState(false)

    const oldTransaction: { name: string; image: string; id: string } = useLocalSearchParams();

    const onDateChange = (event: any, selectedDate: any) => {
        const currentDate = selectedDate || transaction.date
        setTransaction({ ...transaction, date: currentDate })
        setShowDatePicker(Platform.OS == "android" ? false : true)
    };

    // useEffect(() => {
    //     if (oldTransaction?.id) {
    //         setTransaction({
    //             name: oldTransaction?.name,
    //             image: oldTransaction?.image
    //         })
    //     }
    // }, [])

    const onDelete = async () => {
        if (!oldTransaction?.id) return;
        setLoading(true)
        const response = await deleteWallet(oldTransaction?.id)
        setLoading(false)
        if (response.success) {
            router.back()
        }
        else {
            Alert.alert("Wallet", response.msg)
        }
    }

    const onDeleteAlert = () => {
        Alert.alert(
            "Confirm",
            "Are you sure you want to delete this?\nThis action will remove all transactions related to this wallet",
            [
                {
                    text: "Cancel",
                    onPress: () => console.log("Discarded"),
                    style: "cancel"
                },
                {
                    text: "Delete",
                    onPress: () => onDelete(),
                    style: "destructive"
                }
            ]
        );
    };

    const onsubmit = async () => {
        const { type, description, date, walletId, amount, category, image } = transaction;

        if (!amount || !date || !walletId || (type == "expense" && !category)) {
            Alert.alert("Transaction", "Please fill required fileds")
            return;
        }
        console.log("Done")
        let transactionData: TransactionType = {
            type, amount, description, date, walletId, category, image, uid: user?.uid
        }
        console.log("Transaction Data", transactionData)
    }

    const [loading, setLoading] = useState(false)

    return (
        <ModalWrapper>
            <View style={styles.container}>
                <Header title={oldTransaction?.id ? "Update Transaction" : 'New Transaction'} leftIcon={<BackButton />} style={{ marginBottom: spacingY._10 }} />
                <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>

                    <View style={styles.inputContainer}>
                        <Typo size={16} color={colors.neutral200}>Type</Typo>
                        <Dropdown style={styles.dropDownContainer} activeColor={colors.neutral700} itemTextStyle={styles.dropDownItemText} itemContainerStyle={styles.dropDownItemContainer} containerStyle={styles.dropDownListContainer} placeholderStyle={styles.dropDownPlaceholder} iconStyle={styles.dropDownIcon} selectedTextStyle={styles.dropDownSelectedText}
                            data={transactionTypes} labelField="label" placeholder='Select type' valueField="value" value={transaction.type} onChange={item => { setTransaction({ ...transaction, type: item.value }) }} />
                    </View>

                    <View style={styles.inputContainer}>
                        <Typo size={16} color={colors.neutral200}>Wallet</Typo>
                        <Dropdown style={styles.dropDownContainer} activeColor={colors.neutral700} itemTextStyle={styles.dropDownItemText} itemContainerStyle={styles.dropDownItemContainer} containerStyle={styles.dropDownListContainer} placeholderStyle={styles.dropDownPlaceholder} iconStyle={styles.dropDownIcon} selectedTextStyle={styles.dropDownSelectedText}
                            data={wallets.map(wallet => ({ label: `${wallet?.name} (₹${wallet.amount})`, value: wallet.id }))} labelField="label" placeholder='Select wallet' valueField="value" value={transaction.walletId} onChange={item => { setTransaction({ ...transaction, walletId: item.value || "" }) }} />
                    </View>

                    {
                        transaction.type == "expense" && (
                            <View style={styles.inputContainer}>
                                <Typo size={16} color={colors.neutral200}>Expense Category</Typo>
                                <Dropdown style={styles.dropDownContainer} activeColor={colors.neutral700} itemTextStyle={styles.dropDownItemText} itemContainerStyle={styles.dropDownItemContainer} containerStyle={styles.dropDownListContainer} placeholderStyle={styles.dropDownPlaceholder} iconStyle={styles.dropDownIcon} selectedTextStyle={styles.dropDownSelectedText}
                                    data={Object.values(expenseCategories)} labelField="label" placeholder='Select expense category' valueField="value" value={transaction.category} onChange={item => { setTransaction({ ...transaction, category: item.value || "" }) }} />
                            </View>
                        )
                    }

                    <View style={styles.inputContainer}>
                        <Typo size={16} color={colors.neutral200}>Date</Typo>
                        {
                            !showDatePicker && (
                                <Pressable style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
                                    <Typo size={14}>
                                        {new Date(transaction.date as Date).toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                        })}
                                    </Typo>
                                </Pressable>
                            )
                        }

                        {
                            showDatePicker && (
                                <View style={Platform.OS == "ios" && styles.iosDatePicker}>
                                    <DateTimePicker themeVariant='dark' value={transaction.date as Date} textColor={colors.white} mode='date' display={Platform.OS == "ios" ? "spinner" : "default"} onChange={onDateChange} />
                                    {
                                        Platform.OS == "ios" && (
                                            <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(false)}>
                                                <Typo size={15} fontWeight={"500"}>Ok</Typo>
                                            </TouchableOpacity>
                                        )
                                    }
                                </View>
                            )
                        }
                    </View>

                    <View style={styles.inputContainer}>
                        <Typo size={16} color={colors.neutral200}>Amount</Typo>
                        <Input keyboardType='numeric' value={transaction.amount?.toString()} onChangeText={value => { setTransaction({ ...transaction, amount: Number(value.replace(/[^0-9]/g, "")) }) }} />
                    </View>

                    <View style={styles.inputContainer}>
                        <View style={styles.flexRow}>
                            <Typo size={16} color={colors.neutral200}>Description</Typo>
                            <Typo size={14} color={colors.neutral500}>(Optional)</Typo>
                        </View>
                        <Input multiline containerStyle={{ flexDirection: "row", height: verticalScale(100), alignItems: "flex-start", paddingVertical: 15 }} value={transaction.description} onChangeText={value => { setTransaction({ ...transaction, description: value }) }} />
                    </View>


                    <View style={styles.inputContainer}>
                        <View style={styles.flexRow}>
                            <Typo size={16} color={colors.neutral200}>Receipt</Typo>
                            <Typo size={14} color={colors.neutral500}>(Optional)</Typo>
                        </View>
                        <ImageUpload file={transaction.image} onClear={() => setTransaction({ ...transaction, image: null })} onSelect={file => setTransaction({ ...transaction, image: file })} placeholder='Upload Image' />
                    </View>
                </ScrollView>
            </View>

            <View style={styles.footer}>
                {oldTransaction?.id && !loading &&
                    (<Button onPress={onDeleteAlert} style={{ paddingHorizontal: spacingX._15, backgroundColor: colors.rose }}>
                        <Icons.TrashIcon color={colors.white} weight='bold' size={verticalScale(24)} />
                    </Button>)}
                <Button loading={loading} style={{ flex: 1 }} onPress={onsubmit}>
                    <Typo color={colors.black} fontWeight={'700'}>{oldTransaction?.id ? 'Update' : 'Submit'}</Typo>
                </Button>
            </View>
        </ModalWrapper>
    )
}

export default transactionModal

const styles = StyleSheet.create({
    inputContainer: {
        gap: spacingY._10
    },
    form: {
        gap: spacingY._20,
        paddingVertical: spacingY._15,
        paddingBottom: spacingY._40
    },
    iosDatePicker: {

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
        paddingHorizontal: spacingY._20
    },
    iosDropdown: {
        flexDirection: "row",
        height: verticalScale(54),
        alignItems: "center",
        justifyContent: "center",
        fontSize: verticalScale(14),
        borderWidth: 1,
        color: colors.white,
        borderColor: colors.neutral300,
        borderRadius: radius._17,
        borderCurve: "continuous",
        paddingHorizontal: spacingX._15
    },
    androidDropdown: {
        height: verticalScale(54),
        alignItems: "center",
        justifyContent: "center",
        fontSize: verticalScale(14),
        borderWidth: 1,
        color: colors.white,
        borderColor: colors.neutral300,
        borderRadius: radius._17,
        borderCurve: "continuous",
    },
    flexRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacingX._5
    },
    dateInput: {
        flexDirection: "row",
        height: verticalScale(54),
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.neutral300,
        borderRadius: radius._17,
        borderCurve: "continuous",
        paddingHorizontal: spacingX._15
    },
    datePickerButton: {
        backgroundColor: colors.neutral700,
        alignSelf: "flex-end",
        padding: spacingY._7,
        paddingHorizontal: spacingY._15,
        borderRadius: radius._10
    },
    dropDownContainer: {
        height: verticalScale(54),
        borderWidth: 1,
        borderColor: colors.neutral300,
        borderRadius: radius._15,
        borderCurve: "continuous",
        paddingHorizontal: spacingX._15
    },
    dropDownItemText: {
        color: colors.white
    },
    dropDownSelectedText: {
        fontSize: verticalScale(14),
        color: colors.white
    },
    dropDownListContainer: {
        backgroundColor: colors.neutral900,
        borderRadius: radius._15,
        borderCurve: "continuous",
        paddingVertical: spacingY._7,
        top: 5,
        borderColor: colors.neutral500,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 5
    },
    dropDownPlaceholder: {
        color: colors.white
    },
    dropDownItemContainer: {
        borderRadius: radius._15,
        marginHorizontal: spacingX._5
    },
    dropDownIcon: {
        height: verticalScale(30),
        tintColor: colors.neutral300
    }
})