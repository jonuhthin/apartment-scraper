import puppeteer from 'puppeteer'
import fs from 'fs'
import { stringify } from 'csv-stringify'
import readline from 'readline'

async function getURLs(searchURL) {
	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: null,
	})
	const page = await browser.newPage()
	await page.goto(searchURL, {
		waitUntil: 'networkidle0',
	})

	let apartmentURLs = await page.evaluate(() =>
		Array.from(
			document.querySelectorAll('.property-information > .property-link')
		).map((each) => each.href)
	)
	await browser.close()

	return apartmentURLs
}

async function getData(apartmentURL) {
	// Start a Puppeteer session with:
	// - a visible browser (`headless: false` - easier to debug because you'll see the browser in action)
	// - no default viewport (`defaultViewport: null` - website page will in full width and height)
	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: null,
	})

	// Open a new page
	const page = await browser.newPage()

	// On this new page:
	// - open the URL
	// - wait until the dom content is loaded (HTML is ready)
	await page.goto(apartmentURL, {
		waitUntil: 'domcontentloaded',
	})

	const apartmentDetails = await page.evaluate(() => {
		const _querySelector = (node, query) =>
			(node.querySelector(query)?.innerText ?? '')
				.replace(/[\r\n\s]+/g, ' ') //whitespace cleaning
				.trim()

		let unitTypesNodes = document.querySelectorAll('.pricingGridItem')
		return Array.from(unitTypesNodes).map((e, i) => {
			availableUnits =
				unitTypesNodes[i].querySelectorAll('li.unitContainer')
			return Array.from(availableUnits).map((e, j) => {
				return {
					url: apartmentURL,
					name: _querySelector(document, '#propertyName'),
					address: _querySelector(document, '#propertyAddressRow'),
					reviews: _querySelector(document, '#propertyReviewRow'),
					displayName: _querySelector(
						unitTypesNodes[i],
						'.modelName'
					),
					beds: _querySelector(
						unitTypesNodes[i],
						'.detailsTextWrapper span:nth-child(1)'
					).split(' ')[0],
					baths: _querySelector(
						unitTypesNodes[i],
						'.detailsTextWrapper span:nth-child(2)'
					).split(' ')[0],
					unit: _querySelector(
						availableUnits[j],
						'.unitColumn .unitBtn span:not(.screenReaderOnly)'
					),
					rent: _querySelector(
						availableUnits[j],
						'.pricingColumn span:not(.screenReaderOnly)'
					),
					discount: _querySelector(
						document,
						'#rentSpecialsSection p'
					),
					// dogFee:,
					// dogRent:,
					// adminFee:,
					// applicationFee:,
					sqft: _querySelector(
						availableUnits[j],
						'.sqftColumn span:not(.screenReaderOnly)'
					),
					availability: _querySelector(
						availableUnits[j],
						'.availableColumn span.dateAvailable'
					),
				}
			})
		})
	})

	// Close the browser
	await browser.close()
	return apartmentDetails
}

const consoleRead = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
})

async function main(searchURL) {
	let apartmentURLs = await getURLs(searchURL)

	console.log('looking at these URLs:')

	console.log(apartmentURLs)
	//for each apartment id, get the data specified

	process.setMaxListeners(Infinity)

	let allData = []

	await Promise.all(
		apartmentURLs.map(async (apartmentURL) =>
			allData.push(await getData(apartmentURL))
		)
	)

	allData = allData.flat(3)

	stringify(
		allData,
		{
			header: true,
		},
		function (err, output) {
			fs.writeFile('apartmentDetails.csv', output, 'utf8', () =>
				console.log('wrote data to ./apartmentDetails.csv')
			)
		}
	)
}

//starting thread
consoleRead.question('enter url of apartments.com search\n', (input) => {
	main(input).then(() => consoleRead.close())
})
