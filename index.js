const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const { copyAllImagesToPublic } = require("./copyImages");
const { poolPromise } = require("./db");

const app = express();
const port = 5003;


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/images", express.static(path.join(__dirname, "public/images")));


const getMCFRoute = require("./getMCF");
const StockInsertData = require("./StockInsertData");
const StockGetData = require("./StockGetData");
const StockGetDataById = require("./StockGetDataById");
const ImageRoutes = require("./ImageRoutes");
const Float = require("./float");
const InsertFind = require("./InsertFind");
const GetFind = require("./GetFind");
const GetFindById = require("./GetFindById");
const InsertTrades = require("./InsertTrades");
const GetTrades = require("./GetTrades");
const GetTradesById = require("./GetTradesById");


app.use("/api/market-data", getMCFRoute);
app.use("/api/financial-data", StockInsertData);
app.use("/api/financial-data", StockGetData);
app.use("/api/financial-data", StockGetDataById);
app.use("/api/find-data", InsertFind);
app.use("/api/find-data", GetFind);
app.use("/api/find-data", GetFindById);
app.use("/api/trades-data", InsertTrades);
app.use("/api/trades-data", GetTrades);
app.use("/api/trades-data", GetTradesById);
app.use("/api", ImageRoutes);
app.use("/api/float", Float);




(async () => {
  try {
    console.log("Waiting for database connection...");
    await poolPromise; 
    console.log("Database connected.");

  

 
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });

  } catch (err) {
    console.error("ERROR: Failed to initialize server:", err);
    process.exit(1); 
  }
})();


const sourceDir = "C:/Users/duyen/OneDrive/Pictures/Screenshots";
const destinationDir = path.join(__dirname, "public", "images");

copyAllImagesToPublic(sourceDir, destinationDir)
  .then(() => console.log("Images copied successfully!"))
  .catch((error) => console.error("Error copying images:", error.message));


app.use((req, res) => {
  res.status(404).send({
    message: "Route not found",
  });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({
    message: "An internal server error occurred",
    error: err.message,
  });
});


process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
