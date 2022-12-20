import React from "react";
import { scaleLinear, scaleTime } from "@visx/scale";
import { LinearGradient } from "@visx/gradient";
import { Brush } from "@visx/brush";
import BaseBrush from "@visx/brush/lib/BaseBrush";
import { Bounds } from "@visx/brush/lib/types";
import { max, min, extent } from "d3-array";
import { SecondaryChartProps } from "./interfaces";
import { SC } from "./styled";
import { DataProps } from "../PrimaryChart/interfaces";
import AreaChart from "../AreaChart";
import { MarketContext } from "../../store/MarketProvider";
import moment from "moment";

const SecondaryChart: React.FC<SecondaryChartProps> = ({
  data,
  width = 10,
  setListChartModal,
  height,
  margin = { top: 0, right: 0, bottom: 0, left: 0 },
}) => {
  const {
    filteredDataState: { setFilteredData },
  } = React.useContext(MarketContext);
  const brushRef = React.useRef<BaseBrush | null>(null);
  // bounds
  const xMax = Math.max(width - margin.left - margin.right, 0);
  const yMax = Math.max(height - margin.top - margin.bottom, 0);
  // accessors
  const getDate = (d: DataProps) => new Date(d.date);
  const getStockValue = (d: DataProps) => d.price;

  // scales
  const dateScale = React.useMemo(() => {
    return scaleTime({
      range: [0, xMax],
      domain: extent(data, getDate) as [Date, Date],
    });
  }, [xMax, data]);
  const priceScale = React.useMemo(() => {
    return scaleLinear({
      range: [yMax + margin.top, margin.top],
      domain: [min(data, getStockValue) || 0, max(data, getStockValue) || 0],
      nice: true,
    });
    //
  }, [margin.top, yMax, data]);

  const initialBrushPosition = React.useMemo(
    () => ({
      start: { x: dateScale(getDate(data[0])) },
      end: { x: dateScale(getDate(data[data.length - 1])) - 250 },
    }),
    [dateScale, data]
  );

  React.useEffect(() => {
    if (data.length) {
      setFilteredData(data);
    }
  }, [data, setFilteredData]);

  const onBrushChange = (domain: Bounds | null) => {
    if (!domain) return;
    const { x0, x1, y0, y1 } = domain;
    const filteredData = data.filter((s) => {
      const x = getDate(s).getTime();
      const y = getStockValue(s);
      return x > x0 && x < x1 && y > y0 && y < y1;
    });
    const listRefactor = filteredData.map((values) => {
      return {
        time: moment(values.date).unix(),
        value: values.price,
      };
    });
    setListChartModal([...listRefactor]);
    setFilteredData(filteredData);
  };
  return (
    <SC.DivComp>
      <svg width={width} height={height}>
        <AreaChart
          hideLeftAxis
          data={data}
          width={width}
          margin={{ ...margin }}
          yMax={yMax}
          xScale={dateScale}
          yScale={priceScale}
          gradientColor="#85A5FF"
        >
          <LinearGradient
            id="brush-gradient"
            from="#EFF3FF"
            fromOpacity={0.5}
            to="#DDE4FF"
            toOpacity={0.25}
          />

          <Brush
            innerRef={brushRef}
            xScale={dateScale}
            yScale={priceScale}
            width={xMax}
            height={yMax}
            margin={{ ...margin }}
            handleSize={8}
            resizeTriggerAreas={["left", "right"]}
            brushDirection="horizontal"
            initialBrushPosition={initialBrushPosition}
            onChange={onBrushChange}
            onClick={() => {
              setFilteredData(data);
            }}
            selectedBoxStyle={{
              fill: `url(#brush-gradient)`,
              stroke: "#808a9d",
            }}
          />
        </AreaChart>
      </svg>
    </SC.DivComp>
  );
};

export default SecondaryChart;
