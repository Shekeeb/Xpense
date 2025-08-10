import { initializeApp } from "firebase/app";
import {initializeAuth,getReactNativePersistence} from "firebase/auth"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC0iGZ6f6ordl42fHrJQpFqy3CUpF5CTx0",
  authDomain: "xpense-1234.firebaseapp.com",
  projectId: "xpense-1234",
  storageBucket: "xpense-1234.firebasestorage.app",
  messagingSenderId: "668349127470",
  appId: "1:668349127470:web:56d1559a6816679b61f8bf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//auth
export const auth=initializeAuth(app,{
    persistence:getReactNativePersistence(AsyncStorage)
})

//db
export const firestore=getFirestore(app)