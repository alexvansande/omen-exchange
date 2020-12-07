import { BigNumber } from 'ethers/utils'
import React, { useEffect, useRef, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import styled from 'styled-components'

import { formatBigNumber, formatNumber } from '../../../../util/tools'
import { BalanceItem, Status, Token, TradeObject } from '../../../../util/types'
import { PositionTable } from '../position_table'

const SCALE_HEIGHT = '20px'
const BAR_WIDTH = '2px'
const BALL_SIZE = '20px'
const DOT_SIZE = '8px'
const VALUE_BOXES_MARGIN = '12px'

const ScaleWrapper = styled.div<{ borderBottom: boolean | undefined; borderTop: boolean | undefined }>`
  display: flex;
  flex-direction: column;
  height: 174px;
  border-bottom: ${props => (!props.borderBottom ? 'none' : `1px solid ${props.theme.scale.bar}`)};
  margin-left: -25px;
  margin-right: -25px;
  padding-left: 25px;
  padding-right: 25px;
  position: relative;
  ${props => props.borderTop && `border-top: 1px solid ${props.theme.scale.border}; padding-top: 24px; height: 202px;`};
`

const ScaleTitleWrapper = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  margin-top: 5px;
  margin-bottom: 18px;
`

const ScaleTitle = styled.p`
  font-size: 14px;
  color: ${props => props.theme.colors.textColor};
  margin: 0;
`

const Scale = styled.div`
  position: relative;
  height: ${SCALE_HEIGHT};
  width: 100%;
`

const VerticalBar = styled.div<{ position: number; positive: Maybe<boolean> }>`
  position: absolute;
  top: 0;
  bottom: 0;
  width: ${BAR_WIDTH};
  height: ${SCALE_HEIGHT};

  ${props => (props.position === 0 ? 'left: 0;' : props.position === 1 ? 'left: calc(50% - 1px);' : 'right: 0;')}
  background: ${props =>
    props.positive
      ? `${props.theme.scale.positive}`
      : props.positive === null
      ? `${props.theme.scale.bar}`
      : `${props.theme.scale.negative}`};
`

const HorizontalBar = styled.div`
  position: absolute;
  top: calc(50% - ${BAR_WIDTH} / 2);
  left: 0;
  right: 0;
  width: 100%
  height: ${BAR_WIDTH};
  background: ${props => props.theme.scale.bar};
`

const HorizontalBarLeft = styled.div<{ positive: boolean | null; width: number }>`
  position: absolute;
  top: calc(50% - ${BAR_WIDTH} / 2);
  left: 0;
  width: ${props => props.width * 100}%;
  background: ${props => (props.positive ? `${props.theme.scale.positive}` : `${props.theme.scale.negative}`)};
  height: ${BAR_WIDTH};
  z-index: 2;
`

const HorizontalBarRight = styled.div<{ positive: boolean | null; width: number }>`
  position: absolute;
  top: calc(50% - ${BAR_WIDTH} / 2);
  right: 0;
  width: ${props => props.width * 100}%;
  background: ${props => (props.positive ? `${props.theme.scale.positive}` : `${props.theme.scale.negative}`)};
  height: ${BAR_WIDTH};
  z-index: 2;
`

const ScaleBallContainer = styled.div`
  width: 100%;
`

const ScaleBall = styled.input`
  height: ${SCALE_HEIGHT};
  width: calc(100% + ${BALL_SIZE});
  background: none;
  outline: none;
  -webkit-appearance: none;
  z-index: 4;
  position: absolute;
  left: calc(-${BALL_SIZE} / 2);
  right: calc(-${BALL_SIZE} / 2);

  &::-webkit-slider-thumb {
    appearance: none;
    height: ${BALL_SIZE};
    width: ${BALL_SIZE};
    border-radius: 50%;
    border: 3px solid ${props => props.theme.scale.ballBorder};
    background: ${props => props.theme.scale.ballBackground};
    cursor: pointer;
  }

  &::-moz-range-thumb {
    height: ${BALL_SIZE};
    width: ${BALL_SIZE};
    border-radius: 50%;
    border: 3px solid ${props => props.theme.scale.ballBorder};
    background: ${props => props.theme.scale.ballBackground};
    cursor: pointer;
  }
`

const ScaleDot = styled.div<{ xValue: number; positive: Maybe<boolean> }>`
  position: absolute;
  height: ${DOT_SIZE};
  width: ${DOT_SIZE};
  background: ${props => (props.positive ? `${props.theme.scale.positive}` : `${props.theme.scale.negative}`)};
  border-radius: 50%;
  z-index: 3;
  left: ${props => props.xValue * 100}%;
  transform: translateX(-50%);
  margin-top: calc((${SCALE_HEIGHT} - ${DOT_SIZE}) / 2);
`

const ValueBoxes = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: ${VALUE_BOXES_MARGIN};
  width: 100%;
`

const ValueBoxPair = styled.div`
  width: calc(50% - ${VALUE_BOXES_MARGIN} / 2);
  display: flex;
  align-items: center;
`

const ValueBox = styled.div<{ xValue?: number }>`
  padding: 12px;
  border: 1px solid ${props => props.theme.scale.box};
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 50%;
  background: white;

  &:nth-of-type(odd) {
    border-top-right-radius: 0px;
    border-bottom-right-radius: 0px;
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }
  &:nth-of-type(even) {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
  }
`

const ValueBoxRegular = styled.div<{ xValue?: number }>`
  padding: 12px;
  border: 1px solid ${props => props.theme.scale.box};
  display: flex;
  flex-direction: column;
  align-items: center;
  ${props =>
    props.xValue
      ? props.xValue <= 0.885
        ? `left: ${
            props.xValue <= 0.115
              ? `0`
              : props.xValue <= 0.885
              ? `${props.xValue * 100}%; transform: translateX(-50%);`
              : ``
          }`
        : `right: 0;`
      : ''}
  background: white;
  position: absolute;
  top: calc(${SCALE_HEIGHT} + ${VALUE_BOXES_MARGIN});
  border-radius: 4px;
`

const ValueBoxTitle = styled.p<{ positive?: boolean | undefined }>`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors.textColorDarker};
  margin-bottom: 2px;
  margin-top: 0;
  color: ${props =>
    props.positive ? props.theme.scale.positiveText : props.positive === false ? props.theme.scale.negativeText : ''};
`

const ValueBoxSubtitle = styled.p`
  font-size: 14px;
  color: ${props => props.theme.colors.textColor};
  margin: 0;
  white-space: nowrap;
`

interface Props {
  lowerBound: BigNumber
  startingPoint?: Maybe<BigNumber>
  unit: string
  upperBound: BigNumber
  startingPointTitle: string
  currentPrediction?: Maybe<string>
  borderBottom?: boolean
  borderTop?: boolean
  newPrediction?: Maybe<number>
  long?: Maybe<boolean>
  potentialLoss?: Maybe<BigNumber>
  potentialProfit?: Maybe<BigNumber>
  collateral?: Maybe<Token>
  amount?: Maybe<BigNumber>
  positionTable?: Maybe<boolean>
  trades?: Maybe<TradeObject[]>
  status?: Maybe<Status>
  balances?: Maybe<BalanceItem[]>
  fee?: Maybe<BigNumber>
}

export const MarketScale: React.FC<Props> = (props: Props) => {
  const {
    amount,
    balances,
    borderBottom,
    borderTop,
    collateral,
    currentPrediction,
    fee,
    long,
    lowerBound,
    newPrediction,
    positionTable,
    potentialLoss,
    potentialProfit,
    startingPoint,
    startingPointTitle,
    status,
    trades,
    unit,
    upperBound,
  } = props

  const decimals = 18

  const lowerBoundNumber = lowerBound && Number(formatBigNumber(lowerBound, decimals))
  const upperBoundNumber = upperBound && Number(formatBigNumber(upperBound, decimals))
  const startingPointNumber = startingPoint && Number(formatBigNumber(startingPoint || new BigNumber(0), decimals))

  const currentPredictionNumber = Number(currentPrediction) * (upperBoundNumber - lowerBoundNumber) + lowerBoundNumber
  const newPredictionNumber = Number(newPrediction) * (upperBoundNumber - lowerBoundNumber) + lowerBoundNumber

  const potentialProfitNumber =
    collateral && Number(formatBigNumber(potentialProfit || new BigNumber(0), collateral.decimals))
  const potentialLossNumber =
    collateral && Number(formatBigNumber(potentialLoss || new BigNumber(0), collateral.decimals))

  const amountNumber = collateral && Number(formatBigNumber(amount || new BigNumber(0), collateral.decimals))

  const [isAmountInputted, setIsAmountInputted] = useState(false)

  const initialMount = useRef(true)
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false
      return
    }
    setIsAmountInputted(newPrediction ? newPrediction !== Number(currentPrediction) : false)
  }, [newPrediction, currentPrediction])

  useEffect(() => {
    setScaleValue(
      newPrediction
        ? newPrediction * 100
        : currentPrediction
        ? Number(currentPrediction) * 100
        : (((startingPointNumber || 0) - lowerBoundNumber) / (upperBoundNumber - lowerBoundNumber)) * 100,
    )
    newPrediction &&
      setScaleValuePrediction(Number(newPrediction) * (upperBoundNumber - lowerBoundNumber) + lowerBoundNumber)
  }, [newPrediction, currentPrediction, lowerBoundNumber, startingPointNumber, upperBoundNumber])

  const [scaleValue, setScaleValue] = useState<number | undefined>(
    newPrediction
      ? newPrediction * 100
      : currentPrediction
      ? Number(currentPrediction) * 100
      : (((startingPointNumber || 0) - lowerBoundNumber) / (upperBoundNumber - lowerBoundNumber)) * 100,
  )
  const [scaleValuePrediction, setScaleValuePrediction] = useState(
    newPredictionNumber ? newPredictionNumber : currentPredictionNumber,
  )
  const [yourPayout, setYourPayout] = useState(0)
  const [profitLoss, setProfitLoss] = useState(0)

  const scaleBall: Maybe<HTMLInputElement> = document.querySelector('.scale-ball')
  const handleScaleBallChange = () => {
    setScaleValue(Number(scaleBall?.value))
    setScaleValuePrediction((Number(scaleBall?.value) / 100) * (upperBoundNumber - lowerBoundNumber) + lowerBoundNumber)
    ReactTooltip.rebuild()
  }

  useEffect(() => {
    if (!positionTable) {
      let positionValue
      if (long) {
        if (scaleValuePrediction > newPredictionNumber) {
          positionValue = (scaleValuePrediction - newPredictionNumber) / (upperBoundNumber - newPredictionNumber)
          setYourPayout(positionValue * (potentialProfitNumber || 0))
          setProfitLoss(((positionValue * (potentialProfitNumber || 0)) / (amountNumber || 0)) * 100)
        } else {
          positionValue = -(scaleValuePrediction - newPredictionNumber) / (lowerBoundNumber - newPredictionNumber)
          setYourPayout(
            positionValue * (potentialLossNumber || 0) < -(amountNumber || 0)
              ? -(amountNumber || 0)
              : positionValue * (potentialLossNumber || 0),
          )
          setProfitLoss(
            -(-(positionValue * (potentialLossNumber || 0)) / (amountNumber || 0)) * 100 < -100
              ? -100
              : -(-(positionValue * (potentialLossNumber || 0)) / (amountNumber || 0)) * 100,
          )
        }
      } else {
        if (scaleValuePrediction <= newPredictionNumber) {
          positionValue = (newPredictionNumber - scaleValuePrediction) / (newPredictionNumber - lowerBoundNumber)
          setYourPayout(positionValue * (potentialProfitNumber || 0))
          setProfitLoss(((positionValue * (potentialProfitNumber || 0)) / (amountNumber || 0)) * 100)
        } else {
          positionValue = -(scaleValuePrediction - newPredictionNumber) / (upperBoundNumber - newPredictionNumber)
          setYourPayout(
            positionValue * (potentialLossNumber || 0) < -(amountNumber || 0)
              ? -(amountNumber || 0)
              : positionValue * (potentialLossNumber || 0),
          )
          setProfitLoss(
            -(-(positionValue * (potentialLossNumber || 0)) / (amountNumber || 0)) * 100 < -100
              ? -100
              : -(-(positionValue * (potentialLossNumber || 0)) / (amountNumber || 0)) * 100,
          )
        }
      }
    }
  }, [
    scaleValuePrediction,
    amountNumber,
    long,
    lowerBoundNumber,
    newPredictionNumber,
    potentialLossNumber,
    potentialProfitNumber,
    upperBoundNumber,
    positionTable,
  ])

  console.log(balances?.map(balance => balance.holdings))

  return (
    <>
      <ScaleWrapper borderBottom={borderBottom} borderTop={borderTop}>
        <ScaleTitleWrapper>
          <ScaleTitle>
            {formatNumber(lowerBoundNumber.toString())} {unit}
          </ScaleTitle>
          <ScaleTitle>
            {formatNumber(`${upperBoundNumber / 2 + lowerBoundNumber / 2}`)}
            {` ${unit}`}
          </ScaleTitle>
          <ScaleTitle>
            {upperBound && formatBigNumber(upperBound, decimals)} {unit}
          </ScaleTitle>
        </ScaleTitleWrapper>
        <Scale>
          <ScaleBallContainer>
            <ReactTooltip
              className="scalarValueTooltip"
              effect="float"
              getContent={() => `${formatNumber(scaleValuePrediction.toString())} ${unit}`}
              id="scalarTooltip"
              offset={{ top: 10 }}
              place="top"
              type="light"
            />
            <ScaleBall
              className="scale-ball"
              data-for="scalarTooltip"
              data-tip={`${formatNumber(scaleValuePrediction.toString())} ${unit}`}
              disabled={!isAmountInputted && !positionTable}
              max="100"
              min="0"
              onChange={handleScaleBallChange}
              type="range"
              value={scaleValue}
            />
          </ScaleBallContainer>
          {isAmountInputted && (
            <>
              <ScaleDot
                positive={
                  (long && (newPrediction || 0) <= Number(currentPrediction)) ||
                  (!long && (newPrediction || 0) >= Number(currentPrediction))
                }
                xValue={Number(currentPrediction)}
              />
              <ScaleDot positive={true} xValue={newPrediction || 0} />
            </>
          )}
          <VerticalBar position={0} positive={isAmountInputted ? !long : null} />
          <VerticalBar
            position={1}
            positive={
              isAmountInputted ? (long && (newPrediction || 0) <= 0.5) || (!long && (newPrediction || 0) >= 0.5) : null
            }
          />
          <VerticalBar position={2} positive={isAmountInputted ? !!long : null} />
          <HorizontalBar />
          {isAmountInputted && (
            <>
              <HorizontalBarLeft positive={!long || null} width={newPrediction || 0} />
              <HorizontalBarRight positive={long || null} width={1 - (newPrediction || 0)} />
            </>
          )}
          {!isAmountInputted && (
            <ValueBoxRegular
              xValue={
                currentPrediction
                  ? Number(currentPrediction)
                  : (Number(startingPoint) - Number(lowerBound)) / (Number(upperBound) - Number(lowerBound))
              }
            >
              <ValueBoxTitle>
                {currentPrediction
                  ? formatNumber(currentPredictionNumber.toString())
                  : startingPoint && startingPointNumber}
                {` ${unit}`}
              </ValueBoxTitle>
              <ValueBoxSubtitle>{startingPointTitle}</ValueBoxSubtitle>
            </ValueBoxRegular>
          )}
        </Scale>
        {isAmountInputted && (
          <ValueBoxes>
            <ValueBoxPair>
              <ValueBox>
                <ValueBoxTitle>
                  {formatNumber(currentPredictionNumber.toString())} {unit}
                </ValueBoxTitle>
                <ValueBoxSubtitle>Current Prediction</ValueBoxSubtitle>
              </ValueBox>
              <ValueBox>
                <ValueBoxTitle>
                  {formatNumber(scaleValuePrediction.toString())} {unit}
                </ValueBoxTitle>
                <ValueBoxSubtitle>New Prediction</ValueBoxSubtitle>
              </ValueBox>
            </ValueBoxPair>
            <ValueBoxPair>
              <ValueBox>
                <ValueBoxTitle positive={yourPayout > 0 ? true : yourPayout < 0 ? false : undefined}>{`${formatNumber(
                  yourPayout.toString(),
                )} ${collateral && collateral.symbol}`}</ValueBoxTitle>
                <ValueBoxSubtitle>Your Payout</ValueBoxSubtitle>
              </ValueBox>
              <ValueBox>
                <ValueBoxTitle positive={profitLoss > 0 ? true : profitLoss < 0 ? false : undefined}>{`${formatNumber(
                  profitLoss ? profitLoss.toString() : '0',
                )}%`}</ValueBoxTitle>
                <ValueBoxSubtitle>Profit/Loss</ValueBoxSubtitle>
              </ValueBox>
            </ValueBoxPair>
          </ValueBoxes>
        )}
      </ScaleWrapper>
      {positionTable &&
        status === Status.Ready &&
        trades &&
        balances &&
        currentPrediction &&
        collateral &&
        !!trades.length && (
          <PositionTable
            balances={balances}
            collateral={collateral}
            currentPrediction={
              scaleValue || scaleValue === 0
                ? (scaleValue / 100 === 0 ? 0.0001 : scaleValue / 100).toString()
                : currentPrediction
            }
            fee={fee}
            trades={trades}
          />
        )}
    </>
  )
}
