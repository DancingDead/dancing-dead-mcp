// CommonJS entry point for Passenger (bypasses ESM "type": "module")
async function start() {
  try {
    await import("./dist/server.js");
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}
start();
