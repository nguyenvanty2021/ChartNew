import expand from "./../../assets/img/expand.png";
import noExpand from "./../../assets/img/noExpand.png";
import styles from "./styles.module.scss";
import { createRef, useCallback, useEffect, useRef, useState } from "react";
import coinApi from "../../api/coinApi";
import {
  Colors,
  notifyTime,
  Status,
  Time,
  TimeFilters,
  TimePeriod,
} from "../../constants/enum";
import { getQueryParam } from "../../utils/query";
import Loading from "../../components/Loading";
import { useParams } from "react-router-dom";
import { notify } from "../../utils/notification";
import numeral from "numeral";
import moment from "moment";
import Highcharts from "highcharts/highstock";
import HighchartsReact from "highcharts-react-official";
import dataJson from "../../api/market_dominance_data.json";
import exporting from "highcharts/modules/exporting.js";
import { debounce } from "../../utils/utils";
import { ListRange, ListWatchedProps, SizeProps } from "../../models";
import { handleFormatPrice } from "../../utils/format";
exporting(Highcharts);
const Coins = () => {
  const [statusClearDate, setStatusClearDate] = useState<boolean>(false);
  const params = useParams();
  const [indexScale, setIndexScale] = useState<number>(0);
  const listScale: string[] = ["Linear Scale", "Log Scale"];
  const [zoom, setZoom] = useState<boolean>(false);
  const { from, to }: any = params;
  const queryParam = getQueryParam<any>();
  const local: any = localStorage?.getItem("listWatched");
  const [listWatchedState, setListWatchedState] = useState<ListWatchedProps[]>(
    local ? JSON.parse(local) : []
  );
  const size: SizeProps = {
    normal: 500,
    zoom: 675,
  };
  const [listChartModal, setListChartModal] = useState<any[]>([]);
  const indexRange = Object.keys(TimePeriod).findIndex(
    (values) => values === queryParam["range"]
  );
  const ref: any = createRef();
  const gridItemRef: any = useRef<HTMLDivElement>(null);
  const [listDataChart, setListDataChart] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [listChartCanvas, setListChartCanvas] = useState<any>(dataJson[0].data);
  const option1 = {
    tooltip: {
      split: false,
      shared: true,
      crosshairs: true,
    },
    chart: {
      zoomType: "x",
      height: !zoom ? size.normal : size.zoom,
    },
    rangeSelector: {
      allButtonsEnabled: true,
      selected: 6,
      buttons: ListRange,
    },
    legend: {
      enabled: true,
    },
    yAxis: [
      {
        opposite: false,
        labels: {
          align: "right",
          x: -15,
          style: {
            color: Colors.COLOR_7CB5EC,
          },
        },
        plotLines: [
          {
            value: 0,
            width: 2,
            color: "silver",
          },
        ],
        title: {
          enabled: true,
          text: "Price",
          style: {
            color: Colors.COLOR_7CB5EC,
          },
        },
        height: "80%",
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
            color: Colors.COLOR_434348,
          },
        },
        title: {
          reserveSpace: false,
          text: "BTC Dom",
          style: {
            color: Colors.COLOR_434348,
          },
        },
        top: "80%",
        height: "20%",
        offset: 0,
      },
    ],
    series: [
      {
        type: "area",
        name: "Price",
        id: "aapl-ohlc",
        color: Colors.COLOR_7CB5EC,
        fillColor: {
          linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
          stops: [
            [0, Colors.COLOR_7CB5EC],
            [1, Highcharts.color(Colors.COLOR_7CB5EC).setOpacity(0.1).get()],
          ],
        },
        tooltip: {
          valueDecimals: handleFormatPrice(listChartCanvas[0][1]),
        },
        data: listDataChart?.length > 0 ? listDataChart : [],
      },
      {
        id: "aapl-volume",
        name: "BTC Dom",
        color: Colors.COLOR_434348,
        tooltip: {
          valueDecimals: 0,
          valueSuffix: "%",
        },
        data: listChartCanvas?.length > 0 ? listChartCanvas : [],
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
          },
        },
      ],
    },
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleCoupleCoin = useCallback(
    debounce(async () => {
      try {
        const TimeStampBetween2Days = 86400000;
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
            const index = listChartCanvas.findIndex(
              (v) => v[0] === listDataChartTemp[0][0]
            );
            const resultFinish = listChartCanvas.slice(index);
            const listTempDom: any = [];
            resultFinish.forEach((v, i) => {
              if (
                i === resultFinish.length - 1 ||
                v[0] + TimeStampBetween2Days === resultFinish[i + 1][0]
              ) {
                listTempDom.push(v);
              } else {
                listTempDom.push(v);
                listTempDom.push([v[0] + TimeStampBetween2Days, v[1]]);
              }
            });
            setListChartCanvas([...listTempDom]);
            setListDataChart([...listDataChartTemp]);
            setListChartModal([...listTemp]);
            // setDataPoints([...listDataPoint]);
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
            const index = listChartCanvas.findIndex(
              (v) => v[0] === listDataChartTemp[0][0]
            );
            setListChartCanvas(listChartCanvas.slice(index));
            setListDataChart([...listDataChartTemp]);
            setListChartModal([...listTemp]);
            // setDataPoints([...listDataPoint]);
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
            const index = listChartCanvas.findIndex(
              (v) => v[0] === listDataChartTemp[0][0]
            );
            setListChartCanvas(listChartCanvas.slice(index));
            setListDataChart([...listDataChartTemp]);
            setListChartModal([...listTemp]);
            // setDataPoints([...listDataPoint]);
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
    }, Time.DEBOUNCE),
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
    }, Time.DEBOUNCE),
    []
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const [_, takeScreenShot] = useScreenshot({
  //   type: "image/jpeg",
  //   quality: 1.0,
  // });
  // const download = (image, { name = "img", extension = "jpg" } = {}) => {
  //   const a = document.createElement("a");
  //   a.href = image;
  //   a.download = createFileName(extension, name);
  //   a.click();
  // };
  // const downloadScreenshot = (typeImg: string) =>
  //   takeScreenShot(ref.current).then((e) =>
  //     download(e, {
  //       name: "chart",
  //       extension: typeImg,
  //     })
  //   );
  // const createPDF = async () => {
  //   const doc: any = document;
  //   const pdf = new jsPDF("portrait", "pt", "a4");
  //   const data = await html2canvas(doc.querySelector("#pdf"));
  //   const img = data.toDataURL("image/png");
  //   const imgProperties = pdf.getImageProperties(img);
  //   const pdfWidth = pdf.internal.pageSize.getWidth();
  //   const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width;
  //   pdf.addImage(img, "PNG", 0, 0, pdfWidth, pdfHeight);
  //   pdf.save("chart.pdf");
  // };
  // const handlePrint = useReactToPrint({
  //   content: () => ref.current,
  // });
  // const items: MenuProps["items"] = [
  //   {
  //     label: (
  //       // <PrintComponents trigger={<p className={styles.px}>Print chart</p>}>
  //       //   {/* <div ref={ref.current}>{ref}</div> */}
  //       //   {/* {doc.querySelector("#pdf")} */}
  //       //   {/* {doc.querySelector("#pdf")} */}
  //       //   content
  //       // </PrintComponents>
  //       <p onClick={() => handlePrint()} className={styles.px}>
  //         Print chart
  //       </p>
  //     ),
  //     key: "3",
  //   },
  //   {
  //     type: "divider",
  //   },
  //   {
  //     label: (
  //       <p onClick={() => downloadScreenshot("png")} className={styles.px}>
  //         Download PNG image
  //       </p>
  //     ),
  //     key: "0",
  //   },
  //   {
  //     label: (
  //       <p onClick={() => downloadScreenshot("jpeg")} className={styles.px}>
  //         Download JPEG image
  //       </p>
  //     ),
  //     key: "1",
  //   },
  //   {
  //     label: (
  //       <p onClick={() => createPDF()} className={styles.px}>
  //         Download PDF document
  //       </p>
  //     ),
  //     key: "2",
  //   },
  //   {
  //     label: (
  //       <p onClick={() => downloadScreenshot("svg")} className={styles.px}>
  //         Download SVG vector image
  //       </p>
  //     ),
  //     key: "4",
  //   },
  // ];
  // const options = {
  //   theme: "light2",
  //   // title: {
  //   //   text: "React StockChart with Date-Time Axis",
  //   // },
  //   //   subtitles: [
  //   //     {
  //   //       text: "Price-Volume Trend",
  //   //     },
  //   //   ],
  //   // animationEnabled: true,
  //   // exportEnabled: true,
  //   // rangeChanged: function (e) {
  //   //   rangeChangedTriggered = true;
  //   // },
  //   // rangeChanging: function (e) {
  //   //   console.log("Source: " + e.stockChart);
  //   // },
  //   // rangeChanged: function (e) {
  //   //   console.log("type : " + e.type + ", trigger : " + e.trigger);
  //   // },
  //   charts:
  //     title.marketCap && title.vol
  //       ? [
  //           {
  //             zoomEnabled: true,
  //             axisX: {
  //               // title: "Bounce Rate",
  //               valueFormatString: " MMM DD YYYY", // MMM DD YYYY
  //               crosshair: {
  //                 enabled: true,
  //                 snapToDataPoint: true,
  //                 valueFormatString: " MMM DD YYYY", // MMM DD YYYY
  //               },
  //               // lineThickness: 5,
  //               // tickLength: 0,
  //               // labelFormatter: function (e) {
  //               //   return "123";
  //               // },
  //             },
  //             // legend: {
  //             //   verticalAlign: "top",
  //             // },
  //             // legend: {
  //             //   verticalAlign: "top",
  //             //   cursor: "pointer",
  //             //   itemclick: function (e) {
  //             //     if (
  //             //       typeof e.dataSeries.visible === "undefined" ||
  //             //       e.dataSeries.visible
  //             //     ) {
  //             //       e.dataSeries.visible = false;
  //             //     } else {
  //             //       e.dataSeries.visible = true;
  //             //     }
  //             //     e.chart.render();
  //             //   },
  //             // },
  //             axisY: {
  //               title: "Price",
  //               titleFontWeight: "bold",
  //               titleFontColor: "#57B4E9",
  //               labelFontColor: "#57B4E9",
  //               labelFontWeight: "bold",
  //               prefix: "", // $
  //               crosshair: {
  //                 enabled: true,
  //                 snapToDataPoint: true,
  //                 valueFormatString: handleFormatCoinPriceChart(
  //                   dataPoints[0]?.y || 0
  //                 ),
  //               },
  //             },
  //             toolTip: {
  //               shared: true,
  //             },
  //             data: [
  //               {
  //                 // axisYType: "secondary",
  //                 // toolTipContent: "Week {x}: {y}%",
  //                 lineColor: "#57B4E9",
  //                 // markerSize: 10,
  //                 name: "PRICE",
  //                 // type: "splineArea",
  //                 // type: "area",
  //                 type: "spline",
  //                 // showInLegend: true,
  //                 // legendText: "MWp = one megawatt peak",
  //                 color: "#57B4E9",
  //                 yValueFormatString: handleFormatCoinPriceChart(
  //                   dataPoints[0]?.y || 0
  //                 ), // "#,###.##"
  //                 xValueFormatString: "DD/MM/YYYY HH:MM:ss", // MMM DD YYYY
  //                 // xValueType: "dateTime",
  //                 dataPoints: dataPoints,
  //                 toolTipContent:
  //                   '<p style="font-size:0.75rem;color:#000000;margin:0;padding:0;">{x}</p><div style="display:flex;justify-content:flex-start;align-items:center;margin-top:0.25rem;"><span style="width:0.8rem;height:0.8rem;border-radius:50%;margin:0;padding:0;background-color:#57B4E9;"></span><span style="margin-left:0.25rem;">Price: </span><b>{y}</b></div>',
  //                 // '<p style="width:2.5rem;height:2.5rem;background-color:red;" ></p><span style="color:#57B4E9">{x}</span><br/>PRICE: <b>{y}</b>',
  //               },
  //             ],
  //           },
  //           {
  //             // zoomEnabled: true,
  //             height: !zoom ? 90 : 130,
  //             axisX: {
  //               valueFormatString: " MMM DD YYYY", // MMM DD YYYY
  //               crosshair: {
  //                 enabled: true,
  //                 snapToDataPoint: true,
  //                 valueFormatString: " MMM DD YYYY", // MMM DD YYYY
  //               },
  //             },
  //             axisY: {
  //               title: "Dom",
  //               titleFontWeight: "bold",
  //               titleFontSize: 14,
  //               titleFontColor: "#767777",
  //               labelFontColor: "#767777",
  //               labelFontWeight: "bold",
  //               prefix: "",
  //               crosshair: {
  //                 enabled: true,
  //                 snapToDataPoint: true,
  //                 valueFormatString: handleFormatCoinPriceChart(
  //                   dataPoints[0]?.y || 0
  //                 ),
  //               },
  //               // tickLength: 0,
  //             },
  //             toolTip: {
  //               shared: true,
  //             },
  //             data: [
  //               {
  //                 name: "DOM",
  //                 color: "#767777",
  //                 yValueFormatString: handleFormatCoinPriceChart(
  //                   dataPoints[0]?.y || 0
  //                 ),
  //                 xValueFormatString: "DD/MM/YYYY HH:MM:ss", // MMM DD YYYY
  //                 type: "column",
  //                 dataPoints: title.vol ? dataPoints : [],
  //                 toolTipContent:
  //                   '<p style="font-size:0.75rem;color:#000000;margin:0;padding:0;">{x}</p><div style="display:flex;justify-content:flex-start;align-items:center;margin-top:0.25rem;"><span style="width:0.8rem;height:0.8rem;border-radius:50%;margin:0;padding:0;background-color:#767777;"></span><span style="margin-left:0.25rem;">Dom: </span><b>{y}</b></div>',
  //                 // '<p style="width:2.5rem;height:2.5rem;background-color:red;" ></p><span style="color:#57B4E9">{x}</span><br/>PRICE: <b>{y}</b>',
  //               },
  //             ],
  //           },
  //         ]
  //       : title.marketCap && !title.vol
  //       ? [
  //           {
  //             zoomEnabled: true,
  //             axisX: {
  //               // title: "Bounce Rate",
  //               valueFormatString: " MMM DD YYYY", // MMM DD YYYY
  //               crosshair: {
  //                 enabled: true,
  //                 snapToDataPoint: true,
  //                 valueFormatString: " MMM DD YYYY", // MMM DD YYYY
  //               },
  //               // lineThickness: 5,
  //               // tickLength: 0,
  //               // labelFormatter: function (e) {
  //               //   return "123";
  //               // },
  //             },
  //             // legend: {
  //             //   verticalAlign: "top",
  //             // },
  //             // legend: {
  //             //   verticalAlign: "top",
  //             //   cursor: "pointer",
  //             //   itemclick: function (e) {
  //             //     if (
  //             //       typeof e.dataSeries.visible === "undefined" ||
  //             //       e.dataSeries.visible
  //             //     ) {
  //             //       e.dataSeries.visible = false;
  //             //     } else {
  //             //       e.dataSeries.visible = true;
  //             //     }
  //             //     e.chart.render();
  //             //   },
  //             // },
  //             axisY: {
  //               title: "Price",
  //               prefix: "", // $
  //               crosshair: {
  //                 enabled: true,
  //                 snapToDataPoint: true,
  //                 valueFormatString: handleFormatCoinPriceChart(
  //                   dataPoints[0]?.y || 0
  //                 ),
  //               },
  //             },
  //             toolTip: {
  //               shared: true,
  //             },
  //             data: [
  //               {
  //                 // axisYType: "secondary",
  //                 // toolTipContent: "Week {x}: {y}%",
  //                 name: "PRICE",
  //                 // type: "splineArea",
  //                 // type: "area",
  //                 type: "spline",
  //                 // showInLegend: true,
  //                 // legendText: "MWp = one megawatt peak",
  //                 color: "#57B4E9",
  //                 yValueFormatString: handleFormatCoinPriceChart(
  //                   dataPoints[0]?.y || 0
  //                 ), // "#,###.##"
  //                 xValueFormatString: "DD/MM/YYYY HH:MM:ss", // MMM DD YYYY
  //                 // xValueType: "dateTime",
  //                 dataPoints: dataPoints,
  //                 toolTipContent:
  //                   '<p style="font-size:0.75rem;color:#000000;margin:0;padding:0;">{x}</p><div style="display:flex;justify-content:flex-start;align-items:center;margin-top:0.25rem;"><span style="width:0.8rem;height:0.8rem;border-radius:50%;margin:0;padding:0;background-color:#57B4E9;"></span><span style="margin-left:0.25rem;">Price: </span><b>{y}</b></div>',
  //                 // '<p style="width:2.5rem;height:2.5rem;background-color:red;" ></p><span style="color:#57B4E9">{x}</span><br/>PRICE: <b>{y}</b>',
  //               },
  //             ],
  //           },
  //         ]
  //       : !title.marketCap && title.vol
  //       ? [
  //           {
  //             // zoomEnabled: true,
  //             height: !zoom ? 90 : 130,
  //             axisX: {
  //               valueFormatString: " MMM DD YYYY", // MMM DD YYYY
  //               crosshair: {
  //                 enabled: true,
  //                 snapToDataPoint: true,
  //                 valueFormatString: " MMM DD YYYY", // MMM DD YYYY
  //               },
  //             },
  //             axisY: {
  //               title: "Dom",
  //               prefix: "",
  //               crosshair: {
  //                 enabled: true,
  //                 snapToDataPoint: true,
  //                 valueFormatString: handleFormatCoinPriceChart(
  //                   dataPoints[0]?.y || 0
  //                 ),
  //               },
  //               // tickLength: 0,
  //             },
  //             toolTip: {
  //               shared: true,
  //             },
  //             data: [
  //               {
  //                 name: "DOM",
  //                 color: "#767777",
  //                 yValueFormatString: handleFormatCoinPriceChart(
  //                   dataPoints[0]?.y || 0
  //                 ),
  //                 xValueFormatString: "DD/MM/YYYY HH:MM:ss", // MMM DD YYYY
  //                 type: "column",
  //                 dataPoints: title.vol ? dataPoints : [],
  //                 toolTipContent:
  //                   '<p style="font-size:0.75rem;color:#000000;margin:0;padding:0;">{x}</p><div style="display:flex;justify-content:flex-start;align-items:center;margin-top:0.25rem;"><span style="width:0.8rem;height:0.8rem;border-radius:50%;margin:0;padding:0;background-color:#767777;"></span><span style="margin-left:0.25rem;">Dom: </span><b>{y}</b></div>',
  //                 // '<p style="width:2.5rem;height:2.5rem;background-color:red;" ></p><span style="color:#57B4E9">{x}</span><br/>PRICE: <b>{y}</b>',
  //               },
  //             ],
  //           },
  //         ]
  //       : [],
  //   rangeSelector: {
  //     // selectedRangeButtonIndex: 1,
  //     // inputFields: {
  //     //   startValue: 1000,
  //     //   endValue: 5000,
  //     //   valueFormatString: "###0",
  //     // },
  //     // buttons: [
  //     //   {
  //     //     label: "1000",
  //     //     range: 1000,
  //     //     rangeType: "number",
  //     //   },
  //     //   {
  //     //     label: "2000",
  //     //     range: 2000,
  //     //     rangeType: "number",
  //     //   },
  //     //   {
  //     //     label: "5000",
  //     //     range: 5000,
  //     //     rangeType: "number",
  //     //   },
  //     //   {
  //     //     label: "All",
  //     //     rangeType: "all",
  //     //   },
  //     // ],
  //     selectedRangeButtonIndex: 6,
  //     buttonStyle: {
  //       labelFontSize: 13,
  //       backgroundColor: "#F7F7F7",
  //       borderColor: "#F7F7F7",
  //       backgroundColorOnHover: "#E6EBF5",
  //       backgroundColorOnSelect: "#E6EBF5",
  //       labelFontColorOnHover: "#000000",
  //     },
  //     inputFields: {
  //       style: {
  //         fontSize: 13,
  //         cursor: "pointer",
  //         borderColor: "white",
  //       },
  //     },
  //     buttons: [
  //       {
  //         label: "1d",
  //         range: 1,
  //         rangeType: "day",
  //       },
  //       {
  //         label: "7d",
  //         range: 7,
  //         rangeType: "day",
  //       },
  //       {
  //         label: "1m",
  //         range: 1,
  //         rangeType: "month",
  //       },
  //       {
  //         label: "3m",
  //         range: 3,
  //         rangeType: "month",
  //       },
  //       {
  //         label: "1y",
  //         range: 1,
  //         rangeType: "year",
  //       },
  //       {
  //         label: "YTD",
  //         // range: 1,
  //         rangeType: "ytd",
  //       },
  //       {
  //         label: "ALL",
  //         // range: null,
  //         rangeType: "all",
  //       },
  //     ],
  //     // enabled: false,
  //   },
  //   navigator: {
  //     dynamicUpdate: true,
  //     height: 35,
  //     slider: {
  //       maskInverted: true, // Change it to false
  //       maskColor: "#D9E0EF",
  //     },
  //     data: [
  //       {
  //         type: "spline",
  //         color: "#57B4E9",
  //         dataPoints: dataPoints,

  //         // name: "PRICE",
  //         // yValueFormatString: "#,###.##",
  //         // xValueFormatString: "DD/MM/YYYY", // MMM DD YYYY
  //       },
  //     ],
  //     // slider: {
  //     //   minimum: new Date("01-01-2016"),
  //     //   maximum: new Date("01-01-2018"),
  //     // },
  //     axisX: {
  //       labelFontWeight: "bolder",
  //       valueFormatString: "YYYY", // MMM DD YYYY
  //       labelFontColor: "#999999",
  //     },
  //   },
  //   // rangeSelector: {
  //   //   enabled: false,
  //   // },
  // };
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
    handleCoupleCoin(Object.values(TimePeriod)[indexRange]);
    setStatusClearDate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusClearDate]);
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
                  </div>
                </div>
              </div>
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
