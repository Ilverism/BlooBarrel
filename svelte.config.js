import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';


const base = (process.env.NODE_ENV === 'production') ? '/BlooBarrel' : '';


/** @type {import('@sveltejs/kit').Config} */
const config = {
    
    preprocess: vitePreprocess(),

    extensions: ['.svelte'],

    kit: {
        adapter: adapter({
            fallback: 'index.html',
            strict: false
        }),
        paths: {
            base: base
        }
    }

};

export default config;