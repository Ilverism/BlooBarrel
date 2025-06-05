import { redirect } from '@sveltejs/kit';

export function load({ params }) {

	const fullpath = params.fullpath;

    //Unable to get fullpath, redirect to releases page
	if (!fullpath || (Array.isArray(fullpath) ? fullpath.length === 0 : fullpath.length === 0))
		throw redirect(302, '/releases');

	//Ensure fullpath is always an array before joining
	const fullpathArr = Array.isArray(fullpath) ? fullpath : [fullpath];
	const joined = fullpathArr.join('/');
	let url: URL;

	try {
		url = new URL(joined);
	} catch {
		console.error('Invalid GitHub URL:', joined);
		throw redirect(302, '/releases');
	}

	//Extract owner and repo from the path
	const [, owner, repo] = url.pathname.split('/');

	if (!owner || !repo) {
		console.error('Incomplete GitHub path:', url.pathname);
		throw redirect(302, '/releases');
	}

	console.log(`Redirecting from old releases format: owner=${owner}, repo=${repo}`);
	throw redirect(302, `/releases?owner=${owner}&repo=${repo}`);
    
}
