import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// const VITE_TEST_PRO_API_KEY = import.meta.VITE_TEST_PRO_API_KEY;

// console.log(VITE_TEST_PRO_API_KEY);

// Define a service using a base URL and expected endpoints
export const cryptoListApi = createApi({
  reducerPath: "cryptoListApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://min-api.cryptocompare.com",
  }),
  tagTypes: ["CryptoData"],
  endpoints: (builder) => ({
    getCryptoLatestList: builder.query({
      query: ({ limit, page }) => ({
        url: `/data/top/mktcapfull?limit=${limit}&page=${page}&tsym=USD`,
        headers: {
          Accept: "application/json",
          authorization:
            "9257af99bab841aaf2b283e7acce739f5e9124c38eeb94a138c575c737e5f10e",
        },
      }),
      providesTags: ["CryptoData"],
    }),
    getSingleCryptoTrack: builder.query({
      query: ({ cryptoSymbol, limit } = {}) => ({
        url: `/data/v2/histoday?fsym=${cryptoSymbol}&tsym=USD&limit=${limit}`,
        headers: {
          Accept: "application/json",
          authorization:
            "9257af99bab841aaf2b283e7acce739f5e9124c38eeb94a138c575c737e5f10e",
        },
      }),
      providesTags: ["CryptoData"],
    }),
    getSingleCryptoLivePrice: builder.query({
      query: ({ cryptoSymbol }) => ({
        url: `/data/pricemulti?fsyms=${cryptoSymbol}&tsyms=USD`,
        headers: {
          Accept: "application/json",
          authorization:
            "9257af99bab841aaf2b283e7acce739f5e9124c38eeb94a138c575c737e5f10e",
        },
      }),
      providesTags: ["CryptoData"],
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetCryptoLatestListQuery,
  useGetSingleCryptoLivePriceQuery,
  useGetSingleCryptoTrackQuery,
} = cryptoListApi;
