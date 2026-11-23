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
const workingRuleRouter = require("./routes/workingRule.route");
const rosterRouter = require("./routes/roster.route");
const rosterConflictRouter = require("./routes/rosterConflict.route");
const availabilityRouter = require("./routes/availability.route");
const rosterEntryRouter = require("./routes/rosterEntry.route");
const rosterViewRouter = require("./routes/rosterView.route");

// instance of express
const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
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
app.use("/", employeeRouter);
app.use("/", podRouter);
app.use("/", brandRouter);
app.use("/", allocationRouter);
app.use("/", processRouter);
app.use("/", workingRuleRouter);
app.use("/", rosterRouter);
app.use("/", rosterConflictRouter);
app.use("/", rosterEntryRouter);
app.use("/", availabilityRouter);
app.use("/", rosterViewRouter);

app.use((req, res) => {
  res.send("server is listening");
});
