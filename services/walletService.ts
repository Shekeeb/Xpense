import { WalletType } from "@/types";
import { uploadFileToCloudinary } from "./imageService";
import { collection, doc, setDoc } from "firebase/firestore";
import { firestore } from "@/config/firebase";

export const createOrUpdateWallet = async (
    walletData: Partial<WalletType>
): Promise<ResponseType> => {
    try {
        let walletToSave = { ...walletData };

        if (walletData.image) {
            const imageUploadRes = await uploadFileToCloudinary(walletData.image, "wallets");
            if (!imageUploadRes.success) {
                return { success: false, msg: imageUploadRes.msg }
            }
            walletToSave.image = imageUploadRes.data;
        }

        if (!walletData?.id) {
            walletData.amount = 0;
            walletData.totalExpenses = 0,
                walletData.totalIncome = 0,
                walletData.created = new Date()
        }

        const walletRef = walletData?.id ? doc(firestore, "wallets", walletData?.id) :
            doc(collection(firestore, "wallets"))

        await setDoc(walletRef, walletToSave, { merge: true })
        return { success: true, data: { ...walletToSave, id: walletRef.id } }

    } catch (error: any) {
        console.log("Error creating or updating wallet")
        return { success: false, msg: error.message }
    }
}