import "dotenv/config";
import app from "./app.js";
import connectDB from "./db/db.js";

connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
});
