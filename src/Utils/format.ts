import moment from "moment";
export const formatDateNormal = "DD/MM/YYYY";
export const handleFormatCoin = (coin: number) => {
  return coin < 0.01
    ? 0.000001
    : coin < 0.1
    ? 0.00001
    : coin < 10
    ? 0.0001
    : 0.01;
};
export const handleFormatCoinPriceChart = (coin: number) => {
  return coin < 0.01
    ? "0.######"
    : coin < 0.1
    ? "0.#####"
    : coin < 10
    ? "#,###.####"
    : "#,###.###";
};
export const handleFormatPrice = (price: number) => {
  return price < 0.01 ? 7 : price < 0.1 ? 5 : price < 10 ? 3 : 3;
};
export const formatDate = (time: number, type: string) =>
  moment.unix(time).format(type);
