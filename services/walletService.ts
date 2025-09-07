import { WalletType } from "@/types";
import { uploadFileToCloudinary } from "./imageService";
import { collection, deleteDoc, doc, getDocs, query, setDoc, where, writeBatch } from "firebase/firestore";
import { firestore } from "@/config/firebase";

export const createOrUpdateWallet = async (
    walletData: Partial<WalletType>
): Promise<ResponseType> => {
    try {
        let walletToSave: any = { ...walletData };

        if (walletData.image && typeof walletData.image !== "string") {
            const imageUploadRes = await uploadFileToCloudinary(walletData.image, "wallets");
            if (!imageUploadRes.success) {
                return { success: false, msg: imageUploadRes.msg };
            }
            walletToSave.image = imageUploadRes.data;
        }

        if (!walletData?.id) {
            walletToSave = {
                ...walletData,
                ...walletToSave,
                amount: 0,
                totalExpenses: 0,
                totalIncome: 0,
                created: new Date(),
            };
        }

        Object.keys(walletToSave).forEach((key) => {
            if (walletToSave[key] === undefined) delete walletToSave[key];
            if (walletToSave[key] instanceof File || walletToSave[key] instanceof Blob) {
                delete walletToSave[key];
            }
        });

        const walletRef = walletData?.id
            ? doc(firestore, "wallets", walletData.id)
            : doc(collection(firestore, "wallets"));

        await setDoc(walletRef, walletToSave, { merge: true });

        return { success: true, data: { ...walletToSave, id: walletRef.id } };
    } catch (error: any) {
        console.log("Error creating or updating wallet:", error);
        return { success: false, msg: error.message };
    }
};

export const deleteWallet = async (walletId: string): Promise<ResponseType> => {
    try {
        const walletRef = doc(firestore, "wallets", walletId)
        await deleteDoc(walletRef);
        deleteTransactionsByWalletId(walletId);
        return { success: true, msg: "Wallet deleted successfully" }
    } catch (error: any) {
        console.log("Error deleting wallet:", error);
        return { success: false, msg: error.message };
    }
}

export const deleteTransactionsByWalletId = async (walletId: string): Promise<ResponseType> => {
    try {
        let hasMoreTransactions = true
        while (hasMoreTransactions) {
            const transactionQuery = query(collection(firestore, "transactions"),
                where("walletId", "==", walletId)
            );

            const transactionSnapshot = await getDocs(transactionQuery);
            if (transactionSnapshot.size == 0) {
                hasMoreTransactions = false;
                break;
            }

            const batch = writeBatch(firestore)
            transactionSnapshot.forEach((transactionDoc) => {
                batch.delete(transactionDoc.ref);
            })
            await batch.commit();
        }
        return { success: true, msg: "All transactions related to this wallet deleted successfully" }
    } catch (error: any) {
        console.log("Error deleting wallet:", error);
        return { success: false, msg: error.message };
    }
}