import {parse} from 'li';

function assert(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message);
	}
}

function status(message: string) {
	(document.querySelector('#status') as HTMLElement).innerText = message;
}

async function fetchAll(initialURL: string, limit = 1000) {
	let url = initialURL;
	const items: any[] = [];

	try {
		while (url && items.length < limit) {
			status(`Fetching ${url}`);
			const response = await fetch(url);
			const responseItems = await response.json();
			items.push(...responseItems);
			url = parse(response.headers.get('link')).next;
		}
	} catch (err) {
		status(err);
	}
	return items;
}

async function lookup(account: string) {
	const [user, server] = account.replace(/^@/, '').split('@');
	assert(
		Boolean(user && server),
		`Couldn't parse user and server from '${account}'.`,
	);

	const searchURL = `https://${server}/api/v2/search?q=@${user}&limit=1`;
	let search;
	try {
		search = await fetch(searchURL);
	} catch (err) {
		throw `${server} doesn't support API requests from this browser: ${err}`;
	}

	const searchJSON = await search.json();
	const id = searchJSON.accounts?.[0]?.id;
	assert(id, `Couldn't find ID for ${user}@${server}`);

	const items = await fetchAll(
		`https://${server}/api/v1/accounts/${id}/following`,
	);

	const serverToCount = new Map();
	for (const item of items) {
		const [_, followingServer] = item.acct.split('@');
		const effectiveServer = followingServer ?? server;
		serverToCount.set(
			effectiveServer,
			(serverToCount.get(effectiveServer) || 0) + 1,
		);
	}

	return [...serverToCount.entries()].sort((a, b) => {
		const diff = b[1] - a[1];
		return diff || a[0].localeCompare(b[0]);
	});
}

document
	.querySelector<HTMLInputElement>('#lookup')!
	.addEventListener('submit', async (e) => {
		e.preventDefault();

		const account = document.querySelector<HTMLInputElement>('#account')?.value;

		try {
			const resultsTable = document.querySelector<HTMLTableElement>('#results');
			resultsTable!.replaceChildren();
			const items = await lookup(account!);
			assert(
				Boolean(items?.length),
				`Unable to retrieve any following info for '${account}'`,
			);
			status(
				`Found ${items.length} servers associated with followed accounts.`,
			);
			for (const [server, count] of items) {
				const resultTR = document.createElement('tr');

				const serverA = document.createElement('a');
				serverA.href = `https://${server}/about`;
				serverA.innerText = server;
				resultTR.appendChild(serverA);

				const countTD = document.createElement('td');
				countTD.innerText = count;
				resultTR.appendChild(countTD);
				resultsTable!.appendChild(resultTR);
			}
		} catch (err) {
			status(err);
		}
	});
