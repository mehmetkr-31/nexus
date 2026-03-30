/**
 * Generic paginated fetch helper.
 * Follows `nextPageToken` cursors until all pages are consumed.
 */
export async function fetchAllPages<TItem>(
	fetchPage: (pageToken?: string) => Promise<{ items: TItem[]; nextPageToken?: string }>,
): Promise<TItem[]> {
	const results: TItem[] = [];
	let pageToken: string | undefined;

	do {
		const page = await fetchPage(pageToken);
		results.push(...page.items);
		pageToken = page.nextPageToken;
	} while (pageToken);

	return results;
}
