// import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import { DatePicker, Dropdown, MenuProps } from "antd";
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
  // DrawerComponent,
  handleFormatCoinPrice,
  listTimeRange,
  ListWatchedProps,
  notifyTime,
  TimePeriod,
} from "../../App";
import { Status, TimeFilters } from "../../Constants/enum";
import { createChart, ColorType } from "lightweight-charts";
import { getQueryParam, updateUrl } from "../../Utils/query";
import Loading from "../../Components/Loading";
import { useParams } from "react-router-dom";
import { notify } from "../../Utils/notification";
import numeral from "numeral";
import moment from "moment";
import SecondaryChart from "../../Components/SecondaryChart";
import useWindowDimensions from "../../hooks/useWindowDimensions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import CanvasJSReact from "./../../Assets/canvasjs.stock.react";
var CanvasJSStockChart = CanvasJSReact.CanvasJSStockChart;
const formatDateNormal = "DD/MM/YYYY";
const { RangePicker } = DatePicker;
const handleFormatCoin = (coin: number) => {
  return coin < 0.01
    ? 0.000001
    : coin < 0.1
    ? 0.00001
    : coin < 10
    ? 0.0001
    : 0.01;
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
const RangePickerComp = ({
  listChartModal,
  setStatusClearDate,
  setListChartModal,
}: {
  listChartModal: any[];
  setStatusClearDate: any;
  setListChartModal: any;
}) => {
  const [dateCommon, setDateCommon] = useState({
    start: listChartModal[0].time,
    end: listChartModal[listChartModal?.length - 1].time,
  });
  // const formatFunc = (date: any) =>
  //   moment(date.split("/").reverse().join("-")).format("ll");
  const onChange = (value: any) => {
    if (value?.length > 0) {
      const today = new Date(value[1]);
      const tomorrow = new Date(today);
      const start: number = moment(new Date(value[0])).unix();
      const end: number = moment(
        new Date(tomorrow.setDate(today.getDate() + 1))
      ).unix();
      // setDateCommon({
      //   ...dateCommon,
      //   start,
      //   end,
      // });
      const listTemp = [...listChartModal];
      const resultFilter = listTemp.filter(
        (v) => v.time >= start && v.time <= end
      );
      resultFilter.length > 0 && setListChartModal([...resultFilter]);
    } else {
      setStatusClearDate(true);
    }
  };
  useEffect(() => {
    setDateCommon({
      ...dateCommon,
      start: listChartModal[0].time,
      end: listChartModal[listChartModal?.length - 1].time,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listChartModal]);

  return (
    <RangePicker
      onChange={onChange}
      className={styles.title__child__datepicker}
      suffixIcon={null}
      disabledDate={(current: any) => {
        return (
          dateCommon.start >= moment(new Date(current)).unix() ||
          dateCommon.end <= moment(new Date(current)).unix()
        );
      }}
      // dateRender={(current: any) => {
      //   const style: React.CSSProperties = {};
      //   if (
      //     dateCommon.start < moment(new Date(current)).unix() &&
      //     dateCommon.end > moment(new Date(current)).unix()
      //   ) {
      //     style.border = "1px solid #1890ff";
      //     style.borderRadius = "50%";
      //   }
      //   return (
      //     <div className="ant-picker-cell-inner" style={style}>
      //       {current.date()}
      //     </div>
      //   );
      // }}
      value={[
        moment(
          formatDate(dateCommon.start, formatDateNormal),
          formatDateNormal
        ),
        moment(formatDate(dateCommon.end, formatDateNormal), formatDateNormal),
      ]}
      format={formatDateNormal}
      bordered={false}
    />
  );
};
const RangePickerCompHOC = memo(RangePickerComp);
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
  const [boxWidth, setBoxWidth] = useState<number>(0);
  const [statusClearDate, setStatusClearDate] = useState<boolean>(false);
  const params = useParams();
  // const [openWatchList, setOpenWatchList] = useState<boolean>(false);
  // const [indexClicked, setIndexClicked] = useState<number>(0);
  const [indexScale, setIndexScale] = useState<number>(0);
  const listScale = ["Linear Scale", "Log Scale"];
  const [zoom, setZoom] = useState({
    status: false,
    heightDefault: 300,
  });
  const { height } = useWindowDimensions();
  const { from, to }: any = params;
  const [dataPoints, setDataPoints] = useState<
    {
      x: string;
      y: number;
    }[]
  >([]);
  const [checkClickedSelect, setCheckClickedSelect] = useState<boolean>(false);
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
  const containerProps = {
    width: "100%",
    height: "450px",
    margin: "auto",
  };
  const [listChartModal, setListChartModal] = useState<any[]>([]);
  const indexRange = Object.keys(TimePeriod).findIndex(
    (values) => values === queryParam["range"]
  );
  const [secondList, setSecondList] = useState<any>([]);
  const gridItemRef: any = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState({
    marketCap: true,
    vol: true,
  });
  const [loading, setLoading] = useState<boolean>(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleCoupleCoin = useCallback(
    debounce(async (range: string) => {
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
            const listSecondTemp: any = [];
            const listTemp: any = [];
            const listDataPoint: any = [];
            result?.forEach((v: any, index: number) => {
              listTemp.push({
                time: moment(v?.[0]).unix(),
                value:
                  parseFloat(v?.[1]) / parseFloat(listCoinTo?.[index]?.[1]),
              });
              listSecondTemp.push({
                date: new Date(v?.[0]),
                price:
                  parseFloat(v?.[1]) / parseFloat(listCoinTo?.[index]?.[1]),
              });
              listDataPoint.push({
                x: new Date(v?.[0]),
                y: parseFloat(v?.[1]) / parseFloat(listCoinTo?.[index]?.[1]),
              });
            });
            setSecondList([...listSecondTemp]);
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
            const listSecondTemp: any = [];
            const listDataPoint: any = [];
            const listTemp: any = [];
            listCoinFrom?.forEach((v: any, index: number) => {
              listTemp.push({
                time: moment(v?.[0]).unix(),
                value: parseFloat(v?.[1]) / parseFloat(result?.[index]?.[1]),
              });
              listSecondTemp.push({
                date: new Date(v?.[0]),
                price: parseFloat(v?.[1]) / parseFloat(result?.[index]?.[1]),
              });
              listDataPoint.push({
                x: new Date(v?.[0]),
                y: parseFloat(v?.[1]) / parseFloat(result?.[index]?.[1]),
              });
            });
            setSecondList([...listSecondTemp]);
            setListChartModal([...listTemp]);
            setDataPoints([...listDataPoint]);
            handleSetLocalStorage();
          } else {
            const listTemp: any = [];
            const listDataPoint: any = [];
            const listSecondTemp: any = [];
            listCoinFrom?.forEach((v: any, index: number) => {
              listTemp.push({
                time: moment(v?.[0]).unix(),
                value:
                  parseFloat(v?.[1]) / parseFloat(listCoinTo?.[index]?.[1]),
              });
              listSecondTemp.push({
                date: new Date(v?.[0]),
                price:
                  parseFloat(v?.[1]) / parseFloat(listCoinTo?.[index]?.[1]),
              });
              listDataPoint.push({
                x: new Date(v?.[0]),
                y: parseFloat(v?.[1]) / parseFloat(listCoinTo?.[index]?.[1]),
              });
            });
            setSecondList([...listSecondTemp]);
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
        <p
          onClick={async () => {
            await handlePrint();
            await setCheckClickedSelect(!checkClickedSelect);
          }}
          className={styles.px}
        >
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
        <p
          onClick={async () => {
            await downloadScreenshot("png");
            await setCheckClickedSelect(!checkClickedSelect);
          }}
          className={styles.px}
        >
          Download PNG image
        </p>
      ),
      key: "0",
    },
    {
      label: (
        <p
          onClick={async () => {
            await downloadScreenshot("jpeg");
            await setCheckClickedSelect(!checkClickedSelect);
          }}
          className={styles.px}
        >
          Download JPEG image
        </p>
      ),
      key: "1",
    },
    {
      label: (
        <p
          onClick={async () => {
            await createPDF();
            await setCheckClickedSelect(!checkClickedSelect);
          }}
          className={styles.px}
        >
          Download PDF document
        </p>
      ),
      key: "2",
    },
    {
      label: (
        <p
          onClick={async () => {
            await downloadScreenshot("svg");
            await setCheckClickedSelect(!checkClickedSelect);
          }}
          className={styles.px}
        >
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
    charts: [
      {
        zoomEnabled: true,
        axisX: {
          // title: "Bounce Rate",
          valueFormatString: "DD/MM/YYYY HH:MM:ss", // MMM DD YYYY
          crosshair: {
            enabled: true,
            snapToDataPoint: true,
            valueFormatString: "DD/MM/YYYY HH:MM:ss", // MMM DD YYYY
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
          title: "PRICE",
          prefix: "", // $
          crosshair: {
            enabled: true,
            snapToDataPoint: true,
            valueFormatString: "#,###.##",
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
            yValueFormatString: "#,###.##",
            xValueFormatString: "DD/MM/YYYY HH:MM:ss", // MMM DD YYYY
            dataPoints: dataPoints,
            // toolTipContent:
            //   '<span style="color:#4F81BC">Year: {x}</span><br/>Min: {y[0]}°C,<br/> Max: {y[1]}°C',
          },
        ],
      },
      {
        // zoomEnabled: true,
        height: 100,
        axisX: {
          valueFormatString: "DD/MM/YYYY", // MMM DD YYYY
          crosshair: {
            enabled: true,
            snapToDataPoint: true,
            valueFormatString: "DD/MM/YYYY HH:MM:ss", // MMM DD YYYY
          },
        },
        axisY: {
          title: "DOM",
          prefix: "",
          crosshair: {
            enabled: true,
            snapToDataPoint: true,
            valueFormatString: "#,###.##",
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
            yValueFormatString: "#,###.##",
            xValueFormatString: "DD/MM/YYYY HH:MM:ss", // MMM DD YYYY
            type: "column",
            dataPoints: dataPoints,
          },
        ],
      },
    ],
    rangeSelector: {
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
      // buttons: [
      //   {
      //     label: "1M",
      //     range: 1,
      //     rangeType: "month",
      //   },
      //   {
      //     label: "3M",
      //     range: 3,
      //     rangeType: "month",
      //   },
      //   {
      //     label: "1Y",
      //     range: 1,
      //     rangeType: "year",
      //   },
      //   {
      //     label: "All",
      //     // range: null,
      //     rangeType: "all",
      //   },
      // ],
      // enabled: false,
    },
    navigator: {
      dynamicUpdate: true,
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
      slider: {
        minimum: new Date("2016-05-01"),
        maximum: new Date("2018-07-01"),
      },
      axisX: {
        labelFontWeight: "bolder",
        valueFormatString: "DD/MM/YYYY", // MMM DD YYYY
        labelFontColor: "#999999",
      },
    },
    // rangeSelector: {
    //   enabled: false,
    // },
  };
  useEffect(() => {
    setLoading(true);
    // handleCheckCoin();
    handleCoupleCoin(Object.values(TimePeriod)[indexRange]);
    setStatusClearDate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusClearDate]);
  useEffect(() => {
    const handleResize = (width?: number) => {
      setBoxWidth(width || 0);
    };
    handleResize(gridItemRef.current?.clientWidth || 0);
    window.addEventListener("resize", () =>
      handleResize(gridItemRef?.current?.clientWidth || 0)
    );
    return () => {
      window.removeEventListener("resize", () => handleResize());
    };
  }, [gridItemRef]);
  return (
    <div className={styles.coins} ref={gridItemRef}>
      {loading && <Loading />}
      {listChartModal?.length > 0 && (
        <div>
          <div>
            {!zoom.status && (
              <h3 className={styles.new}>Total Cryptocurrency Price</h3>
            )}
            <div id="pdf" ref={ref}>
              <div className={styles.title}>
                {/* <div className={styles.title__child}>
                  <p className={styles.title__child__zoom}>Zoom</p>
                  <div className={styles.title__child__range}>
                    {listTimeRange.map((v, index) => (
                      <p
                        key={index}
                        onClick={() => {
                          const indexRange = Object.values(
                            TimePeriod
                          ).findIndex((values) => values === v.value);
                          updateUrl(
                            "range",
                            indexRange > -1
                              ? Object.keys(TimePeriod)[indexRange]
                              : "1D"
                          );
                          setLoading(true);
                          // setIndexClicked(index);
                          handleCoupleCoin(
                            Object.values(TimePeriod)[indexRange]
                          );
                        }}
                        className={`${styles.title__child__range__item} ${
                          indexRange === index
                            ? styles.title__child__range__itemClicked
                            : ""
                        }`}
                      >
                        {v.key}
                      </p>
                    ))}
                  </div>
                </div> */}
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
                        src={!zoom.status ? expand : noExpand}
                        onClick={() =>
                          setZoom({
                            ...zoom,
                            status: !zoom.status,
                            heightDefault: !zoom.status ? 500 : 300,
                          })
                        }
                        alt=""
                        className={styles.title__child__rangeIcon__item}
                      />
                    </div>
                    <div className={styles.title__child__rangeIcon}>
                      <Dropdown
                        onOpenChange={() =>
                          setCheckClickedSelect(!checkClickedSelect)
                        }
                        menu={{ items }}
                        trigger={["click"]}
                      >
                        <FontAwesomeIcon
                          className={styles.title__child__rangeIcon__item}
                          icon={faBars}
                        />
                      </Dropdown>
                    </div>
                  </div>
                  {/* <div>
                    <RangePickerCompHOC
                      setStatusClearDate={setStatusClearDate}
                      setListChartModal={setListChartModal}
                      listChartModal={listChartModal}
                    />
                  </div> */}
                </div>
              </div>
              {/* <div className={styles.chartLightweight}>
                {!checkClickedSelect && (
                  <div
                    className={`${styles.chartLightweight__title} ${
                      !zoom.status
                        ? styles.chartLightweight__titleHeight300
                        : styles.chartLightweight__titleHeight550
                    }`}
                  >
                    <h3
                      className={
                        title.vol ? styles.titleShow : styles.titleHidden
                      }
                    >
                      <b>DOM</b>
                    </h3>
                    <h3
                      className={`${styles.chartLightweight__title__market} ${
                        title.marketCap ? styles.titleShow : styles.titleHidden
                      }`}
                    >
                      <b>PRICE</b>
                    </h3>
                  </div>
                )}

                <div className={styles.coupleChart}>
                  <ChartComponentHOC
                    type="above"
                    from={from}
                    to={to}
                    title={title}
                    heightDefault={zoom.heightDefault}
                    range={queryParam["range"]}
                    data={listChartModal?.length > 0 ? listChartModal : []}
                  />
                  <ChartComponentHOC
                    type="bottom"
                    from={from}
                    to={to}
                    title={title}
                    heightDefault={zoom.heightDefault}
                    range={queryParam["range"]}
                    data={listChartModal?.length > 0 ? listChartModal : []}
                  />
                </div>
              </div> */}
              {/* <SecondaryChart
                data={secondList?.length > 0 ? secondList : []}
                height={Math.floor(height * 0.05)}
                width={boxWidth}
                setListChartModal={setListChartModal}
                margin={{
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                }}
              /> */}
              <CanvasJSStockChart
                containerProps={containerProps}
                options={options}
                /* onRef = {ref => this.chart = ref} */
              />
              <div className={styles.market}>
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
              </div>
            </div>
          </div>
          {/* <div className={styles.range}>
            <Radio.Group
              className={styles.range__btn}
              onChange={(e) => {
                const { value } = e.target;
                const indexRange = Object.values(TimePeriod).findIndex(
                  (values) => values === value
                );
                updateUrl(
                  "range",
                  indexRange > -1 ? Object.keys(TimePeriod)[indexRange] : "1D"
                );
                setLoading(true);
                handleCoupleCoin(Object.values(TimePeriod)[indexRange]);
              }}
              defaultValue={
                indexRange > -1 ? Object.values(TimePeriod)[indexRange] : "1"
              }
              buttonStyle="solid"
            >
              {listTimeRange?.length > 0 &&
                listTimeRange.map((values) => {
                  return (
                    <Radio.Button key={values.id} value={values.value}>
                      {values.key}
                    </Radio.Button>
                  );
                })}
            </Radio.Group>
          </div> */}
          {/* <div className={styles.coins__title}>
            <h3>
              <b style={{ marginRight: "0.35rem" }}>
                {from && to && `${from.toUpperCase()} to ${to.toUpperCase()}`}
              </b>
              Pair Chart
            </h3>
            {statusHeart ? (
              <HeartFilled
                onClick={handleUpdateStatusHeart}
                className={styles.chart__heart}
              />
            ) : (
              <HeartOutlined
                onClick={handleUpdateStatusHeart}
                className={styles.chart__heart}
              />
            )}
          </div> */}
          {/* <h3 className={styles.title}>My Watchlist</h3>
          <DrawerComponent
            coinCurrent={
              from && to && `${from.toUpperCase()}/${to.toUpperCase()}`
            }
            priceCurrent={
              listChartModal?.length > 0
                ? listChartModal[listChartModal.length - 1].value
                : 0
            }
            handleCloseDrawer={handleCloseDrawer}
            list={listWatchedState}
          /> */}
        </div>
      )}
    </div>
  );
};
export default Coins;
