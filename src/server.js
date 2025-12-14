require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "0.0.0.0"; // Tambah ini!

app.listen(PORT, HOST, () => {
  // Gunakan HOST parameter
  console.log(
    `Server running on http://${HOST}:${PORT} (NODE_ENV=${
      process.env.NODE_ENV || "development"
    })`
  );
});
