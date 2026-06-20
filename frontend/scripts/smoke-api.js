const fetch = require("node-fetch");
const API = process.env.API_BASE || "http://localhost:8000/api";

async function main() {
  try {
    const res = await fetch(`${API}/products`);
    const data = await res.json();
    console.log(
      "Products:",
      Array.isArray(data.data) ? data.data.length : Object.keys(data).length,
    );
  } catch (e) {
    console.error("Error", e.message);
    process.exit(1);
  }
}

main();
