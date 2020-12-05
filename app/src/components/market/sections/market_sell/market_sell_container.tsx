import React from 'react'

import { MarketMakerData } from '../../../../util/types'

import { MarketSell } from './market_sell'
import { ScalarMarketSell } from './scalar_market_sell'

interface Props {
  isScalar: boolean
  marketMakerData: MarketMakerData
  switchMarketTab: (arg0: string) => void
  fetchGraphMarketMakerData: () => Promise<void>
  fetchGraphMarketTradeData?: () => Promise<void> | undefined
}

const MarketSellContainer: React.FC<Props> = (props: Props) => {
  const { isScalar } = props

  if (isScalar) return <ScalarMarketSell {...props} />
  return <MarketSell {...props} />
}

export { MarketSellContainer }
