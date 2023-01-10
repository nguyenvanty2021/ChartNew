import moment from "moment";
export enum TimeFilters {
  P1D = "1",
  P7D = "7",
  P1M = "30",
  P3M = "90",
  P1Y = "365",
  YTD = "",
  ALL = "max",
}
export enum Status {
  SUCCESS = 200,
}
export enum Time {
  DEBOUNCE = 400,
}
export enum Colors {
  BACKGROUND_COLOR = "white",
  LINE_COLOR = "#2962FF",
  TEXT_COLOR = "black",
  COLOR_434348 = "#434348",
  COLOR_7CB5EC = "#7CB5EC",
  AREA_TOP_COLOR = "#2962FF",
  AREA_BOTTOM_COLOR = "rgba(41, 98, 255, 0.28)",
}
export enum Format {
  DATE_TIME = "DD/MM/YYYY HH:MM:ss",
  DATE_TIME_EL = "MM/DD/YYYY HH:MM:ss",
}
export const notifyTime = 1500;
export const TimePeriod: any = {
  "1D": TimeFilters.P1D,
  "7D": TimeFilters.P7D,
  "1M": TimeFilters.P1M,
  "3M": TimeFilters.P3M,
  "1Y": TimeFilters.P1Y,
  YTD: String(moment().diff(`${moment().get("year")}/01/01`, "days")),
  ALL: TimeFilters.ALL,
};
