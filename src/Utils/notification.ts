import { toast } from 'react-toastify'
export const notify = (type: string, message: string, time: number) => {
	if (type === 'success' || type === 'warning' || type === 'error') {
		toast[type](`${message}`, {
			position: 'top-right',
			autoClose: time,
			theme: 'colored', // light, dark
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
		})
	}
}
