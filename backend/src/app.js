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
app.use("/api", workingRuleRouter);
app.use("/api", rosterRouter);
app.use("/api", rosterConflictRouter);
app.use("/api", rosterEntryRouter);
app.use("/api", availabilityRouter);
app.use("/api", rosterViewRouter);

app.use((req, res) => {
  res.send("server is listening");
});
