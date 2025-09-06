import { firestore } from "@/config/firebase";
import { TransactionType, WalletType } from "@/types";
import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageService";

export const createOrUpdateTransaction = async (
    transactionData: Partial<TransactionType>): Promise<ResponseType> => {
    try {
        const { id, type, walletId, image, amount } = transactionData
        if (!amount || amount <= 0 || !walletId || !type) {
            return { success: false, msg: "Invalid transaction data" }
        }

        if (id) {

        }
        else {
            let response = await updateWalletforNewTransaction(
                walletId!,
                Number(amount!),
                type
            )
            if (!response.success) return response;
        }

        if (image) {
            const imageUploadRes = await uploadFileToCloudinary(image, "transactions");
            if (!imageUploadRes.success) {
                return { success: false, msg: imageUploadRes.msg }
            }
            transactionData.image = imageUploadRes.data;
        }

        const transactionRef = id ? doc(firestore, "transactions", id) : doc(collection(firestore, "transactions"))
        await setDoc(transactionRef, transactionData, { merge: true })
        return { success: true, data: { ...transactionData, id: transactionRef.id } }
    } catch (error: any) {
        console.log("Error creating or updating transaction:", error);
        return { success: false, msg: error.message };
    }
}

const updateWalletforNewTransaction = async (
    walletId: string,
    amount: number,
    type: string
) => {
    try {
        const walletRef = doc(firestore, "wallets", walletId)
        const walletSnapShot = await getDoc(walletRef)
        if (!walletSnapShot) {
            console.log("Error updating wallet for new transaction");
            return { success: false, msg: "wallet not found" };
        }

        const walletData = walletSnapShot.data() as WalletType

        if (type == "expense" && walletData.amount! - amount < 0) {
            return { success: false, msg: "selected wallet don't have enough balance" };
        }

        const updateType = type == "income" ? "totalIncome" : "totalExpenses"
        const updatedWalletAmount = type == "income" ? Number(walletData.amount) + amount : Number(walletData.amount) - amount
        const updatedTotals = type == "income" ? Number(walletData.totalIncome) + amount : Number(walletData.totalExpenses) + amount

        await updateDoc(walletRef, {
            amount: updatedWalletAmount,
            [updateType]: updatedTotals
        })
        return { success: true }
    } catch (error: any) {
        console.log("Error updating wallet for new transaction", error);
        return { success: false, msg: error.message };
    }
}