import puppeteer from "puppeteer";
import fs from 'fs';
import { stringify } from 'csv-stringify'

// to get the list of urls, run a search on apartments.com and use this in the console:
//   links = JSON.stringify(Array.from(document.querySelectorAll('.property-information > .property-link')).map(each => each.href))
//import apartmentURLs from "./apartmentURLs.json" assert { type: "json" };

async function getURLs(URL) {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });
  const page = await browser.newPage();
  await page.goto(URL, {
    waitUntil: "domcontentloaded",
  });

  let URLs = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll(".property-information > .property-link")
    ).map((each) => each.href)
  );
  await browser.close();

  return URLs;
}

async function getData(URL, fieldList) {
  // Start a Puppeteer session with:
  // - a visible browser (`headless: false` - easier to debug because you'll see the browser in action)
  // - no default viewport (`defaultViewport: null` - website page will in full width and height)
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  // Open a new page
  const page = await browser.newPage();

  // On this new page:
  // - open the URL
  // - wait until the dom content is loaded (HTML is ready)
  await page.goto(URL, {
    waitUntil: "domcontentloaded",
  });

  const apartmentDetails = await page.evaluate(() => {
    const _querySelector = (node, query) =>
      (node.querySelector(query)?.innerText ?? "")
        .replace(/[\r\n\s]+/g, " ")
        .trim();

    let unitTypesNodes = document.querySelectorAll(".pricingGridItem");
    return Array.from(unitTypesNodes).map((e, i) => {
      availableUnits = unitTypesNodes[i].querySelectorAll("li.unitContainer");
      return Array.from(availableUnits).map((e, j) => {
        return {
          name: _querySelector(document, "#propertyName"),
          address: _querySelector(document, "#propertyAddressRow"),
          reviews: _querySelector(document, "#propertyReviewRow"),
          displayName: _querySelector(unitTypesNodes[i], ".modelName"),
          beds: _querySelector(
            unitTypesNodes[i],
            ".detailsTextWrapper span:nth-child(1)"
          ).split(" ")[0],
          baths: _querySelector(
            unitTypesNodes[i],
            ".detailsTextWrapper span:nth-child(2)"
          ).split(" ")[0],
          unit: _querySelector(
            availableUnits[j],
            ".unitColumn .unitBtn span:not(.screenReaderOnly)"
          ),
          rent: _querySelector(
            availableUnits[j],
            ".pricingColumn span:not(.screenReaderOnly)"
          ),
          discount: _querySelector(document, "#rentSpecialsSection p"),
          // dogFee:,
          // dogRent:,
          // adminFee:,
          // applicationFee:,
          sqft: _querySelector(
            availableUnits[j],
            ".sqftColumn span:not(.screenReaderOnly)"
          ),
          availability: _querySelector(
            availableUnits[j],
            ".availableColumn span.dateAvailable"
          ),
        };
      });
    });
  });

  // Close the browser
  await browser.close();
  return apartmentDetails;
}

function convertToCSV(objArray) {
  var array = typeof objArray != "object" ? JSON.parse(objArray) : objArray;
  var str = "";

  for (var i = 0; i < array.length; i++) {
    var line = "";
    for (var index in array[i]) {
      if (line != "") line += ",";

      line += array[i][index];
    }

    str += line + "\r\n";
  }

  return str;
}

let URL =
  "https://www.apartments.com/apartments/max-2-bedrooms-pet-friendly-dog/washer-dryer-parking-ev-charging/?bb=pi94mtom-Ho7i1j4B";
let apartmentURLs = await getURLs(URL);

//for each apartment id, get the data specified

let allData = [];

await Promise.all(
  apartmentURLs.map(async (URL) => allData.push(await getData(URL)))
);

allData = allData.flat(3);
console.table(allData);

stringify(
  allData, 
  {
    header: true
  }, 
  function(err, output) {
  fs.writeFile('apartmentDetails.csv', output, 'utf8', () => console.log('done.'));
})

