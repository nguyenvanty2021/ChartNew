import React, { useEffect } from "react";
import { scaleLinear, scaleTime } from "@visx/scale";
import { LinearGradient } from "@visx/gradient";
import { Brush } from "@visx/brush";
import BaseBrush, {
  BaseBrushState,
  UpdateBrush,
} from "@visx/brush/lib/BaseBrush";
import { Bounds } from "@visx/brush/lib/types";
import { max, min, extent } from "d3-array";
import { SecondaryChartProps } from "./interfaces";
import { SC } from "./styled";
import { DataProps } from "../PrimaryChart/interfaces";
import AreaChart from "../AreaChart";
import { MarketContext } from "../../store/MarketProvider";
import moment from "moment";
import { Group } from "@visx/group";
import { BrushHandleRenderProps } from "@visx/brush/lib/BrushHandle";
// We need to manually offset the handles for them to be rendered at the right position
function BrushHandle({ x, height, isBrushActive }: BrushHandleRenderProps) {
  const pathWidth = 8;
  const pathHeight = 15;
  if (!isBrushActive) {
    return null;
  }
  return (
    <Group left={x + pathWidth / 2} top={(height - pathHeight) / 2}>
      <path
        fill="#f2f2f2"
        d="M -4.5 0.5 L 3.5 0.5 L 3.5 15.5 L -4.5 15.5 L -4.5 0.5 M -1.5 4 L -1.5 12 M 0.5 4 L 0.5 12"
        stroke="#999999"
        strokeWidth="1"
        style={{ cursor: "ew-resize" }}
      />
    </Group>
  );
}
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
      start: { x: dateScale(getDate(data[0])) + 50 },
      end: { x: dateScale(getDate(data[data.length - 1])) - 50 },
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
    if (listRefactor?.length > 0) {
      setListChartModal([...listRefactor]);
      setFilteredData(filteredData);
    }
  };
  const handleResetClick = () => {
    if (brushRef?.current) {
      const updater: UpdateBrush = (prevBrush) => {
        const newExtent = brushRef.current!.getExtent(
          initialBrushPosition.start,
          initialBrushPosition.end
        );

        const newState: BaseBrushState = {
          ...prevBrush,
          start: { y: newExtent.y0, x: newExtent.x0 },
          end: { y: newExtent.y1, x: newExtent.x1 },
          extent: newExtent,
        };
        return newState;
      };
      brushRef.current.updateBrush(updater);
    }
  };
  useEffect(() => {
    handleResetClick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
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
            renderBrushHandle={(props) => <BrushHandle {...props} />}
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
