import { Model } from './Dynamo'
// 道具状态枚举
export const ToolStatusEnum = {
  Enable: 1,
  Disable: 0
}
// 道具包状态枚举
export const PackageStatusEnum = {
  Enable: 1,
  Disable: 0
}
// 展位状态枚举
export const SeatStatusEnum = {
  Enable: 1,
  Disable: 0,
  Promotion: 2
}
// 展位类型枚举
export const SeatTypeEnum = {
  '1': '钻石展位',
  '2': '道具展位'
}
// 展位内容类型枚举
export const SeatContentTypeEnum = {
  '1': '道具',
  '2': '礼包'
}