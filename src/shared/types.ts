export interface Page {
	date: string;
	excerpt?: string;
	tags?: Array<string>;
	title: string;
	url: string;
}

export interface Post {
	content: string;
	page: Page;
}

export interface RSSItem {
	date: string;
	excerpt: string;
	html: string;
	title: string;
	url: string;
}

export interface Site {
	author?: string;
	baseurl: string;
	description: string;
	github: {
		username: string;
	};
	email: string;
	logo: string;
	rssFeed: string;
	title: string;
	twitter: {
		username: string;
	};
	url: string;
}
