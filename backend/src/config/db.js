const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(process.env.DATABASE_URL);
  // console.log("MongoDB connected:", mongoose.connection.host);
};

module.exports = connectDB;
