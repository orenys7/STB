const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const router = express.Router();

router.get("/:quote", async (req, res, next) => {
    const quote = req.params.quote;
    const incomeUrl = `https://www.marketwatch.com/investing/stock/${quote}/financials?mod=mw_quote_tab`;
    const balanceUrl = `https://www.marketwatch.com/investing/stock/${quote}/financials/balance-sheet`;

    const categories = {
        sales: 0,
        netIncome: 36,
        totalAssets: 35,
        totalLiabilites: 60,
        shareholdersEquity: 75,
        equity: 78,
        eps: 45,
    };

    const incomeHtml = await fetchData(incomeUrl);
    const balanceHtml = await fetchData(balanceUrl);
    
    const sales = getStats(incomeHtml.data, categories.sales);
    const growthSales = growthRate(sales);
    const netIncome = getStats(incomeHtml.data, categories.netIncome);
    const growthNetIncome = growthRate(netIncome);
    const eps = getStats(incomeHtml.data, categories.eps);
    const growthEps = growthRate(eps);
    const totalAssets = getStats(balanceHtml.data, categories.totalAssets);
    const growthTotalAssets = growthRate(totalAssets);
    const totalLiabilites = getStats(
        balanceHtml.data,
        categories.totalLiabilites
    );
    const growthTotalLiabilites = growthRate(totalLiabilites);
    const shareholdersEquity = getStats(
        balanceHtml.data,
        categories.shareholdersEquity
    );
    const growthShareholdersEquity = growthRate(shareholdersEquity);
    const equity = getStats(balanceHtml.data, categories.equity);
    const growthEquity = growthRate(equity);

    console.log();

    res.send({
        sales,
        growthSales,
        eps,
        growthEps,
        netIncome,
        growthNetIncome,
        equity,
        growthEquity,
        shareholdersEquity,
        growthShareholdersEquity,
        totalAssets,
        growthTotalAssets,
        totalLiabilites,
        growthTotalLiabilites
    });
});

function encodeValues(values) {
    return values
        .split(":")[1]
        .replace("}", "")
        .replace("[", "")
        .replace("]", "")
        .split(",");
}

function growthRate(rateValues) {
    const growthRateValues = [];
    rateValues.forEach((rateVal) => {
        growthRateValues.push((rateVal - rateValues[0]) / Math.abs(rateValues[0]) * 100);
    });
    return growthRateValues;
}

function getStats(html, index) {
    const $ = cheerio.load(html);
    const statsTable = $(".miniGraph")[index].attribs["data-chart"];
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
