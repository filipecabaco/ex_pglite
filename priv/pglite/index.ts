#!/usr/bin/env bun

import { PGlite } from "@electric-sql/pglite";
import type { PGLiteSocketServerOptions } from "@electric-sql/pglite-socket";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import * as fs from "fs";
import * as path from "path";

class PGLiteSocketServerRunner {
  private socketDir: string;
  private dataDir: string;
  private db: PGlite | null = null;
  private server: PGLiteSocketServer | null = null;
  private database: string | null;
  private username: string | null;
  private password: string | null;
  private initialMemory: number | null;

  constructor(
    socketDir: string,
    dataDir: string,
    database: string | null = null,
    username: string | null = null,
    password: string | null = null,
    initialMemory: number | null = null
  ) {
    this.socketDir = socketDir;
    this.dataDir = dataDir;
    this.database = database;
    this.username = username;
    this.password = password;
    this.initialMemory = initialMemory;
  }

  async start(): Promise<void> {
    try {
      console.info(
        `Initializing PGlite database with dataDir: ${this.dataDir}`
      );

      // Ensure socket directory exists
      if (!fs.existsSync(this.socketDir)) {
        fs.mkdirSync(this.socketDir, { recursive: true });
        console.info(`Created socket directory: ${this.socketDir}`);
      }

      this.db = await PGlite.create({
        dataDir: this.dataDir,
        options: {
          username: this.username,
          password: this.password,
          database: this.database,
          ...(this.initialMemory && { initialMemory: this.initialMemory }),
        },
      });

      console.info("Testing database connection...");
      const testResult = await this.db.query("SELECT 1 as test");
      console.info(`Database test result: ${JSON.stringify(testResult)}`);

      const serverOptions: PGLiteSocketServerOptions = {
        db: this.db,
        path: path.join(this.socketDir, ".s.PGSQL.5432"),
      };

      console.info(`Starting PGlite socket server on ${serverOptions.path}`);

      this.server = new PGLiteSocketServer(serverOptions);

      await this.server.start();

      const readyMessage = { id: "ready", success: true };

      console.info(JSON.stringify(readyMessage));
    } catch (error) {
      console.error(
        "Failed to start PGlite socket server:",
        (error as Error).message
      );
      process.exit(1);
    }

    const shutdown = async (): Promise<void> => {
      console.info("Shutting down PGlite socket server...");

      try {
        if (this.server) {
          await this.server.stop();
          console.info("Socket server stopped");
        }

        if (this.db) {
          await this.db.close();
          console.info("Database closed");
        }

        console.info("Shutdown complete");
      } catch (error) {
        console.error("Error during shutdown:", (error as Error).message);
      } finally {
        process.exit(0);
      }
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    process.on("disconnect", shutdown);

    process.on("uncaughtException", async (error) => {
      console.error("Uncaught exception:", error);
      await shutdown();
    });

    process.on("unhandledRejection", async (reason, promise) => {
      console.error("Unhandled rejection at:", promise, "reason:", reason);
      await shutdown();
    });
  }
}

if (import.meta.main) {
  const args = process.argv.slice(2);

  const socketDir = args[0];
  const dataDir = args[1];
  const opts = JSON.parse(args[2]);
  if (!dataDir) {
    console.error("Usage: bun index.ts <socket_path> <data_dir> [opts]");
    console.error("  socket_path: Unix socket path");
    console.error("  data_dir: Database directory");
    console.error("  opts: JSON string of options");
    process.exit(1);
  }

  const runner = new PGLiteSocketServerRunner(
    socketDir,
    dataDir,
    opts.database,
    opts.username,
    opts.password,
    opts.initialMemory
  );
  runner.start();
}

export default PGLiteSocketServerRunner;
