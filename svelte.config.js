import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: { adapter: adapter() },
    onwarn: (warning, handler) => {
        const { code, frame } = warning;
        if (code === "css_unused_selector")
            return;
        if (code === "a11y_invalid_attribute")
            return;

        console.log(code); // <= uncomment to check other warnings

        handler(warning);
    }
};

export default config;
