# -*- coding: utf-8 -*-
import yfinance as yf
from datetime import datetime, timedelta



def getRiskFreeRate():
    symbol = "^TNX"
    start_date = (datetime.now() - timedelta(4)).strftime('%Y-%m-%d')
    end_date = datetime.today().strftime('%Y-%m-%d')
    data = yf.download(symbol, start=start_date, end=end_date)
    riskFreeRate = data['Close'].iloc[-1]
    
    return riskFreeRate
