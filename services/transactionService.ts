import { firestore } from "@/config/firebase";
import { TransactionType, WalletType } from "@/types";
import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, Timestamp, updateDoc, where } from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageService";
import { createOrUpdateWallet } from "./walletService";
import { getLast12Months, getLast7Days, getYearsRange } from "@/utils/common";
import { colors } from "@/constants/theme";
import { scale } from "@/utils/style";

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

export const fetchWeeklyStats = async (
    uid: string
): Promise<ResponseType> => {
    try {
        const db = firestore;
        const today = new Date()
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(today.getDate() - 7)

        const transactionQuery = query(
            collection(db, "transactions"),
            where("date", ">=", Timestamp.fromDate(sevenDaysAgo)),
            where("date", "<=", Timestamp.fromDate(today)),
            orderBy("date", "desc"),
            where("uid", "==", uid)
        )

        const querySnapshot = await getDocs(transactionQuery)
        const weeklyData = getLast7Days()
        const transactions: TransactionType[] = []

        querySnapshot.forEach((doc) => {
            const transaction = doc.data() as TransactionType
            transaction.id = doc.id;
            transactions.push(transaction)

            const transactionDate = (transaction.date as Timestamp).toDate().toISOString().split("T")[0]
            const dayDate = weeklyData.find((day) => day.date == transactionDate)

            if (dayDate) {
                if (transaction.type == "income") {
                    dayDate.income += transaction.amount;
                }
                else if (transaction.type == "expense") {
                    dayDate.expense += transaction.amount
                }
            }
        })

        const stats = weeklyData.flatMap((day) => [
            { value: day.income, label: day.day, spacing: scale(4), labelWidth: scale(30), frontColor: colors.primary },
            { value: day.expense, frontColor: colors.rose },
        ])

        return { success: true, data: { stats, transactions } };

    } catch (error: any) {
        console.log("Error fetching weekly statistics", error);
        return { success: false, msg: error.message };
    }
};


export const fetchMonthlyStats = async (
    uid: string
): Promise<ResponseType> => {
    try {
        const db = firestore;
        const today = new Date()
        const twelveMonthsAgo = new Date(today)
        twelveMonthsAgo.setDate(today.getMonth() - 12)

        const transactionQuery = query(
            collection(db, "transactions"),
            where("date", ">=", Timestamp.fromDate(twelveMonthsAgo)),
            where("date", "<=", Timestamp.fromDate(today)),
            orderBy("date", "desc"),
            where("uid", "==", uid)
        )

        const querySnapshot = await getDocs(transactionQuery)
        const monthlyData = getLast12Months()
        const transactions: TransactionType[] = []

        querySnapshot.forEach((doc) => {
            const transaction = doc.data() as TransactionType
            transaction.id = doc.id;
            transactions.push(transaction)

            const transactionDate = (transaction.date as Timestamp).toDate()
            const monthName = transactionDate.toLocaleString("default", { month: "short" })
            const shortYear = transactionDate.getFullYear().toString().slice(-2)
            const monthData = monthlyData.find((month) => month.month === `${monthName} ${shortYear}`)

            if (monthData) {
                if (transaction.type == "income") {
                    monthData.income += transaction.amount;
                }
                else if (transaction.type == "expense") {
                    monthData.expense += transaction.amount
                }
            }
        })

        const stats = monthlyData.flatMap((month) => [
            { value: month.income, label: month.month, spacing: scale(4), labelWidth: scale(30), frontColor: colors.primary },
            { value: month.expense, frontColor: colors.rose },
        ])

        return { success: true, data: { stats, transactions } };

    } catch (error: any) {
        console.log("Error fetching monthly statistics", error);
        return { success: false, msg: error.message };
    }
};


export const fetchYearlyStats = async (
    uid: string
): Promise<ResponseType> => {
    try {
        const db = firestore;
        const transactionQuery = query(
            collection(db, "transactions"),
            orderBy("date", "desc"),
            where("uid", "==", uid)
        )

        const querySnapshot = await getDocs(transactionQuery)
        const transactions: TransactionType[] = []

        const firstTransaction = querySnapshot.docs.reduce((earliest, doc) => {
            const transactionDate = doc.data().date.toDate()
            return transactionDate < earliest ? transactionDate : earliest;
        }, new Date())

        const firstYear = firstTransaction.getFullYear()
        const currentYear = new Date().getFullYear()

        const yearlyData = getYearsRange(firstYear, currentYear)


        querySnapshot.forEach((doc) => {
            const transaction = doc.data() as TransactionType
            transaction.id = doc.id;
            transactions.push(transaction)

            const transactionYear = (transaction.date as Timestamp).toDate().getFullYear()
            const yearData = yearlyData.find((year: any) => year.year === transactionYear.toString())

            if (yearData) {
                if (transaction.type == "income") {
                    yearData.income += transaction.amount;
                }
                else if (transaction.type == "expense") {
                    yearData.expense += transaction.amount
                }
            }
        })

        const stats = yearlyData.flatMap((year: any) => [
            { value: year.income, label: year.year, spacing: scale(4), labelWidth: scale(30), frontColor: colors.primary },
            { value: year.expense, frontColor: colors.rose },
        ])
        return { success: true, data: { stats, transactions } };

    } catch (error: any) {
        console.log("Error fetching yearly statistics", error);
        return { success: false, msg: error.message };
    }
};