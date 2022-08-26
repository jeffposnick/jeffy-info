export function registerSW(url: string) {
	window.addEventListener('load', function () {
		navigator.serviceWorker.register(url);
	});
}

export function listenForUpdates() {
	navigator.serviceWorker.addEventListener('message', (event) => {
		if (event.data.meta === 'workbox-broadcast-update') {
			const {updatedURL} = event.data.payload;
			if (updatedURL.endsWith('.json')) {
				// Unconditionally reload when the page's JSON content is updated.
				// Alternatively, you could display a "toast" message prompting
				// the user to reload if they want.
				window.location.reload();
			}
		}
	});
}
