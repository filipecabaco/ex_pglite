#!/usr/bin/env bun

import { PGlite } from "@electric-sql/pglite";
import { createServer } from "net";
import { mkdirSync } from "fs";
import { dirname } from "path";

class PGLiteRunner {
  constructor(socketPath, dataDir) {
    this.db = null;
    this.socketPath = socketPath;
    this.dataDir = dataDir;
    this.server = null;
    this.clients = new Set();
    this.requestHandlers = {
      query: this.handleQuery.bind(this),
      exec: this.handleExec.bind(this),
      transaction: this.handleTransaction.bind(this),
      close: this.handleClose.bind(this),
    };
  }

  async initDatabase() {
    try {
      console.info(`Initializing database with dataDir: ${this.dataDir}`);
      this.db = new PGlite(this.dataDir);

      // Test the database to ensure it's working
      console.info("Testing database connection...");
      const testResult = await this.db.query("SELECT 1 as test");
      console.info(`Database test result: ${JSON.stringify(testResult)}`);

      return { success: true, result: "Database initialized" };
    } catch (error) {
      console.error(`Database initialization error: ${error.message}`);
      throw new Error(`Failed to initialize database: ${error.message}`);
    }
  }

  async handleQuery(request) {
    try {
      if (!this.db) {
        throw new Error("Database not initialized");
      }

      const { sql, params = [] } = request;
      console.info(
        `Executing query: ${sql} with params: ${JSON.stringify(params)}`
      );
      const result = await this.db.query(sql, params);
      console.info(`Query result: ${JSON.stringify(result)}`);
      return { success: true, result };
    } catch (error) {
      console.error(`Query error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async handleExec(request) {
    try {
      if (!this.db) {
        throw new Error("Database not initialized");
      }

      const { sql, params = [] } = request;
      console.info(
        `Executing statement: ${sql} with params: ${JSON.stringify(params)}`
      );

      let result;
      if (params && params.length > 0) {
        // Use query for parameterized statements
        result = await this.db.query(sql, params);
      } else {
        // Use exec for non-parameterized statements
        result = await this.db.exec(sql);
      }

      console.info(`Exec result: ${JSON.stringify(result)}`);
      return { success: true, result };
    } catch (error) {
      console.error(`Exec error: ${error.message}`, error);
      return { success: false, error: error.message };
    }
  }

  async handleTransaction(request) {
    try {
      if (!this.db) {
        throw new Error("Database not initialized");
      }

      const { queries } = request;
      const result = await this.db.transaction(async (tx) => {
        const results = [];
        for (const query of queries) {
          const { sql, params = [] } = query;
          const queryResult = await tx.query(sql, params);
          results.push(queryResult);
        }
        return results;
      });

      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleClose(request) {
    try {
      if (this.db) {
        await this.db.close();
        this.db = null;
      }

      // Schedule shutdown after sending response
      setTimeout(async () => {
        await this.shutdown();
      }, 100);

      return { success: true, result: "Database closed" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async processRequest(requestData) {
    try {
      const request = JSON.parse(requestData);
      const { id, action } = request;

      if (!this.requestHandlers[action]) {
        return {
          id,
          success: false,
          error: `Unknown action: ${action}`,
        };
      }

      const result = await this.requestHandlers[action](request);
      return {
        id,
        ...result,
      };
    } catch (error) {
      return {
        id: "unknown",
        success: false,
        error: `Invalid JSON or processing error: ${error.message}`,
      };
    }
  }

  async start() {
    try {
      // Initialize database first
      await this.initDatabase();

      // Ensure socket directory exists
      mkdirSync(dirname(this.socketPath), { recursive: true });

      // Create Unix domain socket server
      this.server = createServer((socket) => {
        this.clients.add(socket);

        let buffer = "";

        socket.on("data", async (chunk) => {
          buffer += chunk.toString();

          // Process complete lines (requests)
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim()) {
              try {
                const response = await this.processRequest(line.trim());
                socket.write(JSON.stringify(response) + "\n");
              } catch (error) {
                const errorResponse = {
                  id: "unknown",
                  success: false,
                  error: `Processing error: ${error.message}`,
                };
                socket.write(JSON.stringify(errorResponse) + "\n");
              }
            }
          }
        });

        socket.on("close", () => {
          this.clients.delete(socket);
        });

        socket.on("error", (error) => {
          console.error("Socket error:", error);
          this.clients.delete(socket);
        });
      });

      // Start listening on Unix socket
      this.server.listen(this.socketPath, () => {
        // Send ready signal to stdout for the parent process
        console.info(
          JSON.stringify({
            id: "ready",
            success: true,
            result: "PGLite runner ready with database initialized",
            socketPath: this.socketPath,
          })
        );
      });

      // Handle server errors
      this.server.on("error", (error) => {
        console.error("Server error:", error);
        process.exit(1);
      });
    } catch (error) {
      console.error("Failed to start PGLite runner:", error);
      process.exit(1);
    }

    // Handle process termination
    process.on("SIGINT", async () => {
      console.info("Received SIGINT, shutting down...");
      await this.shutdown();
    });

    process.on("SIGTERM", async () => {
      console.info("Received SIGTERM, shutting down...");
      await this.shutdown();
    });

    // Handle parent process exit
    process.on("disconnect", async () => {
      console.info("Parent process disconnected, shutting down...");
      await this.shutdown();
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", async (error) => {
      console.error("Uncaught exception:", error);
      await this.shutdown();
    });

    // Handle unhandled rejections
    process.on("unhandledRejection", async (reason, promise) => {
      console.error("Unhandled rejection at:", promise, "reason:", reason);
      await this.shutdown();
    });
  }

  async shutdown() {
    console.info("Shutting down PGLite runner...");

    try {
      // Close all client connections
      for (const client of this.clients) {
        try {
          client.end();
        } catch (error) {
          console.error("Error closing client:", error);
        }
      }
      this.clients.clear();

      // Close server
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(() => {
            console.info("Server closed");
            resolve();
          });
        });
      }

      // Close database
      if (this.db) {
        await this.db.close();
        console.info("Database closed");
      }

      // Clean up socket file
      try {
        const fs = require("fs");
        if (fs.existsSync(this.socketPath)) {
          fs.unlinkSync(this.socketPath);
          console.info("Socket file cleaned up");
        }
      } catch (error) {
        console.error("Error cleaning up socket file:", error);
      }

      console.info("Shutdown complete");
    } catch (error) {
      console.error("Error during shutdown:", error);
    } finally {
      process.exit(0);
    }
  }
}

// Start the runner if this script is executed directly
if (import.meta.main) {
  const args = process.argv.slice(2);
  const socketPath = args[0];
  const dataDir = args[1];
  if (!dataDir) {
    console.error("Usage: bun pglite_runner.js <socket_path> <data_dir>");
    process.exit(1);
  }
  if (!socketPath) {
    console.error("Usage: bun pglite_runner.js <socket_path> [data_dir]");
    process.exit(1);
  }

  const runner = new PGLiteRunner(socketPath, dataDir);
  runner.start();
}

export default PGLiteRunner;
