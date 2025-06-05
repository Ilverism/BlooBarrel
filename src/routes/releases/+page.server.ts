import { listReleases } from '$lib/github';
import type { RequestHandler } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const EX_OWNER = 'level3tjg';
const EX_REPO = 'TwitchAdBlock';


let cached: {
    expires: number;
    data: any
} | null = null;


export const load: PageServerLoad = async () => {

    return fetchReleases(EX_OWNER, EX_REPO);

};

async function fetchReleases(owner:string=EX_OWNER, repo:string=EX_REPO) {

    const CACHE_DURATION_MINUTES = 15;
    const CACHE_DURATION_MS = (CACHE_DURATION_MINUTES * 60 * 1000);

    try {

        let fromCache = true;

        //Cache is expired or not set, fetch new data
        if (!cached || cached.expires < Date.now()) {

            fromCache = false;

            const data = await listReleases(owner, repo);
            const expires = Date.now() + CACHE_DURATION_MS;

            cached = { data, expires };

        }

        return { releases: cached.data, fromCache };

    } catch (error) {

        console.error('Error fetching releases:', error);
        return { releases: [], fromCache: false };

    }

}