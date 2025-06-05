import { GITHUB_TOKEN } from '$env/static/private';

const HEADERS = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(GITHUB_TOKEN && { Authorization: `Bearer ${GITHUB_TOKEN}` })
};


import { Octokit } from 'octokit';
const octokit = new Octokit({
    auth: GITHUB_TOKEN,
})


export async function listReleases(owner: string, repo: string, perPage=20) {

    console.log('>> Listing releases for:', owner, repo);
    const url = `/repos/${owner}/${repo}/releases?per_page=${perPage}`;
    console.log('>> Fetching releases from:', url);


    //Fetch releases from GitHub API
    const releasesResponse = await octokit.request('GET /repos/{owner}/{repo}/releases', {
        owner,
        repo,
        headers: HEADERS,
    });
    console.log('>> Releases Response:', releasesResponse, "<< (End of Releases Response)");

    //Got non-OK releases response, throw error
    if (releasesResponse.status != 200)
        throw new Error(`GitHub ${releasesResponse.status}`);


    //Fetch Repo Metadata
    const repoResponse = await octokit.request('GET /repos/{owner}/{repo}', {
        owner,
        repo,
        headers: HEADERS,
    });
    console.log('>> Repo Meta Response:', repoResponse, "<< (End of Repo Meta Response)");

    //Got non-OK repo response, throw error
    if (repoResponse.status != 200)
        throw new Error(`GitHub ${repoResponse.status}`);


    //Fetch Readme Content from Repo (if it exists)
    let readmeResponse = null;
    try {

        readmeResponse = await octokit.rest.repos.getReadme({
            owner,
            repo,
            mediaType: { format: 'raw' }
        });

        console.log('>> README Response:', readmeResponse, "<< (End of README Response)");

    } catch (error) {
        console.error('Error fetching README:', error);
    }


    //Fetch Topics from Repo (if they exists)
    let topicsResponse = null;
    try {

        topicsResponse = await octokit.request('GET /repos/{owner}/{repo}/topics', {
            owner,
            repo,
            headers: HEADERS,
        });

        console.log('>> Topics Response:', topicsResponse, "<< (End of Topics Response)");

    } catch (error) {
        console.error('Error fetching topics:', error);
    }


    //Combine all responses into a single object
    const combinedResponse = {
        releases: releasesResponse.data as GitHub.Release[],
        repoMeta: repoResponse.data as GitHub.RepoMeta,
        readme: readmeResponse?.data,
        topics: topicsResponse?.data?.names || []
    };

    //  return releasesResponse.data as GitHub.Release[];
    return combinedResponse;

}


/* Typings */
export namespace GitHub {

    export type Asset = {
        name: string;
        browser_download_url: string;
        size: number;
        download_count: number;
        content_type: string;
    };

    export type Release = {
        id: number;
        name: string | null;
        tag_name: string;
        body: string | null;
        draft: boolean;
        prerelease: boolean;
        published_at: string;
        assets: Asset[];
    };

    export type RepoMeta = {
        name: string;
        owner: {
            login: string;
            id: number;
        };
        description: string;
        stargazers_count: number;
        watchers_count: number;
        forks_count: number;
    }

}
