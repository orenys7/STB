const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const router = express.Router();

router.get("/:quote", async (req, res, next) => {
    const quote = req.params.quote;
    const incomeUrl = `https://www.marketwatch.com/investing/stock/${quote}/financials?mod=mw_quote_tab`;
    const balanceUrl = `https://www.marketwatch.com/investing/stock/${quote}/financials/balance-sheet`;
    const cashFlowUrl = `https://www.marketwatch.com/investing/stock/${quote}/financials/cash-flow`;

    const categories = {
        sales: 0,
        eps: 48,
        equity: 77,
        netOperatingCashFlow: 15,

        netIncome: 36,
        dividends: 33,
        currentDebt: 38,
        longTermDebt: 47,
    };

    const incomeHtml = await fetchData(incomeUrl);
    const balanceHtml = await fetchData(balanceUrl);
    const cashFlowHtml = await fetchData(cashFlowUrl);

    const sales = getStats(incomeHtml.data, categories.sales);
    const growthSales = growthRate(sales);
    const eps = getStats(incomeHtml.data, categories.eps);
    const growthEps = growthRate(eps);
    const equity = getStats(balanceHtml.data, categories.equity);
    const growthEquity = growthRate(equity);
    const netOperatingCashFlow = getStats(
        cashFlowHtml.data,
        categories.netOperatingCashFlow
    );
    const growthNetOperatingCashFlow = growthRate(netOperatingCashFlow);

    const netIncome = getStats(incomeHtml.data, categories.netIncome);
    const dividends = getStats(cashFlowHtml.data, categories.dividends);
    const currentDebt = getStats(balanceHtml.data, categories.currentDebt);
    const longTermDebt = getStats(balanceHtml.data, categories.longTermDebt);
    const totalDebt = calculateDebt(currentDebt, longTermDebt);

    const roic = calculateRoic(netIncome, dividends, totalDebt, equity);

    res.send({
        balance: {
            roic,
            sales,
            eps,
            equity,
            netOperatingCashFlow,
        },
        growth: {
            sales: growthSales,
            eps: growthEps,
            equity: growthEquity,
            netOperatingCashFlow: growthNetOperatingCashFlow,
        },
    });
});

function encodeValues(values) {
    const vals = values.split(",");
    return vals.map((val) =>
        Number.parseFloat(val) ? Number.parseFloat(val) : 0.0
    );
}

function calculateDebt(currentDebt, longTermDebt) {
    const totalDebt = [];
    currentDebt.map((val, index) => totalDebt.push(val + longTermDebt[index]));
    return totalDebt;
}

function calculateRoic(netIncome, dividends, totalDebt, equity) {
    const roic = [];
    netIncome.map((income, index) =>
        roic.push(
            ((income - dividends[index]) /
                (totalDebt[index] + equity[[index]])) *
                100
        )
    );
    return roic;
}

function growthRate(rateValues) {
    const growthRateValues = [];
    rateValues.map((rateVal, index) => {
        growthRateValues.push(
            ((rateVal - rateValues[index - 1]) /
                Math.abs(rateValues[index - 1])) *
                100
        );
    });
    return growthRateValues;
}

function getStats(html, index) {
    const $ = cheerio.load(html);
    const statsTable = $(".chart--financials")[index].attribs[
        "data-chart-data"
    ];
    return encodeValues(statsTable);
}

async function fetchData(url) {
    console.log("Crawling data...");
    // make http call to url
    let response = await axios(url).catch((err) => console.log(err));

    if (response.status !== 200) {
        console.log("Error occurred while fetching data");
        return;
    }
    return response;
}

module.exports = { router };
