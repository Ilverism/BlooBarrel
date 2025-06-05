import { listReleases } from "$lib/github";
import type { RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request }) => {

    console.log('>> POST /releases');

    const { owner, repo } = await request.json();

    //Missing owner, return error
    if (!owner) {
        console.error('Error: Missing owner');
        return new Response(JSON.stringify({ error: 'Missing owner' }), { status: 400 });
    }

    //Missing repo, return error
    if (!repo) {
        console.error('Error: Missing repo');
        return new Response(JSON.stringify({ error: 'Missing repo' }), { status: 400 });
    }

    try {

        const data = await listReleases(owner, repo);
        return new Response(JSON.stringify(data));

    } catch (error) {

        console.error('Error fetching releases:', error);
        return new Response(JSON.stringify({ error: 'Error fetching releases' }), { status: 500 });

    }

}