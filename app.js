const express = require("express");
const path = require("path");

const app = express();

const router = express.Router();

const { baekjoonFetch } = require("./controller/baekjoonFetchController");

app.set("port", process.env.PORT || 3000);

app.use("/", express.static(path.join(__dirname, "./public")));

// Use the router
app.use(router);

router.get("/fetch", baekjoonFetch);

app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기 중");
});
