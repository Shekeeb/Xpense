import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { colors, spacingX, spacingY } from '@/constants/theme'
import { scale, verticalScale } from '@/utils/style'
import ModalWrapper from '@/components/ModalWrapper'
import Header from '@/components/Header'
import BackButton from '@/components/BackButton'
import { Image } from 'expo-image'
import { getProfileImage } from '@/services/imageService'
import * as Icons from "phosphor-react-native"
import Typo from '@/components/Typo'
import Input from '@/components/Input'
import { UserDataType } from '@/types'
import Button from '@/components/Button'
import { useAuth } from '@/contexts/authContext'
import { updateUser } from '@/services/userService'
import { useRouter } from 'expo-router'
import * as ImagePicker from "expo-image-picker"

const profileModal = () => {

  const { user, updateUserData } = useAuth()

  const router=useRouter()

  const [userData, setUserData] = useState<UserDataType>({
    name: "",
    image: null
  })

  useEffect(() => {
    setUserData({
      name: user?.name || "",
      image: user?.image || null
    })
  }, [user]);

  const onPickImage=async()=>{
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setUserData({...userData,image:result.assets[0]});
    }
  }

  const onsubmit = async () => {
    let { name, image } = userData;
    if (!name.trim()) {
      Alert.alert("User", "Name is required");
      return;
    }
    setLoading(true);
    const response=await updateUser(user?.uid as string, userData);
    setLoading(false);
    if(response.success){
      updateUserData(user?.uid as string);
      router.back()
    }
    else{
      Alert.alert("User",response.msg)
    }
  }

  const [loading, setLoading] = useState(false)

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header title='Update Profile' leftIcon={<BackButton />} style={{ marginBottom: spacingY._10 }} />
        <ScrollView contentContainerStyle={styles.form}>

          <View style={styles.avatarContainer}>
            <Image style={styles.avatar} transition={100} contentFit='cover' source={getProfileImage(userData.image)} />
            <TouchableOpacity style={styles.editIcon} onPress={onPickImage}>
              <Icons.PencilIcon size={verticalScale(20)} color={colors.neutral800} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Name</Typo>
            <Input placeholder='Name' value={userData.name} onChangeText={value => { setUserData({ ...userData, name: value }) }} />
          </View>

        </ScrollView>
      </View>

      <View style={styles.footer}>
        <Button loading={loading} style={{ flex: 1 }} onPress={onsubmit}>
          <Typo color={colors.black} fontWeight={'700'}>Update</Typo>
        </Button>
      </View>
    </ModalWrapper>
  )
}

export default profileModal

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