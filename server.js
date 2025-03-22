const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const Result = require("./models/Result");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://trader:trader123@tradetracker.0vrtw.mongodb.net/tradingApp?retryWrites=true&w=majority&appName=TradeTracker",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )

  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// API Routes
app.get("/api/results", async (req, res) => {
  const results = await Result.find();
  res.json(results);
});

app.post('/api/results', async (req, res) => {
    const { date, value } = req.body;
  
    try {
      if (value === "") {
        await Result.deleteOne({ date });
        console.log(`[DELETE] ${date}`);
      } else {
        await Result.findOneAndUpdate(
          { date },
          { value },
          { upsert: true, new: true }
        );
        console.log(`[SAVE] ${date}: ${value}`);
      }
  
      res.json({ success: true });
    } catch (err) {
      console.error("Error handling save/delete:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  app.delete('/api/results/month/:year/:month', async (req, res) => {
    const { year, month } = req.params;
  
    try {
      const prefix = `${year}-${parseInt(month)}`;
      const deleted = await Result.deleteMany({
        date: { $regex: `^${prefix}-` }
      });
  
      console.log(`[CLEAR MONTH] ${prefix}: ${deleted.deletedCount} records removed`);
      res.json({ success: true, deletedCount: deleted.deletedCount });
    } catch (err) {
      console.error("Error clearing month:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
