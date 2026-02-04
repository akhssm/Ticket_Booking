import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return;
    }

    await mongoose.connect(`${process.env.MONGODB_URI}/quickshow`);
    console.log("Database Connected");
  } catch (error) {
    console.log("DB Error:", error.message);
  }
};

export default connectDB;
