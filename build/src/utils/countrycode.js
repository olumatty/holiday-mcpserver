"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCountryCode = getCountryCode;
const i18n_iso_countries_1 = __importDefault(require("i18n-iso-countries"));
const en_json_1 = __importDefault(require("i18n-iso-countries/langs/en.json"));
i18n_iso_countries_1.default.registerLocale(en_json_1.default);
async function getCountryCode(countryName) {
    if (countryName.length === 2) {
        const countryNameFromCode = i18n_iso_countries_1.default.getName(countryName.toUpperCase(), "en");
        return countryNameFromCode ? countryName.toUpperCase() : null;
    }
    const isoCode = i18n_iso_countries_1.default.getAlpha2Code(countryName, "en");
    return isoCode || null;
}
//# sourceMappingURL=countrycode.js.map