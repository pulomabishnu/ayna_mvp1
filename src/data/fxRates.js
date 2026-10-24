// Static exchange rates for the "≈ €23" estimate next to US prices (Trevina,
// Oct 7: international shoppers had no idea what a price meant at home).
//
// Source: European Central Bank euro foreign exchange reference rates,
// published 21 October 2026 (https://www.ecb.europa.eu/stats/shared/pdf/eurofxref.pdf).
// The ECB quotes everything per 1 euro, so USD -> X is (EUR -> X) / (EUR -> USD).
// These are never fetched live: update the numbers and the date by hand,
// from the same ECB page, every few months.
export const FX_RATES_DATE = '2026-10-21';
export const FX_RATES_SOURCE = 'European Central Bank reference rates';

// Per 1 EUR, copied from the ECB sheet of 21 October 2026.
const ECB_PER_EUR = {
  USD: 1.1234,
  GBP: 0.83825,
  CAD: 1.5779,
  AUD: 1.5971,
  INR: 106.1265,
  JPY: 177.36,
  MXN: 20.7632,
};

/** How many units of each currency one US dollar buys. */
export const USD_TO = Object.freeze({
  EUR: 1 / ECB_PER_EUR.USD,
  GBP: ECB_PER_EUR.GBP / ECB_PER_EUR.USD,
  CAD: ECB_PER_EUR.CAD / ECB_PER_EUR.USD,
  AUD: ECB_PER_EUR.AUD / ECB_PER_EUR.USD,
  INR: ECB_PER_EUR.INR / ECB_PER_EUR.USD,
  JPY: ECB_PER_EUR.JPY / ECB_PER_EUR.USD,
  MXN: ECB_PER_EUR.MXN / ECB_PER_EUR.USD,
});
