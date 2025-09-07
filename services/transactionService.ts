import { firestore } from "@/config/firebase";
import { TransactionType, WalletType } from "@/types";
import { collection, deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageService";
import { createOrUpdateWallet } from "./walletService";

export const createOrUpdateTransaction = async (
    transactionData: Partial<TransactionType>): Promise<ResponseType> => {
    try {
        const { id, type, walletId, image, amount } = transactionData
        if (!amount || amount <= 0 || !walletId || !type) {
            return { success: false, msg: "Invalid transaction data" }
        }

        if (id) {
            const oldTransactionSnapshot = await getDoc(doc(firestore, "transactions", id))
            const oldTransaction = oldTransactionSnapshot.data() as TransactionType;
            const shouldRevertOriginal = oldTransaction.type != type || oldTransaction.amount != amount || oldTransaction.walletId != walletId;
            if (shouldRevertOriginal) {
                const repsonse = await revertAndUpdateWallet(oldTransaction, Number(amount), type, walletId)
                if (!repsonse.success) return repsonse;
            }
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
        const cleanTransactionData = Object.fromEntries(
            Object.entries(transactionData).filter(([_, v]) => v !== undefined)
        );

        await setDoc(transactionRef, cleanTransactionData, { merge: true })

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

const revertAndUpdateWallet = async (
    oldTransaction: TransactionType,
    newTransactionAmount: number,
    newTransactionType: string,
    newWalletId: string
) => {
    try {
        if (oldTransaction.walletId === newWalletId && oldTransaction.type === newTransactionType) {
            const walletRef = doc(firestore, "wallets", newWalletId);
            const walletSnapshot = await getDoc(walletRef);
            const wallet = walletSnapshot.data() as WalletType;

            const diff = newTransactionAmount - Number(oldTransaction.amount);

            if (newTransactionType === "expense" && wallet.amount < diff) {
                return { success: false, msg: "Selected wallet doesn't have enough balance" };
            }

            const updateType = newTransactionType === "income" ? "totalIncome" : "totalExpenses";
            const updatedWalletAmount =
                newTransactionType === "income"
                    ? wallet.amount + diff
                    : wallet.amount - diff;

            const updatedIncomeExpense = wallet[updateType] + diff;

            await updateDoc(walletRef, {
                amount: updatedWalletAmount,
                [updateType]: updatedIncomeExpense,
            });

            return { success: true };
        }

        if (oldTransaction.walletId === newWalletId && oldTransaction.type !== newTransactionType) {
            const walletRef = doc(firestore, "wallets", newWalletId);
            const walletSnapshot = await getDoc(walletRef);
            const wallet = walletSnapshot.data() as WalletType;

            let updatedWalletAmount = wallet.amount;
            let updatedIncome = wallet.totalIncome;
            let updatedExpenses = wallet.totalExpenses;

            if (oldTransaction.type === "expense" && newTransactionType === "income") {
                updatedWalletAmount = wallet.amount + oldTransaction.amount;
                updatedExpenses = wallet.totalExpenses - oldTransaction.amount;

                updatedWalletAmount += newTransactionAmount;
                updatedIncome = wallet.totalIncome + newTransactionAmount;
            }
            else if (oldTransaction.type === "income" && newTransactionType === "expense") {
                updatedWalletAmount = wallet.amount - oldTransaction.amount;
                updatedIncome = wallet.totalIncome - oldTransaction.amount;
                updatedWalletAmount -= newTransactionAmount;
                updatedExpenses = wallet.totalExpenses + newTransactionAmount;

                if (updatedWalletAmount < 0) {
                    return { success: false, msg: "Selected wallet doesn't have enough balance" };
                }
            }

            await updateDoc(walletRef, {
                amount: updatedWalletAmount,
                totalIncome: updatedIncome,
                totalExpenses: updatedExpenses,
            });

            return { success: true };
        }

        const originalWalletRef = doc(firestore, "wallets", oldTransaction.walletId);
        const originalWalletSnapshot = await getDoc(originalWalletRef);
        const originalWallet = originalWalletSnapshot.data() as WalletType;

        const revertType = oldTransaction.type === "income" ? "totalIncome" : "totalExpenses";
        const revertedWalletAmount =
            oldTransaction.type === "income"
                ? Number(originalWallet.amount) - Number(oldTransaction.amount)
                : Number(originalWallet.amount) + Number(oldTransaction.amount);

        const revertedIncomeExpenseAmount = Number(originalWallet[revertType]) - Number(oldTransaction.amount);

        await updateDoc(originalWalletRef, {
            amount: revertedWalletAmount,
            [revertType]: revertedIncomeExpenseAmount,
        });

        const newWalletRef = doc(firestore, "wallets", newWalletId);
        const newWalletSnapshot = await getDoc(newWalletRef);
        const newWallet = newWalletSnapshot.data() as WalletType;

        if (newTransactionType === "expense" && Number(newWallet.amount) < newTransactionAmount) {
            return { success: false, msg: "Selected wallet doesn't have enough balance" };
        }

        const updateType = newTransactionType === "income" ? "totalIncome" : "totalExpenses";
        const newWalletAmount =
            newTransactionType === "income"
                ? Number(newWallet.amount) + newTransactionAmount
                : Number(newWallet.amount) - newTransactionAmount;

        const newIncomeExpenseAmount = Number(newWallet[updateType]) + newTransactionAmount;

        await updateDoc(newWalletRef, {
            amount: newWalletAmount,
            [updateType]: newIncomeExpenseAmount,
        });

        return { success: true };
    } catch (error: any) {
        console.log("Error updating transaction", error);
        return { success: false, msg: error.message };
    }
};

export const deleteTransaction = async (
    transactionId: string,
    walletId: string
) => {
    try {
        const transactionRef = doc(firestore, "transactions", transactionId);
        const transactionSnapshot = await getDoc(transactionRef);

        if (!transactionSnapshot.exists()) {
            return { success: false, msg: "Transaction not found" };
        }

        const transactionData = transactionSnapshot.data() as TransactionType;
        const transactionType = transactionData.type;
        const transactionAmount = transactionData.amount;

        const walletRef = doc(firestore, "wallets", walletId);
        const walletSnapshot = await getDoc(walletRef);
        const walletData = walletSnapshot.data() as WalletType;

        const updateType = transactionType === "income" ? "totalIncome" : "totalExpenses";

        const newWalletAmount =
            transactionType === "income"
                ? walletData.amount - transactionAmount
                : walletData.amount + transactionAmount;

        const newIncomeExpenseAmount = walletData[updateType] - transactionAmount;

        if (transactionType === "income" && newWalletAmount < 0) {
            return { success: false, msg: "You cannot delete this transaction" };
        }

        await createOrUpdateWallet({
            id: walletId,
            amount: newWalletAmount,
            [updateType]: newIncomeExpenseAmount,
        });

        await deleteDoc(transactionRef);

        return { success: true };
    } catch (error: any) {
        console.log("Error deleting transaction", error);
        return { success: false, msg: error.message };
    }
};