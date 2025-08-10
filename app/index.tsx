import { StyleSheet, Text, View ,Image} from 'react-native'
import React, { useEffect } from 'react'
import splashImage from "../assets/images/splashImage.png"
import { colors } from '@/constants/theme'
import { useRouter } from 'expo-router'

const index = () => {

  // const router=useRouter();

  // useEffect(()=>{
  //   setTimeout(()=>{
  //     router.push('/(auth)/welcome');
  //   },3000)
  // },[])

  return (
    <View style={styles.container}>
      <Image style={styles.logo} resizeMode="contain" source={splashImage}/>
    </View>
  )
}

export default index

const styles = StyleSheet.create({
    container:{
        flex:1,
        justifyContent:"center",
        alignItems:"center",
        backgroundColor:colors.neutral900
    },
    logo:{
        height:"20%",
        aspectRatio:1
    }
})