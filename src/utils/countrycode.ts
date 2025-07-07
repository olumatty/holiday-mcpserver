import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";

countries.registerLocale(en);

async function getCountryCode(countryName: string): Promise<string | null> {
  if (countryName.length === 2) {
    const countryNameFromCode = countries.getName(
      countryName.toUpperCase(),
      "en"
    );
    return countryNameFromCode ? countryName.toUpperCase() : null;
  }
  const isoCode = countries.getAlpha2Code(countryName, "en");
  return isoCode || null;
}

export { getCountryCode };
