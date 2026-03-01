import { Client } from "typesense";

export const typesenseClient = new Client({
    nodes: [
        {
            host: process.env.NEXT_PUBLIC_TYPESENSE_HOST || "localhost",
            port: parseInt(process.env.NEXT_PUBLIC_TYPESENSE_PORT || "8108", 10),
            protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL || "http",
        },
    ],
    apiKey: process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY || "xyz",
    connectionTimeoutSeconds: 5,
});
