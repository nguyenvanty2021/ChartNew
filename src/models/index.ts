import moment from "moment";
import { TimeFilters } from "../constants/enum";
export interface DataPointProps {
  x: string;
  y: number;
}
export interface RangeProps {
  type: string;
  count?: number;
  text: string;
}
export interface SizeProps {
  normal: number;
  zoom: number;
}
export interface FormProps<T> {
  pairOfCoin: T;
  timeRange: any;
}
export interface ListWatchedProps {
  coinFrom: string;
  coinTo: string;
  idCoinFrom: string;
  watched: boolean;
  priceCoinFrom: string;
  priceCoinTo: string;
}
export interface TimeRangeProps<T> {
  id: T;
  value: T;
  key: T;
}
export const ListRange: RangeProps[] = [
  {
    type: "day",
    count: 1,
    text: "1d",
  },
  {
    type: "day",
    count: 7,
    text: "7d",
  },
  {
    type: "month",
    count: 1,
    text: "1m",
  },
  {
    type: "month",
    count: 3,
    text: "3m",
  },
  {
    type: "year",
    count: 1,
    text: "1y",
  },
  {
    type: "ytd",
    text: "YTD",
  },
  {
    type: "all",
    text: "ALL",
  },
];
export const listTimeRange: TimeRangeProps<string>[] = [
  {
    id: "1",
    key: "1D",
    value: TimeFilters.P1D,
  },
  {
    id: "2",
    key: "7D",
    value: TimeFilters.P7D,
  },
  {
    id: "3",
    key: "1M",
    value: TimeFilters.P1M,
  },
  {
    id: "4",
    key: "3M",
    value: TimeFilters.P3M,
  },
  {
    id: "5",
    key: "1Y",
    value: TimeFilters.P1Y,
  },
  {
    id: "7",
    key: "YTD",
    value: String(moment().diff(`${moment().get("year")}/01/01`, "days")),
  },
  {
    id: "6",
    key: "ALL",
    value: TimeFilters.ALL,
  },
];
