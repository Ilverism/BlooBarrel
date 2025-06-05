export type Platform = {
    name: string;
    icon: string;
    extensions?: string[];         // e.g., ['.exe', '.zip']
    patterns?: RegExp[];           // e.g., [/windows/i]
};