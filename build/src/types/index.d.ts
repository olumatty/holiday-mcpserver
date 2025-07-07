export interface Holiday {
    name: string;
    date: string;
    type: "national" | "international" | "regional";
    description: string;
    observedBy: string;
    localName: string;
    global?: boolean;
    country?: string[] | {};
    countryCode: string;
}
export interface APIHoliday {
    date: string;
    localName: string;
    name: string;
    countryCode: string;
    global: boolean;
    counties: string[];
    launchYear: number;
    types: string[];
}
export interface countryInfo {
    countryCode: string;
    name: string;
}
export interface GroupedCountryHolidays {
    country: countryInfo;
    holidays: APIHoliday[];
}
