import { Button, Col, Row, Table } from "antd";
import styles from "./App.module.scss";
import InputComponent from "./components/Input/index";
import { yupResolver } from "@hookform/resolvers/yup";
import { Link } from "react-router-dom";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import * as yup from "yup";
import { notifyTime, TimeFilters, TimePeriod } from "./constants/enum";
import { deleteUrl, getQueryParam, updateUrl } from "./utils/query";
import coinApi from "./api/coinApi";
import { notify } from "./utils/notification";
import Loading from "./components/Loading";
import { useState } from "react";
import { ColumnsType } from "antd/lib/table";
import { FormProps, listTimeRange, ListWatchedProps } from "./models";
import { handleFormatPrice } from "./utils/format";
export const DrawerComponent = ({
  list,
  priceCurrent,
  coinCurrent,
  handleCloseDrawer,
}: {
  list: ListWatchedProps[];
  priceCurrent: number;
  coinCurrent: string;
  handleCloseDrawer: (status: boolean) => void;
}) => {
  const columns: ColumnsType<ListWatchedProps> = [
    {
      title: "Pair",
      dataIndex: "pairOfCoins",
      key: "pairOfCoins",
      render: (_, record) => (
        <a
          onClick={() => handleCloseDrawer(false)}
          href={`/coins/${record.coinFrom}/${record.coinTo}?range=1D`}
          rel="noreferrer"
          target="_parent"
        >
          {`${record.coinFrom}/${record.coinTo}`.toUpperCase()}
        </a>
      ),
    },
    {
      title: "Current",
      dataIndex: "currentPrice",
      key: "currentPrice",
      render: (_, record) => {
        const total =
          parseFloat(record.priceCoinFrom) / parseFloat(record.priceCoinTo);
        return (
          <p>
            {priceCurrent !== 0 &&
            coinCurrent === `${record.coinFrom}/${record.coinTo}`.toUpperCase()
              ? priceCurrent.toFixed(handleFormatPrice(priceCurrent))
              : `${total.toFixed(handleFormatPrice(total))}`}
          </p>
        );
      },
    },
  ];
  return (
    <Row>
      <Col xs={24} sm={24} md={12} lg={6} xl={6}>
        <Table
          className={styles.table}
          columns={columns}
          pagination={false}
          bordered
          dataSource={list?.length > 0 ? list.filter((v) => v.watched) : []}
        />
      </Col>
    </Row>
  );
};
function App() {
  const queryParam = getQueryParam<any>();
  const [loading, setLoading] = useState<boolean>(false);
  const [coin, setCoin] = useState<string>("");
  const local: any = localStorage?.getItem("listWatched");
  const [listCheck, setListCheck] = useState<any>([]);
  const listWatched: ListWatchedProps[] = local ? JSON.parse(local) : [];
  const indexRange = Object.keys(TimePeriod).findIndex(
    (values) => values === queryParam["range"]
  );
  const objectCoin: any =
    listWatched?.length > 0 &&
    listWatched.find((v) => `${v.coinFrom}${v.coinTo}` === coin);
  const defaultValues: FormProps<string> = {
    pairOfCoin:
      objectCoin && objectCoin["coinFrom"] && objectCoin["coinTo"]
        ? `${objectCoin["coinFrom"]}/${objectCoin["coinTo"]}`
        : "",
    timeRange:
      indexRange > -1
        ? Object.values(TimePeriod)[indexRange]
        : listTimeRange?.length > 0
        ? listTimeRange[listTimeRange.length - 2].value
        : TimeFilters.P1Y,
  };
  const yupSchemaFindNewCV = yup.object().shape({
    pairOfCoin: yup.string().required("You have not entered pair of coin"),
    timeRange: yup.string().required("You have not entered time range"),
  });
  const methods = useForm<FormProps<string>>({
    mode: "onTouched",
    criteriaMode: "firstError",
    reValidateMode: "onChange",
    defaultValues: defaultValues,
    resolver: yupResolver(yupSchemaFindNewCV),
  });
  const handleReset = () => {
    deleteUrl("range");
    methods.reset({
      ...defaultValues,
      pairOfCoin: "",
      timeRange: TimePeriod["1Y"],
    });
    setListCheck([]);
  };
  const onSubmit: SubmitHandler<FormProps<string>> = async (
    object: FormProps<string>
  ) => {
    try {
      setLoading(true);
      const result = object.pairOfCoin.split("/");
      let idCoinFrom = "";
      let priceCoinFrom = "";
      let priceCoinTo = "";
      const listRespon = await Promise.all([
        coinApi.getCoinByName(result[0]),
        coinApi.getCoinByName(result[1]),
      ]);
      const index = Object.values(TimePeriod).findIndex(
        (values) => values === object?.timeRange || ""
      );
      if (
        listRespon.length === 2 &&
        result.length === 2 &&
        index > -1 &&
        listRespon[0]?.data?.coins?.length > 0 &&
        listRespon[1]?.data?.coins?.length > 0
      ) {
        setCoin(
          `${listRespon[0].data.coins[0].id}${listRespon[1].data.coins[0].id}`
        );
        setListCheck(listRespon);
        updateUrl("range", "ALL");
        if (listWatched?.length > 0) {
          const founded = listWatched.every(
            (el) =>
              `${el.coinFrom}${el.coinTo}` !==
              `${listRespon[0].data.coins[0].id}${listRespon[1].data.coins[0].id}`
          );
          if (founded) {
            listWatched.push({
              coinFrom: listRespon[0].data.coins[0].id,
              coinTo: listRespon[1].data.coins[0].id,
              idCoinFrom,
              watched: false,
              priceCoinFrom,
              priceCoinTo,
            });
            localStorage.setItem("listWatched", JSON.stringify(listWatched));
          }
        } else {
          localStorage.setItem(
            "listWatched",
            JSON.stringify([
              {
                coinFrom: listRespon[0].data.coins[0].id,
                coinTo: listRespon[1].data.coins[0].id,
                idCoinFrom,
                watched: false,
                priceCoinFrom,
                priceCoinTo,
              },
            ])
          );
        }
        notify("success", "Generate URL Successfully!", notifyTime);
      } else {
        notify("warning", "Pair of Coins is not valid!", notifyTime);
        setListCheck([]);
      }
    } catch (error) {
      notify("error", "Error!", notifyTime);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={styles.container}>
      {loading && <Loading />}
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <Row className={styles.container__title}>
            <Col xs={24} sm={11} md={11} lg={11} xl={11}>
              <h2>Generate chart too</h2>
            </Col>
            <Col xs={24} sm={11} md={11} lg={11} xl={11}>
              {/* <div className={styles.container__title__button}>
                <Button type="primary">My Watchlist</Button>
              </div> */}
            </Col>
          </Row>
          <Row className={styles.container__item}>
            <Col xs={24} sm={24} md={2} lg={2} xl={2}>
              <h3>Pair of Coins:</h3>
            </Col>
            <Col xs={24} sm={24} md={22} lg={22} xl={22}>
              <InputComponent
                type="text"
                name="pairOfCoin"
                placeholder="Example: btc/bnb"
              />
            </Col>
          </Row>
          <Row className={styles.container__item}>
            <Col xs={24} sm={24} md={24} lg={2} xl={2}></Col>
            <Col xs={24} sm={22} md={22} lg={22} xl={22}>
              <Row className={styles.container__item__submit}>
                <div>
                  <Button onClick={handleReset} type="primary" danger>
                    Reset
                  </Button>
                </div>
                <div>
                  <button
                    className={styles.container__item__submit__generate}
                    type="submit"
                  >
                    Generate URL
                  </button>
                </div>
                {listCheck?.length === 2 && (
                  <Link
                    to={{
                      pathname: `/coins/${objectCoin["coinFrom"]}/${objectCoin["coinTo"]}`,
                    }}
                  >
                    Generated Link
                  </Link>
                )}
              </Row>
            </Col>
          </Row>
        </form>
      </FormProvider>
    </div>
  );
}
export default App;
