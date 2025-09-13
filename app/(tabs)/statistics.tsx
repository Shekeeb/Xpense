import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { act, useEffect, useState } from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { scale, verticalScale } from '@/utils/style'
import Header from '@/components/Header'
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { BarChart } from "react-native-gifted-charts";
import Loading from '@/components/Loading'
import { useAuth } from '@/contexts/authContext'
import { fetchMonthlyStats, fetchWeeklyStats, fetchYearlyStats } from '@/services/transactionService'
import TransactionList from '@/components/TransactionList'

const statistics = () => {

  const [activeIndex, setActiveIndex] = useState(0)
  const [chartData, setChartData] = useState<any[]>([])
  const [chartLoading, setChartLoading] = useState(false)
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    if (activeIndex === 0) {
      getWeeklyStats();
    } else if (activeIndex === 1) {
      getMonthlyStats();
    } else if (activeIndex === 2) {
      getYearlyStats();
    }
  }, [activeIndex]);

  const getWeeklyStats = async () => {
    setChartLoading(true)
    let response = await fetchWeeklyStats(user?.uid as string)
    setChartLoading(false)
    if (response.success) {
      setChartData(response?.data?.stats)
      setTransactions(response?.data?.transactions)
    }
    else {
      Alert.alert("Error", response.msg)
    }
  }

  const getMonthlyStats = async () => {
    setChartLoading(true)
    let response = await fetchMonthlyStats(user?.uid as string)
    setChartLoading(false)
    if (response.success) {
      setChartData(response?.data?.stats)
      setTransactions(response?.data?.transactions)
    }
    else {
      Alert.alert("Error", response.msg)
    }
  }

  const getYearlyStats = async () => {
    setChartLoading(true)
    let response = await fetchYearlyStats(user?.uid as string)
    setChartLoading(false)
    if (response.success) {
      setChartData(response?.data?.stats)
      setTransactions(response?.data?.transactions)
    }
    else {
      Alert.alert("Error", response.msg)
    }
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Header title='Statistics' />
        </View>

        <ScrollView contentContainerStyle={{ gap: spacingY._20, paddingTop: spacingY._5, paddingBottom: verticalScale(100) }} showsVerticalScrollIndicator={false}>
          <SegmentedControl
            values={['Weekly', 'Monthly', 'Yearly']}
            selectedIndex={activeIndex}
            onChange={(event) => {
              setActiveIndex(event.nativeEvent.selectedSegmentIndex)
            }}
            tintColor={colors.neutral200} backgroundColor={colors.neutral800} activeFontStyle={styles.segmentFontStyle} fontStyle={{ ...styles.segmentFontStyle, color: colors.white }} appearance='dark' style={styles.segmentStyle}
          />
          <View style={styles.chartContainer}>
            {
              chartData.length > 0 ? (
                <BarChart data={chartData}
                  barWidth={scale(12)}
                  spacing={[1, 2].includes(activeIndex) ? scale(25) : scale(16)}
                  roundedTop
                  roundedBottom
                  hideRules
                  yAxisLabelPrefix='₹'
                  xAxisThickness={0}
                  yAxisThickness={0}
                  yAxisLabelWidth={[1, 2].includes(activeIndex) ? scale(38) : scale(35)}
                  yAxisTextStyle={{ color: colors.neutral350 }}
                  xAxisLabelTextStyle={{ color: colors.neutral350, fontSize: verticalScale(12) }}
                  noOfSections={3}
                  minHeight={5}
                />
              ) : (
                <View style={styles.noChart} />
              )
            }
            {
              chartLoading && (
                <View style={styles.chartLoadingContainer}>
                  <Loading color={colors.white} />
                </View>
              )
            }
          </View>

          <View>
            <TransactionList title='Transaction' emptyListMessage='No Transactions' data={transactions} />
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  )
}

export default statistics

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._5,
    gap: spacingY._10
  },
  segmentFontStyle: {
    fontSize: verticalScale(13),
    fontWeight: "bold",
    color: colors.black
  },
  segmentStyle: {
    height: scale(37)
  },
  searchIcon: {
    backgroundColor: colors.neutral700,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    height: verticalScale(35),
    width: verticalScale(35),
    borderCurve: "continuous"
  },
  noChart: {
    backgroundColor: "rgba(0,0,0,0.6)",
    height: verticalScale(210)
  },
  header: {

  },
  chartLoadingContainer: {
    backgroundColor: "rgba(0,0,0,0.6)",
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: radius._12
  },
  chartContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center"
  }
})