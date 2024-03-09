import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  cryptoListApi,
  useGetCryptoLatestListQuery,
  useGetSingleCryptoLivePriceQuery,
  useGetSingleCryptoTrackQuery,
} from "./rtkQuery/apis/cryptoListApi";
import { useDispatch } from "react-redux";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [fetchInterval, setFetchInterval] = useState(5000);

  const [cryptoData, setCryptoData] = useState({
    labels: [0, 0, 0, 0, 0],
    datasets: [
      {
        label: "loading...",
        data: [0, 0, 0, 0, 0],
        lineTension: 0.1,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [selectedCryptoDetails, setSelectedCryptoDetails] = useState({
    name: "Bitcoin",
    symbol: "BTC",
  });

  const [chartData, setChartData] = useState(null);

  const [total, setTotal] = useState(0);

  const [searchText, setSearchText] = useState("");

  const {
    data: cryptoList,
    isError,
    isLoading,
    error,
  } = useGetCryptoLatestListQuery({
    limit,
    page,
    cacheTime: 0,
  });

  const {
    data: cryptoLivePrice,
    isError: isCryptoPriceError,
    isLoading: isCryptoPriceLoading,
    error: CryptoPriceError,
    refetch: refetchCryptoPrice,
  } = useGetSingleCryptoLivePriceQuery({
    cryptoSymbol: selectedCryptoDetails?.symbol || "BTC",
    cacheTime: 0,
  });

  const {
    data: cryptoLiveTrack,
    isError: isCryptoTrackError,
    isLoading: isCryptoTrackLoading,
    error: CryptoTrackError,
    refetch: refetchCryptoTrack,
  } = useGetSingleCryptoTrackQuery({
    cryptoSymbol: selectedCryptoDetails?.symbol || "BTC",
    limit: 30,
    cacheTime: 0,
  });

  const options = useMemo(() => {
    return {
      scales: {
        y: {
          ticks: {
            callback: function (value, index, values) {
              // Format the tick label with decimal precision
              return value.toFixed(15); // Adjust the number of decimal places as needed
            },
          },
        },
      },
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Chart for " + selectedCryptoDetails?.name,
        },
      },
    };
  }, [selectedCryptoDetails]);

  const handleNextPage = () => {
    setPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    setPage((prev) => (prev <= 1 ? 1 : prev - 1));
  };

  const handleSearchTextChange = (e) => {
    setSearchText(e.target.value);
  };

  useEffect(() => {
    if (!!searchText) {
      const id = setTimeout(() => {
        setCryptoData(
          cryptoList?.Data?.filter(({ CoinInfo: { Id, FullName: name } }) =>
            name.toLowerCase().includes(searchText.toLowerCase())
          )
        );
      }, 500);

      return () => {
        clearTimeout(id);
      };
    } else {
      setCryptoData(cryptoList?.Data || []);
    }
  }, [searchText]);

  useEffect(() => {
    if (cryptoLivePrice) {
      setChartData({
        labels: cryptoLiveTrack?.Data?.Data.map((item) =>
          new Date(item?.time).getFullYear()
        ),
        datasets: [
          {
            label: "Open",
            data: cryptoLiveTrack?.Data?.Data.map((item) => {
              return item?.open.toString();
            }),
            lineTension: 0.1,
            borderColor: "rgb(255, 99, 132)",
            backgroundColor: "rgba(255, 99, 132, 0.5)",
          },
          {
            label: "Low",
            data: cryptoLiveTrack?.Data?.Data.map((item) => {
              return item?.low.toString();
            }),
            lineTension: 0.1,
            borderColor: "rgb(53, 162, 235)",
            backgroundColor: "rgba(53, 162, 235, 0.5)",
          },
          {
            label: "High",
            data: cryptoLiveTrack?.Data?.Data.map((item) => {
              return item?.high.toString();
            }),
            lineTension: 0.1,
            borderColor: "rgb(255,164,9)",
            backgroundColor: "rgba(255,164,9,0.5)",
          },
          {
            label: "Close",
            data: cryptoLiveTrack.Data.Data.map((item) => {
              console.log(item.close);
              return item?.close.toString();
            }),
            lineTension: 0.1,
            borderColor: "rgb(144,50,210)",
            backgroundColor: "rgba(144,50,210,0.5)",
          },
        ],
      });
    }
  }, [cryptoLiveTrack]);

  const dispatch = useDispatch();

  useEffect(() => {
    const liveTrackIntervalId = setInterval(() => {
      // refetchCryptoTrack();
      dispatch(cryptoListApi.util.invalidateTags(["CryptoData"]));
    }, fetchInterval);

    return () => {
      clearInterval(liveTrackIntervalId);
    };
  }, [refetchCryptoTrack]);

  useEffect(() => {
    const liveCryptoPriceIntervalId = setInterval(() => {
      // refetchCryptoPrice();
      dispatch(cryptoListApi.util.invalidateTags(["CryptoData"]));
    }, fetchInterval);

    return () => {
      clearInterval(liveCryptoPriceIntervalId);
    };
  }, [refetchCryptoPrice]);

  useEffect(() => {
    console.log("New Data==> PAGE=>", page, cryptoList?.Data);
    setCryptoData(cryptoList?.Data || []);
    const count = cryptoList?.MetaData?.Count;
    if (count) {
      setTotal(Math.ceil(count / limit));
    }
  }, [cryptoList]);

  if (isLoading) {
    return <p className="text-lg text-center">Loading ...</p>;
  }

  if (isError) {
    return <p>Some Error Occured! {error}</p>;
  }

  return (
    <>
      <main className="flex min-h-screen border-[1px] p-4 w-[100%] gap-3 max-[1519px]:flex-col">
        <div className="container min-w-screen flex flex-col gap-5">
          <div className="shadow p-5">
            {chartData && (
              <Line className="w-[100%]" options={options} data={chartData} />
            )}
          </div>
          <div className="shadow rounded-lg p-5 pt-10 pb-10 flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <p className="font-extrabold text-2xl text-orange-600 underline">
                {selectedCryptoDetails?.name} ({selectedCryptoDetails?.symbol})
              </p>
              <p className="font-extrabold text-3xl">
                ${" "}
                {Object.values(cryptoLivePrice || {})
                  ?.map((usbObject) => usbObject.USD)
                  ?.join("")}
              </p>
              {/* <div className="flex gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-gray-500 text-sm text-center font-semibold">
                    Mkt. Cap.
                  </p>
                  <p className="border border-gray-200 font-semibold rounded-md p-1 pl-3 pr-3">
                    {selectedCryptoDetails?.market_cap}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-gray-500 text-sm text-center font-semibold">
                    Low/High 24h
                  </p>
                  <p className="border border-gray-200 font-semibold rounded-md p-1 pl-3 pr-3">
                    {selectedCryptoDetails?.LOW24HOUR} -{" "}
                    {selectedCryptoDetails?.HIGH24HOUR}
                  </p>
                </div>
              </div> */}
            </div>
          </div>
          {/* <div className="p-4">
            <label htmlFor="table-duration" className="sr-only">
              FetchInterval
            </label>
            <div className="relative mt-1">
              <input
                onChange={(e) => {
                  setFetchInterval(e.target.value * 1000);
                }}
                type="number"
                id="table-duration"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-80 pl-3.5 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Track Interval (default: 10sec)"
              />
            </div>
          </div> */}
        </div>
        <div className="flex flex-col w-[100%]">
          <div className="container justify-center mx-auto flex flex-col">
            <div className="overflow-x-auto shadow-md sm:rounded-lg">
              <div className="inline-block min-w-full align-middle dark:bg-gray-800">
                <div className="p-4">
                  <label htmlFor="table-search" className="sr-only">
                    Search
                  </label>
                  <div className="relative mt-1">
                    <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-500 dark:text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          fillRule="evenodd"
                          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      onChange={handleSearchTextChange}
                      type="text"
                      id="table-search"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-80 pl-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Search for crypto"
                    />
                  </div>
                </div>
                <div className="overflow-hidden">
                  <table className="min-w-full table-fixed dark:divide-gray-700 divide-y divide-green-400 ">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th
                          scope="col"
                          className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-700 uppercase dark:text-gray-400">
                          #
                        </th>
                        <th
                          scope="col"
                          className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-700 uppercase dark:text-gray-400">
                          Name
                        </th>
                        <th
                          scope="col"
                          className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-700 uppercase dark:text-gray-400">
                          price
                        </th>
                        <th
                          scope="col"
                          className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-700 uppercase dark:text-gray-400">
                          1h %
                        </th>
                        <th
                          scope="col"
                          className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-700 uppercase dark:text-gray-400">
                          24h %
                        </th>
                        <th
                          scope="col"
                          className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-700 uppercase dark:text-gray-400">
                          Market Cap
                        </th>
                        <th
                          scope="col"
                          className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-700 uppercase dark:text-gray-400">
                          Volumn(24h)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                      {cryptoData?.length > 0 &&
                        cryptoData?.map(
                          (
                            {
                              CoinInfo: {
                                Id,
                                FullName: name,
                                ImageUrl,
                                Name: symbol,
                              },
                              DISPLAY: {
                                USD: {
                                  PRICE: price,
                                  VOLUME24HOURTO: volume_24h,
                                  CHANGE24HOUR: volume_change_24h,
                                  CHANGEPCTHOUR: percent_change_1h,
                                  CHANGEPCT24HOUR: percent_change_24h,
                                  MKTCAP: market_cap,
                                  HIGH24HOUR,
                                  LOW24HOUR,
                                } = {},
                              } = {},
                            } = {},
                            index
                          ) => (
                            <tr
                              onClick={() => {
                                if (symbol) {
                                  setSelectedCryptoDetails({
                                    name,
                                    symbol,
                                    price,
                                    market_cap,
                                    HIGH24HOUR,
                                    LOW24HOUR,
                                  });
                                } else {
                                  alert(
                                    "Symbol data not found for this Crypto"
                                  );
                                }
                              }}
                              key={index}
                              className="hover:bg-gray-100 dark:hover:bg-gray-700">
                              <td className="p-4 w-4">
                                <div className="flex items-center">{Id}</div>
                              </td>
                              <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                <img
                                  className="w-7 h-7 aspect-square inline mr-3"
                                  src={`https://cryptocompare.com/${ImageUrl}`}
                                />
                                {name}{" "}
                                <span className="text-gray-500">
                                  ({symbol})
                                </span>
                              </td>
                              <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                {price || "No Data"}
                              </td>
                              <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                {percent_change_1h
                                  ? percent_change_1h + "%"
                                  : "No Data"}
                              </td>
                              <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                {percent_change_24h
                                  ? percent_change_24h + "%"
                                  : "No Data"}
                              </td>

                              <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                {market_cap || "No Data"}
                              </td>
                              <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                {volume_24h || "No Data"}
                              </td>
                            </tr>
                          )
                        )}
                    </tbody>
                  </table>
                </div>
                <div className="min-h-[1px] bg-gray-300 m-[15px_0_0_0]"></div>
                <div className="p-4 flex items-center justify-end h-fit gap-4">
                  <button
                    disabled={page <= 1}
                    onClick={handlePrevPage}
                    className="p-[8px_30px] rounded-lg text-white font-semibold text-1xl h-fit bg-gray-500 disabled:bg-gray-100 disabled:text-black disabled:cursor-not-allowed">
                    Prev
                  </button>
                  <span className="text-lg">
                    {page} / {total}
                  </span>
                  <button
                    disabled={total <= page}
                    onClick={handleNextPage}
                    className="p-[8px_30px] rounded-lg text-white font-semibold text-1xl h-fit bg-gray-500 disabled:bg-gray-100 disabled:text-black disabled:cursor-not-allowed">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default App;
