const express = require("express");
const app = express();

// Hardcoded secret 
const DB_PASSWORD = "admin123";

app.get("/", (req, res) => {
  res.send("SentinelOps DevSecOps Pipeline Running");
});

app.listen(3000, () => {
  console.log("App running on port 3000");
});
