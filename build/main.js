"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const countrycode_1 = require("./src/utils/countrycode");
const server = new index_js_1.Server({
    name: "holiday-mcp-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
        resources: {},
    },
});
const tools = [
    {
        name: "get_holiday_by_country",
        description: "Get all holiday by country",
        inputSchema: {
            type: "object",
            properties: {
                country: {
                    type: "string",
                    description: "Country name or IS0 2-letter code (e.g united states or US)",
                },
                year: {
                    type: "number",
                    description: "Year to get holiday for (default is current year)",
                },
            },
            required: ["country"],
        },
        outputSchema: {
            type: "object",
            items: {
                type: "object",
                properties: {
                    date: { type: "string" },
                    name: { type: "string" },
                    countryCode: { type: "string" },
                },
            },
        },
    },
    {
        name: "get_international_holiday",
        description: "Get all international holiday",
        inputSchema: {
            type: "object",
            properties: {
                year: {
                    type: "number",
                    description: "Year to get holiday for (default is current year)",
                },
                globalOnly: {
                    type: "boolean",
                    description: "Only return global observed holidays (default is false)",
                },
            },
        },
        outputSchema: {
            type: "object",
            items: {
                type: "object",
                properties: {
                    date: { type: "string" },
                    name: { type: "string" },
                    countryCode: { type: "string" },
                },
            },
        },
    },
    {
        name: "get_next_holiday",
        description: "Get next holiday for a given country",
        inputSchema: {
            type: "object",
            properties: {
                country: {
                    type: "string",
                    description: "Country name or IS0 2-letter code (e.g united states or US)",
                },
                limit: {
                    type: "number",
                    description: "Number of upcoming holidays to return (default: 5)",
                },
            },
        },
        outputSchema: {
            type: "object",
            items: {
                type: "object",
                properties: {
                    date: { type: "string" },
                    name: { type: "string" },
                    countryCode: { type: "string" },
                },
            },
        },
    },
    {
        name: "get_next_global_holiday",
        description: "Get the next N upcoming holidays across all countries",
        inputSchema: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Number of upcoming holidays to return (default: 5)",
                },
            },
        },
        outputSchema: {
            type: "object",
            items: {
                type: "object",
                properties: {
                    date: { type: "string" },
                    name: { type: "string" },
                    countryCode: { type: "string" },
                },
            },
        },
    },
];
const resources = [
    {
        uri: "holidays://holidays",
        name: "Holidays",
        description: "List of all holidays",
        mimeType: "application/json",
    },
    {
        uri: "holidays://holidays/next",
        name: "Next Holidays",
        description: "List of all upcoming holidays",
        mimeType: "application/json",
    },
    {
        uri: "holidays://holidays/next/global",
        name: "Next Global Holidays",
        description: "List of all upcoming global holidays",
        mimeType: "application/json",
    },
];
async function fetchHolidayData(endpoint) {
    const baseUrl = "https://date.nager.at/api/v3";
    const url = `${baseUrl}/${endpoint}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch holiday data from Nager.at: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown network error";
        return null;
    }
}
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async (request) => {
    return {
        tools: tools,
    };
});
server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async (request) => {
    return {
        resources: resources,
    };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "get_holiday_by_country": {
                const { country, year = new Date().getFullYear() } = args;
                const countryCode = await (0, countrycode_1.getCountryCode)(country);
                if (!countryCode) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Invalid country: ${country}`,
                            },
                        ],
                    };
                }
                const data = await fetchHolidayData(`PublicHolidays/${year}/${countryCode}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case "get_international_holiday": {
                const { year = new Date().getFullYear(), globalOnly = false } = args;
                const countries = await fetchHolidayData("AvailableCountries");
                if (!countries) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: "Failed to fetch country list",
                            },
                        ],
                    };
                }
                const holidaysByCountry = [];
                const countryLimit = globalOnly ? 10 : 5;
                for (let i = 0; i < Math.min(countries.length, countryLimit); i++) {
                    try {
                        const countryHolidays = await fetchHolidayData(`PublicHolidays/${year}/${countries[i].countryCode}`);
                        holidaysByCountry.push({
                            country: countries[i].name,
                            holidays: countryHolidays,
                        });
                    }
                    catch (error) {
                        console.error(`Failed to fetch holidays for ${countries[i].name}: ${error}`);
                    }
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(holidaysByCountry, null, 2),
                        },
                    ],
                };
            }
            case "get_next_holiday": {
                const { country, limit = 5 } = args;
                if (country) {
                    const countryCode = await (0, countrycode_1.getCountryCode)(country);
                    if (!countryCode) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `Invalid country: ${country}`,
                                },
                            ],
                        };
                    }
                    const currentYear = new Date().getFullYear();
                    const nextYear = currentYear + 1;
                    const today = new Date();
                    const currentYearHolidays = await fetchHolidayData(`PublicHolidays/${currentYear}/${countryCode}`);
                    const nextYearHolidays = await fetchHolidayData(`PublicHolidays/${nextYear}/${countryCode}`);
                    const allHolidays = [...currentYearHolidays, ...nextYearHolidays];
                    const upcomingHolidays = allHolidays
                        .filter((holiday) => new Date(holiday.date) > today)
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .slice(0, limit);
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(upcomingHolidays, null, 2),
                            },
                        ],
                    };
                }
                else {
                    const countries = await fetchHolidayData("AvailableCountries");
                    const currentYear = new Date().getFullYear();
                    const today = new Date();
                    const upcomingHolidays = [];
                    for (let i = 0; i < Math.min(countries.length, 10); i++) {
                        try {
                            const holidays = await fetchHolidayData(`PublicHolidays/${currentYear}/${countries[i].countryCode}`);
                            const upcoming = holidays
                                .filter((holiday) => new Date(holiday.date) > today)
                                .map((holiday) => ({
                                ...holiday,
                                country: countries[i],
                            }));
                            upcomingHolidays.push(...upcoming);
                        }
                        catch (error) {
                            continue;
                        }
                    }
                    const sortedHolidays = upcomingHolidays
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .slice(0, limit);
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(sortedHolidays, null, 2),
                            },
                        ],
                    };
                }
            }
            case "get_next_global_holiday": {
                const { limit = 5 } = args;
                const countries = await fetchHolidayData("AvailableCountries");
                const currentYear = new Date().getFullYear();
                const nextYear = currentYear + 1;
                const today = new Date();
                const upcomingHolidays = [];
                for (let i = 0; i < Math.min(countries.length, 10); i++) {
                    try {
                        const currentYearHolidays = await fetchHolidayData(`PublicHolidays/${currentYear}/${countries[i].countryCode}`);
                        const nextYearHolidays = await fetchHolidayData(`PublicHolidays/${nextYear}/${countries[i].countryCode}`);
                        const allHolidays = [...currentYearHolidays, ...nextYearHolidays];
                        const upcoming = allHolidays
                            .filter((holiday) => new Date(holiday.date) > today)
                            .map((holiday) => ({
                            ...holiday,
                            country: countries[i],
                        }));
                        upcomingHolidays.push(...upcoming);
                    }
                    catch (error) {
                        continue;
                    }
                }
                const sortedHolidays = upcomingHolidays
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, limit);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(sortedHolidays, null, 2),
                        },
                    ],
                };
            }
            default:
                return {
                    content: [
                        {
                            type: "text",
                            text: "Invalid tool name",
                        },
                    ],
                    isError: true,
                };
        }
    }
    catch (error) {
        console.error(error);
        return {
            content: [
                {
                    type: "text",
                    text: "Error: " + error,
                },
            ],
            isError: true,
        };
    }
});
server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    try {
        switch (uri) {
            case "holidays://countries":
                const countriesData = await fetchHolidayData("AvailableCountries");
                return {
                    contents: [
                        {
                            uri,
                            mimeType: "application/json",
                            text: JSON.stringify(countriesData, null, 2),
                        },
                    ],
                };
            case "holidays://holidays":
                const currentYear = new Date().getFullYear();
                const holidaysData = await fetchHolidayData(`PublicHolidays/${currentYear}/NGA`);
                return {
                    contents: [
                        {
                            uri,
                            mimeType: "application/json",
                            text: JSON.stringify(holidaysData, null, 2),
                        },
                    ],
                };
            default:
                return {
                    contents: [
                        {
                            uri,
                            mimeType: "text/plain",
                            text: "Invalid resource uri",
                        },
                    ],
                };
        }
    }
    catch (error) {
        console.error(error);
        return {
            contents: [
                {
                    uri,
                    mimeType: "text/plain",
                    text: "Error: " + error,
                },
            ],
        };
    }
});
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("Holiday MCP Server running on stdio");
}
main().catch(console.error);
//# sourceMappingURL=main.js.map