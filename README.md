Full stack application (HTML, CSS, JS, Flask, Python, MongoDB) that takes username, ticker and exchange names from the user and fetches the required data from Yahoo Finance, St. Louis Fred and Financial Modelling Prep API (API link https://site.financialmodelingprep.com/developer/docs).
The data is then used to calculate the fair price of a stock according to the Dividend Discount Model.
Company name, current price, currency, dividend growth rate, beta, fair stock price are then displayed on the webpage for the ticker.
The webpage is connected to a MongoDB database that keeps track of each ticker each username submits.
By entering a username and clicking the delete button, all the data related to that username is deleted from the database.
