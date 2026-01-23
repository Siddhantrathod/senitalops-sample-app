const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

app.post("/evaluate", (req, res) => {
  const findings = req.body.Results || [];

  let critical = 0, high = 0, medium = 0;

  findings.forEach(r => {
    if (!r.Vulnerabilities) return;
    r.Vulnerabilities.forEach(v => {
      if (v.Severity === "CRITICAL") critical++;
      if (v.Severity === "HIGH") high++;
      if (v.Severity === "MEDIUM") medium++;
    });
  });

  let score = 100;
  score -= critical * 20;
  score -= high * 10;
  score -= medium * 5;
  if (score < 0) score = 0;

  let decision = score >= 70 && critical === 0 ? "APPROVED" : "BLOCKED";

  res.json({
    security_score: score,
    decision: decision,
    stats: { critical, high, medium }
  });
});

app.listen(4000, () => {
  console.log("Decision Engine running on port 4000");
});
