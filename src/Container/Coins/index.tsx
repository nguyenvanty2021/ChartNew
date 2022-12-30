import { Dropdown, MenuProps } from "antd";
import expand from "./../../Assets/img/expand.png";
import noExpand from "./../../Assets/img/noExpand.png";
import { useReactToPrint } from "react-to-print";
import styles from "./styles.module.scss";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { useScreenshot, createFileName } from "use-react-screenshot";
import {
  createRef,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import coinApi from "../../Api/coinApi";
import {
  handleFormatCoinPrice,
  ListWatchedProps,
  notifyTime,
  TimePeriod,
} from "../../App";
import { Status, TimeFilters } from "../../Constants/enum";
import { createChart, ColorType } from "lightweight-charts";
import { getQueryParam } from "../../Utils/query";
import Loading from "../../Components/Loading";
import { useParams } from "react-router-dom";
import { notify } from "../../Utils/notification";
import numeral from "numeral";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import CanvasJSReact from "./../../Assets/canvasjs.stock.react";
import Highcharts from "highcharts/highstock";
import HighchartsReact from "highcharts-react-official";
import dataJson from "./../../Api/market_dominance_data.json";
import exporting from "highcharts/modules/exporting.js";
exporting(Highcharts);
const CanvasJSStockChart = CanvasJSReact.CanvasJSStockChart;
const formatDateNormal = "DD/MM/YYYY";
const handleFormatCoin = (coin: number) => {
  return coin < 0.01
    ? 0.000001
    : coin < 0.1
    ? 0.00001
    : coin < 10
    ? 0.0001
    : 0.01;
};
const handleFormatCoinPriceChart = (coin: number) => {
  return coin < 0.01
    ? "0.######"
    : coin < 0.1
    ? "0.#####"
    : coin < 10
    ? "#,###.####"
    : "#,###.###";
};
export const timeDebounce = 400;
export function debounce(fn: any, wait?: number) {
  let timerId: any, lastArguments: any, lastThis: any;
  return (...args: any) => {
    timerId && clearTimeout(timerId);
    lastArguments = args;
    //@ts-ignore
    lastThis = this;
    timerId = setTimeout(function () {
      fn.apply(lastThis, lastArguments);
      timerId = null;
    }, wait || timeDebounce);
  };
}
const formatDate = (time: number, type: string) =>
  moment.unix(time).format(type);
const ChartComponent = (props: any) => {
  const { data, range, heightDefault, title, type } = props;
  const colors: any = {
    backgroundColor: "white",
    lineColor: "#2962FF",
    textColor: "black",
    areaTopColor: "#2962FF",
    areaBottomColor: "rgba(41, 98, 255, 0.28)",
  };
  const chartContainerRef: any = useRef();
  const priceFirst = data[0].value;
  useEffect(() => {
    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    };
    const element: any = document.getElementById("container");
    const chart: any = createChart(element, {
      layout: {
        background: { type: ColorType.Solid, color: colors.backgroundColor },
        textColor: colors.textColor,
      },
      handleScroll: false,
      handleScale: false,
      rightPriceScale: {
        // invertScale: true,
        borderVisible: false,
        // scaleMargins: {
        //   top: 0.3,
        //   bottom: 0.25,
        // },
        visible: false,
      },

      leftPriceScale: {
        scaleMargins: {
          top: 0.3, // leave some space for the legend
          bottom: 0.25,
        },
        visible: true,
        borderVisible: false,
      },
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          visible: true,
        },
      },

      timeScale: {
        visible: type === "bottom" ? true : false,
        // timeVisible: false,
        // secondsVisible: false,
        tickMarkFormatter: (time: any) => {
          return range !== "1D"
            ? formatDate(time, formatDateNormal)
            : data[0].time === time || data[data.length - 1].time === time
            ? formatDate(time, "DD/MM/YYYY HH:MM:ss")
            : new Date(
                dateToString(time, "MM/DD/YYYY HH:MM:ss")
              ).toLocaleString("en-US", {
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                hour12: true,
              });
        },
      },

      width: chartContainerRef.current.clientWidth,
      height: type === "above" ? heightDefault : 70,
    });
    chart.timeScale().fitContent();
    //  addLineSeries addAreaSeries

    let newSeries = chart.addAreaSeries({
      // autoScale: false, // disables auto scaling based on visible content
      priceFormat: {
        type: "price",
        precision: data?.length > 0 ? handleFormatCoinPrice(priceFirst) : 0,
        minMove: handleFormatCoin(priceFirst),
      },
      // handleScale: {
      //   priceAxisPressedMouseMove: true,
      //   timeAxisPressedMouseMove: true,
      // },

      // priceScale: {
      //   autoScale: false,
      // },
      lineWidth: 2,
      // price: 1234,
      // lastValueVisible: false,
      // priceLineVisible: false,
      crossHairMarkerVisible: true,
      lineColor: colors.lineColor,
      topColor: colors.areaTopColor,
      bottomColor: colors.areaBottomColor,
      // axisLabelVisible: true,
      // title: "my label",
    });
    type === "above" && title.marketCap && newSeries.setData(data);
    const volumeSeries = chart.addHistogramSeries({
      color: "black",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "", // set as an overlay by setting a blank priceScaleId
      // set the positioning of the volume series
      lastValueVisible: false,
      scaleMargins: {
        top: 0.875, // highest point of the series will be 70% away from the top
        bottom: 0,
      },
    });
    volumeSeries.applyOptions({
      scaleMargins: {
        // top: 0.875, // highest point of the series will be 70% away from the top
        // bottom: 0, // lowest point will be at the very bottom.
        top: 0.1, // highest point of the series will be 10% away from the top
        bottom: 0, // lowest point will be 40% away from the bottom
      },
    });
    type === "bottom" && title.vol && volumeSeries.setData(data);
    const container: any = document.getElementById("container");
    function dateToString(date: any, type: string) {
      const dateString = moment.unix(date).format(type);
      return dateString;
    }
    const toolTipWidth = -60;
    const toolTipHeight = -100;
    const toolTipMargin = 150;
    // Create and style the tooltip html element
    const toolTip: any = document.createElement("div");
    toolTip.style = `width: 200px; height: 95px; position: absolute; display: none; padding: 8px; box-sizing: border-box; font-size: 12px; text-align: left; z-index: 1000; top: 12px; left: 12px; pointer-events: none; border: 1px solid; border-radius: 2px;font-family: 'Trebuchet MS', Roboto, Ubuntu, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`;
    toolTip.style.background = "white";
    toolTip.style.color = "black";
    toolTip.style.borderColor = "#BCBDBC";
    container.appendChild(toolTip);
    // update tooltip
    type === "above" &&
      chart.subscribeCrosshairMove((param: any) => {
        if (
          param.point === undefined ||
          !param.time ||
          param.point.x < 0 ||
          param.point.x > container.clientWidth ||
          param.point.y < 0 ||
          param.point.y > container.clientHeight
        ) {
          toolTip.style.display = "none";
        } else {
          toolTip.style.display = "block";
          const price = param.seriesPrices.get(newSeries);
          toolTip.innerHTML = `<div style="display:flex; justify-content:space-between;" >
          <b style="font-size:0.85rem;color:black;" >${dateToString(
            param.time,
            formatDateNormal
          )}</b>
          <b style="color: #A0A7B5;font-size: 0.75rem;" >${new Date(
            dateToString(param.time, "MM/DD/YYYY HH:MM:ss")
          ).toLocaleString("en-US", {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: true,
          })}</b>
        </div>
        <div style="display:flex;margin: 4px 0px;justify-content:flex-start;align-items:center;">
        <div>
        <span style="width:12px;height:12px;background-color:#2862ff;display:inline-block;border-radius:50%;margin-right:2.5px;" ></span>
        <span style="color: black;font-size:0.85rem;">PRICE:</span>
        </div>
          <b style="color: black;font-size: 1rem;margin-left: 0.25rem;">
        ${price.toFixed(
          price < 0.01 ? 7 : price < 0.1 ? 5 : price < 10 ? 3 : 3
        )}
        </b>
        </div>
        <div style="display:flex;margin: 4px 0px;justify-content:flex-start;align-items:center;">
        <div>
        <span style="width:12px;height:12px;background-color:black;display:inline-block;border-radius:50%;margin-right:2.5px;" ></span>
        <span style="color: black;font-size:0.85rem;">DOM:</span>
        </div>
          <b style="color: black;font-size: 1rem;margin-left: 0.25rem;">
        ${price.toFixed(
          price < 0.01 ? 7 : price < 0.1 ? 5 : price < 10 ? 3 : 3
        )}
        </b>
        </div>
        `;
          const y = param.point.y;
          let left = param.point.x + toolTipMargin;
          if (left > container.clientWidth - toolTipWidth) {
            left = param.point.x - toolTipMargin - toolTipWidth;
          }
          let top = y + toolTipMargin;
          if (top > container.clientHeight - toolTipHeight) {
            top = y - toolTipHeight - toolTipMargin;
          }
          toolTip.style.left = left + "px";
          toolTip.style.top = top + "px";
        }
      });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    data,
    colors.backgroundColor,
    colors.lineColor,
    colors.textColor,
    colors.areaTopColor,
    colors.areaBottomColor,
    heightDefault,
    title,
  ]);

  return (
    <div className={styles.chart} id="container" ref={chartContainerRef} />
  );
};
export const ChartComponentHOC = memo(ChartComponent);
const Coins = () => {
  const [statusClearDate, setStatusClearDate] = useState<boolean>(false);
  const params = useParams();
  // const [openWatchList, setOpenWatchList] = useState<boolean>(false);
  // const [indexClicked, setIndexClicked] = useState<number>(0);
  const [indexScale, setIndexScale] = useState<number>(0);
  const listScale = ["Linear Scale", "Log Scale"];
  const [zoom, setZoom] = useState<boolean>(false);
  const { from, to }: any = params;
  const [dataPoints, setDataPoints] = useState<
    {
      x: string;
      y: number;
    }[]
  >([]);
  const queryParam = getQueryParam<any>();
  const local: any = localStorage?.getItem("listWatched");
  const [listWatchedState, setListWatchedState] = useState<ListWatchedProps[]>(
    local ? JSON.parse(local) : []
  );
  // const indexHeart =
  //   listWatchedState?.length > 0
  //     ? listWatchedState.findIndex(
  //         (values) => `${values.coinFrom}${values.coinTo}` === `${from}${to}`
  //       )
  //     : -1;
  // const [statusHeart, setStatusHeart] = useState<boolean>(
  //   indexHeart > -1 ? listWatchedState[indexHeart].watched : false
  // );
  const [listChartModal, setListChartModal] = useState<any[]>([]);
  const indexRange = Object.keys(TimePeriod).findIndex(
    (values) => values === queryParam["range"]
  );
  const gridItemRef: any = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState({
    marketCap: true,
    vol: true,
  });
  const [listDataChart, setListDataChart] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleCoupleCoin = useCallback(
    debounce(async () => {
      try {
        const listRespon = await Promise.all([
          coinApi.getAllCoinCouple(from.toLowerCase(), TimeFilters.ALL),
          coinApi.getAllCoinCouple(to.toLowerCase(), TimeFilters.ALL),
        ]);
        if (
          listRespon.length === 2 &&
          listRespon?.[0]?.data?.prices?.length > 0 &&
          listRespon?.[1]?.data?.prices?.length > 0
        ) {
          let listCoinFrom = listRespon?.[0]?.data?.prices;
          let listCoinTo = listRespon?.[1]?.data?.prices;
          if (listCoinFrom?.length > listCoinTo?.length) {
            // listCoinFrom.length = listCoinTo.length;
            const result = listCoinFrom.slice(
              listCoinFrom.length - listCoinTo.length - 1,
              -1
            );
            result.push(listCoinFrom[listCoinFrom.length - 1]);
            result.shift();
            const listDataChartTemp: any = [];
            const listTemp: any = [];
            const listDataPoint: any = [];
            result?.forEach((v: any, index: number) => {
              listTemp.push({
                time: moment(v?.[0]).unix(),
                value:
                  parseFloat(v?.[1]) / parseFloat(listCoinTo?.[index]?.[1]),
              });
              listDataChartTemp.push([
                parseFloat(`${moment(v?.[0]).unix()}000`),
                parseFloat(v?.[1]) / parseFloat(listCoinTo?.[index]?.[1]),
              ]);
              listDataPoint.push({
                x: new Date(v?.[0]),
                y: parseFloat(v?.[1]) / parseFloat(listCoinTo?.[index]?.[1]),
              });
            });
            const index = test1.findIndex(
              (v) => v[0] === listDataChartTemp[0][0]
            );

            // const resultFinal = test1.filter(
            //   (v) =>
            //     v[0] >= listDataChartTemp[0][0] &&
            //     v[0] <= listDataChartTemp[listDataChartTemp.length - 1][0]
            // );

            setTest1(test1.slice(index));
            setListDataChart([...listDataChartTemp]);
            setListChartModal([...listTemp]);
            setDataPoints([...listDataPoint]);
            handleSetLocalStorage();
          } else if (listCoinFrom?.length < listCoinTo?.length) {
            const result = listCoinTo.slice(
              listCoinTo.length - listCoinFrom.length - 1,
              -1
            );
            result.push(listCoinTo[listCoinTo.length - 1]);
            result.shift();
            const listDataChartTemp: any = [];
            const listDataPoint: any = [];
            const listTemp: any = [];
            listCoinFrom?.forEach((v: any, index: number) => {
              listTemp.push({
                time: moment(v?.[0]).unix(),
                value: parseFloat(v?.[1]) / parseFloat(result?.[index]?.[1]),
              });
              listDataChartTemp.push([
                parseFloat(`${moment(v?.[0]).unix()}000`),
                parseFloat(v?.[1]) / parseFloat(result?.[index]?.[1]),
              ]);
              listDataPoint.push({
                x: new Date(v?.[0]),
                y: parseFloat(v?.[1]) / parseFloat(result?.[index]?.[1]),
              });
            });
            const index = test1.findIndex(
              (v) => v[0] === listDataChartTemp[0][0]
            );
            setTest1(test1.slice(index));
            setListDataChart([...listDataChartTemp]);
            setListChartModal([...listTemp]);
            setDataPoints([...listDataPoint]);
            handleSetLocalStorage();
          } else {
            const listTemp: any = [];
            const listDataPoint: any = [];
            const listDataChartTemp: any = [];
            listCoinFrom?.forEach((v: any, index: number) => {
              listTemp.push({
                time: moment(v?.[0]).unix(),
                value:
                  parseFloat(v?.[1]) / parseFloat(listCoinTo?.[index]?.[1]),
              });
              listDataChartTemp.push([
                parseFloat(`${moment(v?.[0]).unix()}000`),
                parseFloat(v?.[1]) / parseFloat(listCoinTo?.[index]?.[1]),
              ]);
              listDataPoint.push({
                x: new Date(v?.[0]),
                y: parseFloat(v?.[1]) / parseFloat(listCoinTo?.[index]?.[1]),
              });
            });
            const index = test1.findIndex(
              (v) => v[0] === listDataChartTemp[0][0]
            );
            setTest1(test1.slice(index));
            setListDataChart([...listDataChartTemp]);
            setListChartModal([...listTemp]);
            setDataPoints([...listDataPoint]);
            handleSetLocalStorage();
          }
        } else {
          notify("error", "Pair of Coins is not valid!", notifyTime);
        }
      } catch (error) {
        notify("error", "Error!", notifyTime);
      } finally {
        setLoading(false);
      }
    }, timeDebounce),
    []
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSetLocalStorage = useCallback(
    debounce(async () => {
      if (listWatchedState?.length === 0) {
        try {
          const res = await coinApi.getAllMarkets();
          if (res.status === Status.SUCCESS) {
            let priceCoinFrom = "";
            let priceCoinTo = "";
            res?.data?.length > 0 &&
              res.data.forEach((values: any) => {
                if (values.id === from.toLowerCase()) {
                  priceCoinFrom = numeral(values.current_price).format(
                    "0.00000"
                  );
                }
                if (values.id === to.toLowerCase()) {
                  priceCoinTo = numeral(values.current_price).format("0.00000");
                }
              });
            const listTemp = [
              {
                coinFrom: from,
                coinTo: to,
                idCoinFrom: from,
                watched: false,
                priceCoinFrom,
                priceCoinTo,
              },
            ];
            setListWatchedState(listTemp);
            localStorage.setItem("listWatched", JSON.stringify(listTemp));
          }
        } catch (error) {
          notify("error", "Error!", notifyTime);
        }
      }
    }, timeDebounce),
    []
  );
  // const handleUpdateStatusHeart = () => {
  //   setStatusHeart(!statusHeart);
  //   const listTemp = [...listWatchedState];
  //   listTemp[indexHeart].watched = !statusHeart;
  //   localStorage.setItem("listWatched", JSON.stringify(listTemp));
  // };
  // const handleCloseDrawer = (status: boolean) => setOpenWatchList(status);
  // const handleCloseDrawer = () => {};
  const ref: any = createRef();
  const [image, takeScreenShot] = useScreenshot({
    type: "image/jpeg",
    quality: 1.0,
  });

  const download = (image, { name = "img", extension = "jpg" } = {}) => {
    const a = document.createElement("a");
    a.href = image;
    a.download = createFileName(extension, name);
    a.click();
  };

  const downloadScreenshot = (typeImg: string) =>
    takeScreenShot(ref.current).then((e) =>
      download(e, {
        name: "chart",
        extension: typeImg,
      })
    );
  const createPDF = async () => {
    const doc: any = document;
    const pdf = new jsPDF("portrait", "pt", "a4");
    const data = await html2canvas(doc.querySelector("#pdf"));
    const img = data.toDataURL("image/png");
    const imgProperties = pdf.getImageProperties(img);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width;
    pdf.addImage(img, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("chart.pdf");
  };
  const handlePrint = useReactToPrint({
    content: () => ref.current,
  });
  const items: MenuProps["items"] = [
    {
      label: (
        // <PrintComponents trigger={<p className={styles.px}>Print chart</p>}>
        //   {/* <div ref={ref.current}>{ref}</div> */}
        //   {/* {doc.querySelector("#pdf")} */}
        //   {/* {doc.querySelector("#pdf")} */}
        //   content
        // </PrintComponents>
        <p onClick={() => handlePrint()} className={styles.px}>
          Print chart
        </p>
      ),
      key: "3",
    },
    {
      type: "divider",
    },
    {
      label: (
        <p onClick={() => downloadScreenshot("png")} className={styles.px}>
          Download PNG image
        </p>
      ),
      key: "0",
    },
    {
      label: (
        <p onClick={() => downloadScreenshot("jpeg")} className={styles.px}>
          Download JPEG image
        </p>
      ),
      key: "1",
    },
    {
      label: (
        <p onClick={() => createPDF()} className={styles.px}>
          Download PDF document
        </p>
      ),
      key: "2",
    },
    {
      label: (
        <p onClick={() => downloadScreenshot("svg")} className={styles.px}>
          Download SVG vector image
        </p>
      ),
      key: "4",
    },
  ];
  const options = {
    theme: "light2",
    // title: {
    //   text: "React StockChart with Date-Time Axis",
    // },
    //   subtitles: [
    //     {
    //       text: "Price-Volume Trend",
    //     },
    //   ],
    // animationEnabled: true,
    // exportEnabled: true,
    // rangeChanged: function (e) {
    //   rangeChangedTriggered = true;
    // },
    // rangeChanging: function (e) {
    //   console.log("Source: " + e.stockChart);
    // },
    // rangeChanged: function (e) {
    //   console.log("type : " + e.type + ", trigger : " + e.trigger);
    // },
    charts:
      title.marketCap && title.vol
        ? [
            {
              zoomEnabled: true,
              axisX: {
                // title: "Bounce Rate",
                valueFormatString: " MMM DD YYYY", // MMM DD YYYY
                crosshair: {
                  enabled: true,
                  snapToDataPoint: true,
                  valueFormatString: " MMM DD YYYY", // MMM DD YYYY
                },
                // lineThickness: 5,
                // tickLength: 0,
                // labelFormatter: function (e) {
                //   return "123";
                // },
              },
              // legend: {
              //   verticalAlign: "top",
              // },
              // legend: {
              //   verticalAlign: "top",
              //   cursor: "pointer",
              //   itemclick: function (e) {
              //     if (
              //       typeof e.dataSeries.visible === "undefined" ||
              //       e.dataSeries.visible
              //     ) {
              //       e.dataSeries.visible = false;
              //     } else {
              //       e.dataSeries.visible = true;
              //     }
              //     e.chart.render();
              //   },
              // },
              axisY: {
                title: "Price",
                titleFontWeight: "bold",
                titleFontColor: "#57B4E9",
                labelFontColor: "#57B4E9",
                labelFontWeight: "bold",
                prefix: "", // $
                crosshair: {
                  enabled: true,
                  snapToDataPoint: true,
                  valueFormatString: handleFormatCoinPriceChart(
                    dataPoints[0]?.y || 0
                  ),
                },
              },
              toolTip: {
                shared: true,
              },
              data: [
                {
                  // axisYType: "secondary",
                  // toolTipContent: "Week {x}: {y}%",
                  lineColor: "#57B4E9",
                  // markerSize: 10,
                  name: "PRICE",
                  // type: "splineArea",
                  // type: "area",
                  type: "spline",
                  // showInLegend: true,
                  // legendText: "MWp = one megawatt peak",
                  color: "#57B4E9",
                  yValueFormatString: handleFormatCoinPriceChart(
                    dataPoints[0]?.y || 0
                  ), // "#,###.##"
                  xValueFormatString: "DD/MM/YYYY HH:MM:ss", // MMM DD YYYY
                  // xValueType: "dateTime",
                  dataPoints: dataPoints,
                  toolTipContent:
                    '<p style="font-size:0.75rem;color:#000000;margin:0;padding:0;">{x}</p><div style="display:flex;justify-content:flex-start;align-items:center;margin-top:0.25rem;"><span style="width:0.8rem;height:0.8rem;border-radius:50%;margin:0;padding:0;background-color:#57B4E9;"></span><span style="margin-left:0.25rem;">Price: </span><b>{y}</b></div>',
                  // '<p style="width:2.5rem;height:2.5rem;background-color:red;" ></p><span style="color:#57B4E9">{x}</span><br/>PRICE: <b>{y}</b>',
                },
              ],
            },
            {
              // zoomEnabled: true,
              height: !zoom ? 90 : 130,
              axisX: {
                valueFormatString: " MMM DD YYYY", // MMM DD YYYY
                crosshair: {
                  enabled: true,
                  snapToDataPoint: true,
                  valueFormatString: " MMM DD YYYY", // MMM DD YYYY
                },
              },
              axisY: {
                title: "Dom",
                titleFontWeight: "bold",
                titleFontSize: 14,
                titleFontColor: "#767777",
                labelFontColor: "#767777",
                labelFontWeight: "bold",
                prefix: "",
                crosshair: {
                  enabled: true,
                  snapToDataPoint: true,
                  valueFormatString: handleFormatCoinPriceChart(
                    dataPoints[0]?.y || 0
                  ),
                },
                // tickLength: 0,
              },
              toolTip: {
                shared: true,
              },
              data: [
                {
                  name: "DOM",
                  color: "#767777",
                  yValueFormatString: handleFormatCoinPriceChart(
                    dataPoints[0]?.y || 0
                  ),
                  xValueFormatString: "DD/MM/YYYY HH:MM:ss", // MMM DD YYYY
                  type: "column",
                  dataPoints: title.vol ? dataPoints : [],
                  toolTipContent:
                    '<p style="font-size:0.75rem;color:#000000;margin:0;padding:0;">{x}</p><div style="display:flex;justify-content:flex-start;align-items:center;margin-top:0.25rem;"><span style="width:0.8rem;height:0.8rem;border-radius:50%;margin:0;padding:0;background-color:#767777;"></span><span style="margin-left:0.25rem;">Dom: </span><b>{y}</b></div>',
                  // '<p style="width:2.5rem;height:2.5rem;background-color:red;" ></p><span style="color:#57B4E9">{x}</span><br/>PRICE: <b>{y}</b>',
                },
              ],
            },
          ]
        : title.marketCap && !title.vol
        ? [
            {
              zoomEnabled: true,
              axisX: {
                // title: "Bounce Rate",
                valueFormatString: " MMM DD YYYY", // MMM DD YYYY
                crosshair: {
                  enabled: true,
                  snapToDataPoint: true,
                  valueFormatString: " MMM DD YYYY", // MMM DD YYYY
                },
                // lineThickness: 5,
                // tickLength: 0,
                // labelFormatter: function (e) {
                //   return "123";
                // },
              },
              // legend: {
              //   verticalAlign: "top",
              // },
              // legend: {
              //   verticalAlign: "top",
              //   cursor: "pointer",
              //   itemclick: function (e) {
              //     if (
              //       typeof e.dataSeries.visible === "undefined" ||
              //       e.dataSeries.visible
              //     ) {
              //       e.dataSeries.visible = false;
              //     } else {
              //       e.dataSeries.visible = true;
              //     }
              //     e.chart.render();
              //   },
              // },
              axisY: {
                title: "Price",
                prefix: "", // $
                crosshair: {
                  enabled: true,
                  snapToDataPoint: true,
                  valueFormatString: handleFormatCoinPriceChart(
                    dataPoints[0]?.y || 0
                  ),
                },
              },
              toolTip: {
                shared: true,
              },
              data: [
                {
                  // axisYType: "secondary",
                  // toolTipContent: "Week {x}: {y}%",
                  name: "PRICE",
                  // type: "splineArea",
                  // type: "area",
                  type: "spline",
                  // showInLegend: true,
                  // legendText: "MWp = one megawatt peak",
                  color: "#57B4E9",
                  yValueFormatString: handleFormatCoinPriceChart(
                    dataPoints[0]?.y || 0
                  ), // "#,###.##"
                  xValueFormatString: "DD/MM/YYYY HH:MM:ss", // MMM DD YYYY
                  // xValueType: "dateTime",
                  dataPoints: dataPoints,
                  toolTipContent:
                    '<p style="font-size:0.75rem;color:#000000;margin:0;padding:0;">{x}</p><div style="display:flex;justify-content:flex-start;align-items:center;margin-top:0.25rem;"><span style="width:0.8rem;height:0.8rem;border-radius:50%;margin:0;padding:0;background-color:#57B4E9;"></span><span style="margin-left:0.25rem;">Price: </span><b>{y}</b></div>',
                  // '<p style="width:2.5rem;height:2.5rem;background-color:red;" ></p><span style="color:#57B4E9">{x}</span><br/>PRICE: <b>{y}</b>',
                },
              ],
            },
          ]
        : !title.marketCap && title.vol
        ? [
            {
              // zoomEnabled: true,
              height: !zoom ? 90 : 130,
              axisX: {
                valueFormatString: " MMM DD YYYY", // MMM DD YYYY
                crosshair: {
                  enabled: true,
                  snapToDataPoint: true,
                  valueFormatString: " MMM DD YYYY", // MMM DD YYYY
                },
              },
              axisY: {
                title: "Dom",
                prefix: "",
                crosshair: {
                  enabled: true,
                  snapToDataPoint: true,
                  valueFormatString: handleFormatCoinPriceChart(
                    dataPoints[0]?.y || 0
                  ),
                },
                // tickLength: 0,
              },
              toolTip: {
                shared: true,
              },
              data: [
                {
                  name: "DOM",
                  color: "#767777",
                  yValueFormatString: handleFormatCoinPriceChart(
                    dataPoints[0]?.y || 0
                  ),
                  xValueFormatString: "DD/MM/YYYY HH:MM:ss", // MMM DD YYYY
                  type: "column",
                  dataPoints: title.vol ? dataPoints : [],
                  toolTipContent:
                    '<p style="font-size:0.75rem;color:#000000;margin:0;padding:0;">{x}</p><div style="display:flex;justify-content:flex-start;align-items:center;margin-top:0.25rem;"><span style="width:0.8rem;height:0.8rem;border-radius:50%;margin:0;padding:0;background-color:#767777;"></span><span style="margin-left:0.25rem;">Dom: </span><b>{y}</b></div>',
                  // '<p style="width:2.5rem;height:2.5rem;background-color:red;" ></p><span style="color:#57B4E9">{x}</span><br/>PRICE: <b>{y}</b>',
                },
              ],
            },
          ]
        : [],
    rangeSelector: {
      // selectedRangeButtonIndex: 1,
      // inputFields: {
      //   startValue: 1000,
      //   endValue: 5000,
      //   valueFormatString: "###0",
      // },
      // buttons: [
      //   {
      //     label: "1000",
      //     range: 1000,
      //     rangeType: "number",
      //   },
      //   {
      //     label: "2000",
      //     range: 2000,
      //     rangeType: "number",
      //   },
      //   {
      //     label: "5000",
      //     range: 5000,
      //     rangeType: "number",
      //   },
      //   {
      //     label: "All",
      //     rangeType: "all",
      //   },
      // ],
      selectedRangeButtonIndex: 6,
      buttonStyle: {
        labelFontSize: 13,
        backgroundColor: "#F7F7F7",
        borderColor: "#F7F7F7",
        backgroundColorOnHover: "#E6EBF5",
        backgroundColorOnSelect: "#E6EBF5",
        labelFontColorOnHover: "#000000",
      },
      inputFields: {
        style: {
          fontSize: 13,
          cursor: "pointer",
          borderColor: "white",
        },
      },
      buttons: [
        {
          label: "1d",
          range: 1,
          rangeType: "day",
        },
        {
          label: "7d",
          range: 7,
          rangeType: "day",
        },
        {
          label: "1m",
          range: 1,
          rangeType: "month",
        },
        {
          label: "3m",
          range: 3,
          rangeType: "month",
        },
        {
          label: "1y",
          range: 1,
          rangeType: "year",
        },
        {
          label: "YTD",
          // range: 1,
          rangeType: "ytd",
        },
        {
          label: "ALL",
          // range: null,
          rangeType: "all",
        },
      ],
      // enabled: false,
    },
    navigator: {
      dynamicUpdate: true,
      height: 35,
      slider: {
        maskInverted: true, // Change it to false
        maskColor: "#D9E0EF",
      },
      data: [
        {
          type: "spline",
          color: "#57B4E9",
          dataPoints: dataPoints,

          // name: "PRICE",
          // yValueFormatString: "#,###.##",
          // xValueFormatString: "DD/MM/YYYY", // MMM DD YYYY
        },
      ],
      // slider: {
      //   minimum: new Date("01-01-2016"),
      //   maximum: new Date("01-01-2018"),
      // },
      axisX: {
        labelFontWeight: "bolder",
        valueFormatString: "YYYY", // MMM DD YYYY
        labelFontColor: "#999999",
      },
    },
    // rangeSelector: {
    //   enabled: false,
    // },
  };
  // useEffect(() => {
  //   Highcharts.getJSON(
  //     "https://cdn.jsdelivr.net/gh/highcharts/highcharts@v7.0.0/samples/data/range.json",
  //     function (data) {
  //       Highcharts.stockChart("container", {
  //         chart: {
  //           type: "arearange",
  //         },

  //         rangeSelector: {
  //           allButtonsEnabled: true,
  //           selected: 2,
  //         },

  //         title: {
  //           text: "Temperature variation by day",
  //         },

  //         subtitle: {
  //           text: 'Demo of all buttons enabled. Even though "YTD" and "1y" don\'t apply since we\'re<br>only showing values within one year, they are enabled to allow dynamic interaction',
  //         },

  //         tooltip: {
  //           valueSuffix: "°C",
  //         },

  //         series: [
  //           {
  //             name: "Temperatures",
  //             data: data,
  //           },
  //         ],
  //       });
  //     }
  //   );
  // }, []);
  useEffect(() => {
    setLoading(true);
    // handleCheckCoin();
    handleCoupleCoin(Object.values(TimePeriod)[indexRange]);
    setStatusClearDate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusClearDate]);
  const [test1, setTest1] = useState<any>(dataJson[0].data);

  const option1 = {
    // title: {
    //   text: "Total Cryptocurrency Price",
    // },
    // chart: {
    //   // type: "spline",

    // },
    // subtitle: {
    //   text: "Demo of placing the range selector above the navigator",
    // },
    // rangeSelector: {
    //   // floating: true,
    //   // y: -65,
    //   // verticalAlign: "bottom",
    //   // allButtonsEnabled: false,
    //   selected: 1,
    // },
    // tooltip: {
    //   split: true,
    // },
    // tooltip: {
    //   headerFormat: "<b>{series.name}</b><br/>",
    //   pointFormat: "{point.x} km: {point.y}°C",
    // },
    // plotOptions: {
    //   spline: {
    //     marker: {
    //       enable: false
    //     }
    //   }
    // },
    tooltip: {
      // pointFormat:
      //   '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b>%<br/>',

      split: false,
      // style: {
      //   width: "200px",
      // },
      shared: true,
      crosshairs: true,
    },
    // chart: {
    //   events: {
    //     load: function () {
    //       const a: any = window;
    //       if (!a.TestController) {
    //         setTitle(null, {
    //           text: "Built chart in " + (new Date() - start) + "ms",
    //         });
    //       }
    //     },
    //   },
    //   zoomType: "x",
    // },

    // xAxis: {
    //   minorTickInterval: "auto",
    //   startOnTick: true,
    //   endOnTick: true,
    // },
    chart: {
      // type: "candlestick",
      zoomType: "x",
      height: !zoom ? 500 : 675,

      // selectionMarkerFill: "red",
      // shadow: true,
      // alignThresholds: true,

      // backgroundColor: "red",
      // borderColor: "blue",
      // plotBorderColor: "green",
      // plotShadow: true,
      // inverted: true,
      // resetZoomButton: {
      //   position: {
      //     align: "left",
      //   },
      // },
    },
    // navigator: {
    //   adaptToUpdatedData: false,
    //   series: {
    //     data: test,
    //   },
    // },
    // scrollbar: {
    //   liveRedraw: false,
    // },
    rangeSelector: {
      // inputEnabled: false,
      allButtonsEnabled: true,
      selected: 6,
      // floating: true,
      buttons: [
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
          // count: 1,
          text: "YTD",
        },
        {
          type: "all",
          text: "ALL",
        },
      ],
    },
    legend: {
      enabled: true,
    },
    // xAxis: [
    //   {
    //     labels: {
    //       allowOverlap: true,
    //     },
    //   },
    // ],

    yAxis: [
      {
        opposite: false,
        // zoomEnabled: false,
        // reversed: true,
        labels: {
          align: "right",
          x: -15,
          // formatter: (value) => {
          //   return console.log(value);
          // },
          style: {
            color: "#7CB5EC",
          },
        },
        plotLines: [
          {
            value: 0,
            width: 2,
            color: "silver",
          },
        ],
        // showLastLabel: false,
        title: {
          // reserveSpace: false,
          enabled: true,
          text: "Price",
          style: {
            color: "#7CB5EC",
          },
        },
        height: "80%",
        // lineWidth: 2,
        resize: {
          enabled: true,
        },
      },
      {
        opposite: false,
        labels: {
          align: "right",
          x: -15,
          style: {
            color: "#434348",
          },
        },
        title: {
          reserveSpace: false,
          text: "BTC Dom",
          style: {
            color: "#434348",
          },
        },
        top: "80%",
        height: "20%",
        offset: 0,
      },
    ],
    // exporting: {
    //   enabled: true,
    //   // allowHTML: true,
    //   showTable: true,
    // },

    series: [
      {
        type: "area",
        // threshold: null,
        name: "Price",
        // tooltip: {
        //   valueDecimals: 2,
        // },
        id: "aapl-ohlc",
        color: "#7CB5EC",
        fillColor: {
          linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
          stops: [
            [0, "#7CB5EC"],
            [1, Highcharts.color("#7CB5EC").setOpacity(0.1).get()],
          ],
        },
        tooltip: {
          valueDecimals:
            test1[0][1] < 0.01
              ? 7
              : test1[0][1] < 0.1
              ? 5
              : test1[0][1] < 10
              ? 3
              : 3,
        },
        data: listDataChart?.length > 0 ? listDataChart : [],
        // tooltip: {
        //   valueDecimals: 1,
        //   valueSuffix: '°C'
        // },
      },
      {
        type: "column",
        id: "aapl-volume",
        name: "BTC Dom",
        color: "#434348",
        tooltip: {
          valueDecimals: 0,
          valueSuffix: "%",
        },
        data: test1?.length > 0 ? test1 : [],
        yAxis: 1,
      },
    ],
    exporting: {
      chartOptions: {
        title: {
          text: "",
        },
      },
    },
    // navigator: {
    //   // maskFill: "#D9E0EF",
    //   // outlineColor: "red",
    // },
    responsive: {
      rules: [
        {
          condition: {
            maxWidth: 800,
          },
          chartOptions: {
            chart: {
              height: 300,
            },
            navigator: {
              enabled: true,
            },

            // rangeSelector: {
            //   inputEnabled: false,
            // },
          },
        },
      ],
    },
  };
  // useEffect(() => {
  //   fetch(
  //     "https://www.coingecko.com/global_charts/market_dominance_data?locale=en"
  //   )
  //     .then((res) => res.json())
  //     .then((data) => {
  //       var dataLength = data.length,
  //         i = 0,
  //         volume: any = [];
  //       for (i; i < dataLength; i += 1) {
  //         volume.push([
  //           data[i][0], // the date
  //           data[i][5], // the volume
  //         ]);
  //       }
  //       setTest1([...volume]);
  //     });
  // }, []);
  return (
    <div className={styles.coins} ref={gridItemRef}>
      {loading && <Loading />}
      {listChartModal?.length > 0 && (
        <div>
          <div>
            {!zoom && (
              <h3 className={styles.new}>Total Cryptocurrency Price</h3>
            )}
            <div id="pdf" ref={ref}>
              <div className={styles.title}>
                <div
                  className={`${styles.title__child} ${styles.title__child__right}`}
                >
                  <div className={styles.title__child__range}>
                    {listScale.map((v, index) => (
                      <p
                        key={index}
                        onClick={() => setIndexScale(index)}
                        className={`${styles.title__child__range__item} ${
                          styles.title__child__range__itemScaleSpecial
                        } ${
                          indexScale === index
                            ? styles.title__child__range__itemScale
                            : ""
                        }`}
                      >
                        {v}
                      </p>
                    ))}
                    <div className={styles.title__child__rangeIcon}>
                      <img
                        src={!zoom ? expand : noExpand}
                        onClick={() => setZoom(!zoom)}
                        alt=""
                        className={styles.title__child__rangeIcon__item}
                      />
                    </div>
                    {/* <div className={styles.title__child__rangeIcon}>
                      <Dropdown menu={{ items }} trigger={["click"]}>
                        <FontAwesomeIcon
                          className={styles.title__child__rangeIcon__item}
                          icon={faBars}
                        />
                      </Dropdown>
                    </div> */}
                  </div>
                </div>
              </div>
              {/* <CanvasJSStockChart
                containerProps={{
                  height: !zoom
                    ? (title.marketCap && title.vol) ||
                      (title.marketCap && !title.vol)
                      ? "450px"
                      : !title.marketCap && title.vol
                      ? "150px"
                      : "75px"
                    : (title.marketCap && title.vol) ||
                      (title.marketCap && !title.vol)
                    ? "625px"
                    : !title.marketCap && title.vol
                    ? "215px"
                    : "75px",
                  margin: "auto",
                }}
                options={options}

              /> */}
              {/* <div className={styles.market}>
                <div
                  onClick={() =>
                    setTitle({ ...title, marketCap: !title.marketCap })
                  }
                  className={`${styles.market__cap} ${
                    !title.marketCap ? styles.marketDisable : ""
                  }`}
                >
                  <span className={styles.market__cap__icon}></span>
                  <h3>
                    <b>PRICE</b>
                  </h3>
                </div>
                <div
                  onClick={() => setTitle({ ...title, vol: !title.vol })}
                  className={`${styles.market__dot} ${
                    !title.vol ? styles.marketDisable : ""
                  }`}
                >
                  <span className={styles.market__dot__item}></span>
                  <h3>
                    <b>DOM</b>
                  </h3>
                </div>
              </div> */}
              <HighchartsReact
                highcharts={Highcharts}
                constructorType={"stockChart"}
                options={option1}
                // allowChartUpdate={true}
                // immutable={false}
                // @ts-ignore: Unreachable code error
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Coins;
