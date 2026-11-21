require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});
const connectDB = require("../config/db");

const assert = require("assert");
const mongoose = require("mongoose");

const Pod = require("../models/pod");
const { getPodRoster } = require("../services/rosterView.service");

const ROSTER_ID = "6b005ac70898826b5b7463df";

const runTest = async () => {
  try {
    await connectDB();

    // Find Customer Support Pod
    const pod = await Pod.findOne({
      name: "Customer Support Pod",
    });

    assert.ok(pod, "Customer Support Pod should exist.");

    console.log(`Testing Pod: ${pod.name}`);
    console.log(`Pod ID: ${pod._id}`);

    // Fetch Pod-wise roster
    const result = await getPodRoster(ROSTER_ID, pod._id);

    // Basic assertions
    assert.ok(result, "Roster view should return a result.");

    console.log("\nPod Roster Result:");
    console.log(JSON.stringify(result, null, 2));

    console.log("\nPOD ROSTER TEST PASSED!");
  } catch (error) {
    console.error("\nPOD ROSTER TEST FAILED!");
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log("\nMongoDB disconnected.");
  }
};

runTest();
