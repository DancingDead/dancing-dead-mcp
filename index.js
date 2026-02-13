// Entry point for o2switch/Passenger — delegates to compiled server
// Using dynamic import for maximum Passenger compatibility
async function start() {
  try {
    await import("./dist/server.js");
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
