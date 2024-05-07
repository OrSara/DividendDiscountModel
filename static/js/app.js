function sendData(userData, endpoint) {
    return new Promise((resolve, reject) => {
        $.ajax({ 
            url: endpoint, 
            type: 'POST', 
            contentType: 'application/json', 
            data: JSON.stringify({ 'value': userData }),
            success: function(response) {
                if (response.result === "Ticker not found") {
                    // Handle the error message
                    alert("Ticker not found. Please check the spelling.");
                } else {
                    // Handle the success message here
                    resolve(response.result);
                }
            },
            error: function(error) { 
                console.log('Error', error);
                reject(error); 
            } 
        });
    });
}

function sendUserData(userName, userTicker, endpoint) {
    return new Promise((resolve, reject) => {
        $.ajax({ 
            url: endpoint, 
            type: 'POST', 
            contentType: 'application/json', 
            data: JSON.stringify({ 'userName': userName, 'userTicker': userTicker }), // Include both userName and userTicker
            success: function(response) {
                if (response.result === "Ticker not found") {
                    // Handle the error message
                    alert("Ticker not found. Please check the spelling.");
                } else {
                    // Handle the success message here
                    resolve(response.result);
                }
            },
            error: function(error) { 
                console.log('Error', error);
                reject(error); 
            } 
        });
    });
}

document.addEventListener("DOMContentLoaded", function() {
    // Add event listener to the delete button
    document.querySelector(".deleteButton").addEventListener("click", function() {
        // Retrieve the username to delete
        var usernameToDelete = document.getElementById("userName").value.trim();

        // Send AJAX request to delete the user data
        $.ajax({
            url: "/deleteUser", // URL to Flask route for deleting user
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ username: usernameToDelete }),
            success: function(response) {
                // Handle success response
                console.log("User data deleted successfully");
            },
            error: function(xhr, status, error) {
                // Handle error
                console.error("Error deleting user data:", error);
            }
        });
    });
});

// Function to show the progress container
function showProgressContainer() {
    document.getElementById("progressBar").classList.remove("hidden");
	document.getElementById("task").classList.remove("hidden");
}

// Function to hide the progress container
function hideProgressContainer() {
    document.getElementById("progressBar").classList.add("hidden");
	document.getElementById("task").classList.add("hidden");
}

// Function to update the progress bar
function updateProgressBar(value) {
    let progressBar = document.querySelector(".meter > span");
    if (progressBar) {
        progressBar.style.width = value + "%";
        document.getElementById("task").innerText = "Task completed - " + Math.round(value) + "%";
    } else {
        console.error("Progress bar element not found!");
    }
}

// Function to simulate tasks and update progress
async function simulateTasks(sharePrices) {
    // Define total tasks and set initial progress
    const totalTasks = 3;
    let completedTasks = 0;

    // Simulate tasks
    try {
        // Task 1: Get risk-free rate
        updateProgressBar(++completedTasks / totalTasks * 100);
		sendData('^TNX', '/riskFreeRate')
			.then(function(response) {
			// Handle the response data here
			let riskFreeRate = response;
		})
		.catch(function(error) {
			// Handle any errors that occur during the request
			console.error('Error:', error);
		});

        // Task 2: Get S&P500 index prices
        updateProgressBar(++completedTasks / totalTasks * 100);
        let sp500Prices = await getMarketPrices();

        // Task 3: Compute cost of equity
        updateProgressBar(++completedTasks / totalTasks * 100);
        let [costOfEquity, beta] = await computeCostOfEquity();

    } catch (error) {
        console.error(error);
    }
}

function createContentElement1(text) {
    let element = document.createElement("li");
	element.classList.add("list-group-item1");
    element.innerText = text;
    return element;
}

function createContentElement2(text) {
    let element = document.createElement("li");
	element.classList.add("list-group-item2");
    element.innerText = text;
    return element;
}

function displayResults(apiData, sharePrices, fairPrice, medianGrowthRate, beta) {
	hideProgressContainer();

	//display the data on the UI
	let card = document.createElement("div");
	card.classList.add("card");

	let content = document.createElement("ul");
    content.classList.add("content");

	let companyName = createContentElement1(`Company Name: ${apiData[0].name}`);
    let companyTicker = createContentElement2(`Ticker: ${apiData[0].symbol}`);
    let companyExchange = createContentElement1(`Stock Exchange: ${apiData[0].stockExchange}`);
    let companyCurrency = createContentElement2(`Currency: ${apiData[0].currency}`);
    let companySharePrice = createContentElement1(`Current Share Price: ${sharePrices[sharePrices.length - 1].value}`);
    let companyDivGrowthRate = createContentElement2(`Dividend growth rate (median): ${medianGrowthRate.toFixed(2)}`);
    let companyBeta = createContentElement1(`Beta: ${beta.toFixed(2)}`);
    let fairStockPrice = createContentElement2(`Fair share price: ${fairPrice.toFixed(2)}`);
	
	content.append(companyName, companyTicker, companyExchange, companyCurrency, companySharePrice,
		companyDivGrowthRate, companyBeta, fairStockPrice);

	card.appendChild(content);
	
	document.body.append(card);
}

function removeResults() {
    // Select the card element
    const card = document.querySelector(".card");
    
    // Check if the card exists
    if (card) {
        // Remove the card from the DOM
        card.remove();
    }
}

function getDividendArray(yearlyDivResults) {
	let yearlyDivArray = [];

	for (const year of yearlyDivResults.keys()) {
		yearlyDivArray.push(yearlyDivResults.get(year));
	}
	
	return yearlyDivArray;
}

function FairShareStockPrice(costOfEquity, medianGrowthRate, yearlyDivResults) {
	let yearlyDivArray = getDividendArray(yearlyDivResults);
	lastDiv = yearlyDivArray[yearlyDivArray.length - 1];
	let futureDiv = (medianGrowthRate + 1) * lastDiv;
	let fairPrice = futureDiv / ((costOfEquity - medianGrowthRate)/100);
	
	return fairPrice;
}

function computeUpsidePotential(fairPrice, sharePrices) {
	let cSharePrice = sharePrices[0].value;;
	let upsidePotential = fairPrice/cSharePrice;

	return upsidePotential;
}

async function getFullQuote(URLFullQuote) {
	let response = await fetch(URLFullQuote);
	let apiFullQuote = await response.json();

	return apiFullQuote;
}

async function sharePrice(userTicker) {
	// Construct the API path
	let URLFullQuote = `https://financialmodelingprep.com/api/v3/quote/${userTicker}?apikey=${keyFMP}`;

	//API call to check if ticker exists
    let apiFullQuote = [];

	try {
		apiFullQuote = await getFullQuote(URLFullQuote);
	} catch (error) {
		console.log(error);
	}
	return apiFullQuote;
}

function computeGrowthRate(array) {
    let growthRateArray = [];

    for (let k = 1; k < array.length; k++) {
        let growthRate = ((array[k] - array[k-1]) / array[k-1]) * 100;
        // Check if growthRate is NaN
        if (isNaN(growthRate)) {
            // If growthRate is NaN, push 0 into the array
            growthRateArray.push(0);
        } else {
            // Otherwise, push the computed growthRate
            growthRateArray.push(growthRate);
        }
    }

    return growthRateArray;
}

async function computeDivGrowthRates(yearlyDivResults) {
    let yearlyDivArray = getDividendArray(yearlyDivResults);
	let growthRateArray = computeGrowthRate(yearlyDivArray)

    return growthRateArray;
}

function computeMedian(growthRateArray) {
    // Ensure the array is sorted in ascending order
    const sortedArray = growthRateArray.slice().sort((a, b) => a - b);
    
    const length = sortedArray.length;
    if (length === 0) {
        return null; // Return null for empty arrays
    }

    const middleIndex = Math.floor(length / 2);

    // If the array length is odd, return the middle element
    if (length % 2 === 1) {
        return sortedArray[middleIndex];
    } 
    // If the array length is even, return the average of the two middle elements
    else {
        return (sortedArray[middleIndex - 1] + sortedArray[middleIndex]) / 2;
    }
}

async function getSplits(URLSplits) {
	let response = await fetch(URLSplits);
	let apiSplitsDates = await response.json();

	return apiSplitsDates;
}

async function split(userTicker) {
	// Construct the API path
	URLSplits = `https://financialmodelingprep.com/api/v3/historical-price-full/stock_split/${userTicker}?apikey=${keyFMP}`;
	//API call
	let apiSplitsDates = [];

	try {
		apiSplitsDates = await getSplits(URLSplits);
	} catch (error) {
		console.log(error);
	}
	return apiSplitsDates;
}

async function computeYearlyDividends(apiDividends) {
    try {
        let dividend = apiDividends["historical"];
        
        let apiSplitsDates = await split(userTicker);
        let splitsDate = apiSplitsDates["historical"];

        // The rest of your code that depends on the response can go here...
        let numerator = 1;
        let denominator = 1;
        let dividendReversed = dividend.reverse();
        let currentYear = Number(dividendReversed[0]["date"].split("-")[0]);
        const yearlyDivResults = new Map();
        let currentSplitDateIndex = splitsDate.length - 1;
        let yearlyDivSum = 0;

		for (let i = splitsDate.length - 1; i >= 0; i--) {
			let currentSplitDate = Date(splitsDate[i]["date"]);
			let firstDivDate = Date(dividendReversed[0]["date"]);
		
			if (currentSplitDate < firstDivDate) {
				currentSplitDateIndex = i;
				continue;
			} else {
				currentSplitDateIndex = i;
				break;
			}
		}
	
		for (let individualDiv of dividendReversed){
			let individualDivDate = Date(individualDiv["date"]);
	
			while (individualDivDate > Date(splitsDate[currentSplitDateIndex]["date"])) {
				if (currentSplitDateIndex > 0) {
				currentSplitDateIndex--;
	
				numerator += splitsDate[currentSplitDateIndex]["numerator"];
				denominator += splitsDate[currentSplitDateIndex]["denominator"];
				}
			}
		
			while (Number(individualDiv["date"].split("-")[0]) > currentYear) {
				yearlyDivResults.set(currentYear, yearlyDivSum);
				currentYear++;
				yearlyDivSum = 0;
			}
			yearlyDivSum += (individualDiv["dividend"] * numerator / denominator);
		}
		yearlyDivResults.set(currentYear, yearlyDivSum);
		return yearlyDivResults;
		
	} catch (error) {
        console.error("Error fetching splits dates:", error);
        // Handle the error gracefully, such as logging and returning null
        return null;
    }
}

async function getFullQuote(URLFullQuote) {
	let response = await fetch(URLFullQuote);
	let apiFullQuote = await response.json();

	return apiFullQuote;
}

async function dividends(apiData, userTicker, sharePrices) {
	// Construct the API path
	URLDividends = `https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${userTicker}?apikey=${keyFMP}`;
	//API call
	let apiDividends = [];

	try {
		apiDividends = await getFullQuote(URLDividends);
		
	} catch (error) {
		console.log(error);
	}
	
	let yearlyDivResults = await computeYearlyDividends(apiDividends);
	let growthRateArray = await computeDivGrowthRates(yearlyDivResults);
	let medianGrowthRate = await computeMedian(growthRateArray);

	//get the current share price and show it on the UI
	let apiFullQuote = await sharePrice(userTicker);
	let cSharePrice = apiFullQuote[0]["price"];
	
	//assuming that the future dividends will grow at the same growth rate as the medianGrowthRate
	let [costOfEquity, beta] = await computeCostOfEquity(medianGrowthRate, cSharePrice);
	
	let fairPrice = FairShareStockPrice(costOfEquity,medianGrowthRate,yearlyDivResults);
	
	let upsidePotential = computeUpsidePotential(fairPrice, sharePrices);

	displayResults(apiData, sharePrices, fairPrice, medianGrowthRate, beta);
}

async function TimeSeriesSharePrice(userTicker) {
    // Get the current date
    const today = new Date();

    // Calculate the start date (2 years ago)
    const twoYearsAgo = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());

    // Convert dates to Unix timestamps (in seconds)
    const period1 = Math.floor(twoYearsAgo.getTime() / 1000);
    const period2 = Math.floor(today.getTime() / 1000);

    const URL = `https://uk.finance.yahoo.com/quote/${userTicker}/history?period1=${period1}&period2=${period2}&interval=1d&filter=history&frequency=1d&includeAdjustedClose=true`;
    
    try {
        const response = await fetch(URL);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const html = await response.text();

        // Create a temporary div element to hold the HTML content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Find the table body containing historical prices
        const tableBody = tempDiv.querySelector('table[data-test="historical-prices"] tbody');
        if (!tableBody) {
            throw new Error('Table body not found in HTML');
        }

        // Initialize array to store date and close price objects
        const data = [];

        // Iterate through table rows in reverse order and extract date and close price for the last 2 years
        const rows = tableBody.querySelectorAll('tr');
        for (let i = rows.length - 1; i >= 0; i--) {
            const row = rows[i];
            const cells = row.querySelectorAll('td');
            if (cells.length === 7) { // Check if the row contains the expected number of cells
                const dateStr = cells[0].textContent.trim();
                const date = new Date(dateStr);
                const twoYearsAgo = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());

                // Check if the date is within the last 2 years
                if (date >= twoYearsAgo && date <= today) {
                    const closePrice = parseFloat(cells[4].textContent.trim());
                    data.push({ date: date, value: closePrice });
                }
            }
        }
		return data;
    } catch (error) {
        console.error('Error fetching or parsing HTML:', error);
    }
}

async function getTicker(userTicker) {
    let response = await fetch(URL);
	let apiData = await response.json();
	
	let success = true;
	let tickerFound = false;
	let symbolsArray = [];

	//ERROR HANDLING
    if (response.ok) {
		if (apiData.length === 0) {
			alert("Please check the spelling of the ticker and exchange name.");
			success = false;
			return [apiData, success];
		} else {
			for (let b = 0; b < apiData.length; b++) {
				symbolsArray.push(apiData[b]["symbol"]);
				
				if (apiData[b]["symbol"] === userTicker) {
					success = true;
					tickerFound = true;
					break;
				}
			}
		
		// If no match was found, display similar tickers in an alert
		if (!tickerFound) {
			let message = symbolsArray.join("\n");
			alert("The ticker you inserted could not be found.\nSimilar tickers are:\n" + message);
			success = false;
			return [apiData, success];
			}
		}
	} else {
		alert("The maximum number of daily requests has been reached, please try again later.");
		success = false;
		return [apiData, success];
	}
    
	return [apiData, success];
}

function getCurrentDate() {
	const currentDate = new Date();
	const year = currentDate.getFullYear();
	const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
	const day = String(currentDate.getDate()).padStart(2, '0');
	
	return `${year}-${month}-${day}`;
}

function get2YearsAgoDate() {
	const currentDate = new Date();
	const year = currentDate.getFullYear() - 2;
	const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
	const day = String(currentDate.getDate()).padStart(2, '0');
	
	return `${year}-${month}-${day}`;
}

async function getSP500(URLYFinance) {
	let response = await fetch(URLYFinance);
	let apiSP500Data = await response.json();

	return apiSP500Data;
}

async function getMarketPrices() {
    let endDate = getCurrentDate();
    let startDate = get2YearsAgoDate();

    const URLYFinance = `https://api.stlouisfed.org/fred/series/observations?series_id=SP500&api_key=${keyFRED}&file_type=json&observation_start=${startDate}&observation_end=${endDate}`;
    let apiSP500Prices = [];
    let sp500Prices = [];

    try {
        apiSP500Prices = await getSP500(URLYFinance);
    } catch (error) {
        console.log(error);
    }
    
    for (let z = 0; z < apiSP500Prices["observations"].length; z++) {
        let observation = apiSP500Prices["observations"][z];
        let oldDate = String(observation["date"]);
		let date = new Date(oldDate);
        let value = Number(observation["value"]);
        sp500Prices.push({ date: date, value: value });
    }

    return sp500Prices;
}

function getStartingDateIndex(sharePrices, sp500Prices) {
	let startingDate = new Date();
	let startingDateIndex = null;
	let currentdate = new Date();

	if (sharePrices.length > sp500Prices.length) {
		startingDate = new Date(sp500Prices[0]["date"]);
		for (let s = 0; s < sharePrices.length; s++) {
			currentdate = new Date(sharePrices[s]["date"]); // Create a Date object
			
			// Compare the timestamps of the current date and starting date
			if (currentdate.getTime() === startingDate.getTime()) {
				console.log(currentdate);
				startingDateIndex = s;
				break; // Break out of the loop once the starting date is found
			}
		}
	} else {
		startingDate = sharePrices[0]["date"];
		for (let s = 0; s < sp500Prices.length; s++) {
			currentdate = new Date(sp500Prices[s]["date"]);

			if (currentdate.getTime() === startingDate.getTime()) {
				startingDateIndex = s;
				break; // Break out of the loop once the starting date is found
			}
		}
	}
	return startingDateIndex;
}

function getArrays(sp500Prices, sharePrices, startingDateIndex) {
	let yArray = [];
	let xArray = [];
	let intermediatexArray = [];
	let intermediateyArray = [];
	
	if (sp500Prices.length > sharePrices.length) {
		intermediatexArray = sp500Prices.slice(startingDateIndex);
		intermediateyArray = sharePrices;
		
	} else {
		intermediatexArray = sp500Prices;
		intermediateyArray = sharePrices.slice(startingDateIndex);
	}

	let sp500Index = 0;
    let shareIndex = 0;

    while (sp500Index < sp500Prices.length && shareIndex < sharePrices.length) {
        let sp500Date = new Date(sp500Prices[sp500Index]["date"]).getTime();
        let shareDate = new Date(sharePrices[shareIndex]["date"]).getTime();

        if (sp500Date === shareDate) {
            if (sp500Prices[sp500Index]["value"] !== null && sharePrices[shareIndex]["value"] !== null) {
                yArray.push(sharePrices[shareIndex]["value"]);
                xArray.push(sp500Prices[sp500Index]["value"]);
            }
            sp500Index++;
            shareIndex++;
        } else if (sp500Date < shareDate) {
            sp500Index++;
        } else {
            shareIndex++;
        }
    }
	return { xArray: xArray, yArray: yArray };
}

function computeAverage(sp500GrowthRateArray) {
	var total = 0;
	for(var i = 0; i < sp500GrowthRateArray.length; i++) {
    	total += sp500GrowthRateArray[i];
	}
	var avg = (total / sp500GrowthRateArray.length)* 100;

	return avg;
}

function regressionBeta(xArray, yArray) {
    // Calculate Sums
    let xSum = 0, ySum = 0, xxSum = 0, xySum = 0;
    let count = xArray.length;
	
    for (let i = 0; i < count; i++) {
        xSum += xArray[i];
        ySum += yArray[i];
        xxSum += xArray[i] * xArray[i];
        xySum += xArray[i] * yArray[i];
    }

    // Calculate slope and intercept
    let slope = (count * xySum - xSum * ySum) / (count * xxSum - xSum * xSum);
    let intercept = (ySum - slope * xSum) / count;

    return slope;
}

async function computeCostOfEquity() {
    let sharePrices = await TimeSeriesSharePrice(userTicker);
    
    try {
        // Fetch riskFreeRate asynchronously
        let riskFreeRate = await sendData('^TNX', '/riskFreeRate');

        // Continue with other computations that depend on riskFreeRate
        let sp500Prices = await getMarketPrices();
        let startingDateIndex = getStartingDateIndex(sharePrices, sp500Prices);
        let result = getArrays(sp500Prices, sharePrices, startingDateIndex);
        let sp500 = result.xArray;
        let sharePriceArray = result.yArray;
        let sharePriceGrowthRateArray = computeGrowthRate(sharePriceArray);
        let sp500GrowthRateArray = computeGrowthRate(sp500);
        let marketReturn = computeAverage(sp500GrowthRateArray);
        let beta = regressionBeta(sp500GrowthRateArray, sharePriceGrowthRateArray);
        let costOfEquity = Number(riskFreeRate) + beta * (Number(marketReturn) - Number(riskFreeRate));
		
        return [costOfEquity, beta];
    } catch (error) {
        console.error('Error:', error);
        // Handle error
        return null;
    }
}

document.addEventListener("DOMContentLoaded", function() {
	//on clicking the submit button run all the functions
	document.getElementById("inputButton").addEventListener("click", async (e) => {
		e.preventDefault();
		removeResults();

		userName = document.getElementById("userName").value.trim();
    	userTicker = document.getElementById("userTicker").value.trim();
		userExchange = document.getElementById("userExchange").value.trim();
		
		sendUserData(userName, userTicker, '/writeUserData')
	
		// Construct the API path
		URL = `https://financialmodelingprep.com/api/v3/search-ticker?query=${userTicker}&limit=10&exchange=${userExchange}&apikey=${keyFMP}`;

    	//API call to check if ticker exists
	
		try {
			let [apiData, success] = await getTicker(userTicker);
			if (!success) {
				return; // Stop execution if success is false
			}
	
			showProgressContainer();
	
			//call API to get time series of the share price
			let sharePrices = await TimeSeriesSharePrice(userTicker);
	
			//get the time series of the dividends
			dividends(apiData, userTicker, sharePrices);

			// Reset progress bar before starting tasks
    		document.getElementById("progressBar").value = 0;

    		// Call simulateTasks function
    		await simulateTasks();
	
		} catch (error) {
			console.log(error);
		}
	});
});