const express = require("express");
const { router } = require("./api/balance");

const app = express();

app.use(router);

const server = app.listen(3000, () => {
    const host = server.address().address;
    const port = server.address().port;
    console.log(`Example app listening at http://${host}:${port}`);
});

module.exports = { app };
