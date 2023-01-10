import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
const axiosClient = axios.create({
  baseURL: "https://api.coingecko.com/api/v3/",
  headers: {
    "Content-Type": "application/json",
  },
});
axiosClient.interceptors.request.use(
  function (config: AxiosRequestConfig) {
    return config;
  },
  function (error: any) {
    return Promise.reject(error);
  }
);
axiosClient.interceptors.response.use(
  function (response: AxiosResponse) {
    return response;
  },
  function (error: any) {
    return Promise.reject(error);
  }
);
export default axiosClient;
