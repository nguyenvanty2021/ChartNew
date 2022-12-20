import styles from './TextErrors.module.scss'
const TextErrors = ({ message }: any) => {
	return <div className={styles.textErrors}>{message}</div>
}
export default TextErrors
