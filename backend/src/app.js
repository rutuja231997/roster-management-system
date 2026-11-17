const dotenv = require("dotenv");

dotenv.config();
const connectDB = require("./config/db");

const express = require("express");
const cors = require("cors");

const http = require("http");

// routes
const employeeRouter = require("./routes/employee.route");
const podRouter = require("./routes/pod.route");
const brandRouter = require("./routes/brand.route");
const allocationRouter = require("./routes/allocation.route");
const processRouter = require("./routes/process.route");

// instance of express
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

const server = http.createServer(app);

// connectDB db first and start server
connectDB()
  .then(() => {
    console.log("database connection established");

    //server listen
    server.listen(process.env.PORT, () => {
      console.log(
        `server is listening on http://localhost:${process.env.PORT}`,
      );
    });
  })
  .catch((err) => {
    console.log("database can not be connected", err);
  });

// handle request using instande of express
app.use("/api", employeeRouter);
app.use("/api", podRouter);
app.use("/api", brandRouter);
app.use("/api", allocationRouter);
app.use("/api", processRouter);

app.use((req, res) => {
  res.send("server is listening");
});
