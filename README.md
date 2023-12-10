# apartment-scraper

web scraper for apartments.com searches using puppeteer

run via `npm start` or `node index.js` - I've included the node_modules folder so you don't have to `npm i`

### Background

I really wanted to be able to look at apartment data in a spreadsheet format where I could sort/filter, and the apartments.com UI just wasn't enough for me.

### How it works

1. process prompts for a search url - you can copy this from whatever apartments.com search you've executed, as long as it doesn't require you to log in to see it (e.g. favorites)

    - if you want to supply a list of apartments.com URLs instead (like your favorites), use the following query selector statement and paste in the result:

        ```javascript
        JSON.stringify(
        	Array.from(
        		document.querySelectorAll(
        			'.property-information > .property-link'
        		)
        	).map((each) => each.href)
        )
        ```

2. process query selects the search url page to get all urls for the apartments in that search
3. for each apartment url, collects info from each page - each layout type, available unit, etc. and compiles the fields from each by selecting the html tags
    - if you want to get different fields or more fields, look for the `***return fields***` comment
4. the process will output all these to a csv file in the working directory as ./apartmentDetails.csv
