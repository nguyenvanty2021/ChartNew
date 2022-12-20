import styles from "./Loading.module.scss";
import { Spin } from "antd";
export default function Loading() {
  return (
    <div className={`${styles.loading} ${styles.loadingShow}`}>
      <div className={styles.loading__icon}>
        <Spin size="large" />
      </div>
    </div>
  );
}
