#!/usr/bin/env bun

import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

import { mkdirSync } from "fs";
import { dirname } from "path";

class PGLiteSocketServerRunner {
  private socketPath: string | null;
  private dataDir: string;
  private port: number | null;
  private host: string | null;
  private db: PGlite | null = null;
  private server: PGLiteSocketServer | null = null;

  constructor(
    socketPath: string | null,
    dataDir: string,
    port: number | null = null,
    host: string | null = null
  ) {
    this.socketPath = socketPath;
    this.dataDir = dataDir;
    this.port = port;
    this.host = host;
  }

  async start(): Promise<void> {
    try {
      console.info(
        `Initializing PGlite database with dataDir: ${this.dataDir}`
      );

      this.db = await PGlite.create(this.dataDir);

      console.info("Testing database connection...");
      const testResult = await this.db.query("SELECT 1 as test");
      console.info(`Database test result: ${JSON.stringify(testResult)}`);

      const serverOptions: any = { db: this.db, inspect: false };

      if (this.socketPath) {
        mkdirSync(dirname(this.socketPath), { recursive: true });
        serverOptions.path = this.socketPath;
        console.info(
          `Starting PGlite socket server on Unix socket: ${this.socketPath}`
        );
      } else {
        serverOptions.port = this.port;
        serverOptions.host = this.host || "127.0.0.1";
        console.info(
          `Starting PGlite socket server on ${serverOptions.host}:${serverOptions.port}`
        );
      }

      this.server = new PGLiteSocketServer(serverOptions);

      await this.server.start();

      const readyMessage = {
        id: "ready",
        success: true,
        result: "PGlite socket server ready",
        socketPath: this.socketPath,
        port: this.port,
        host: this.host,
      };

      console.info(JSON.stringify(readyMessage));
    } catch (error) {
      console.error("Failed to start PGlite socket server:", error.message);
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
        console.error("Error during shutdown:", error.message);
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

  const socketPath = args[0];
  const dataDir = args[1];
  const opts = JSON.parse(args[2]);
  if (!dataDir) {
    console.error(
      "Usage: bun pglite_socket_server.ts <socket_path> <data_dir> [opts]"
    );
    console.error("  socket_path: Unix socket path");
    console.error("  data_dir: Database directory");
    console.error("  opts: JSON string of options");
    process.exit(1);
  }

  const runner = new PGLiteSocketServerRunner(
    socketPath,
    dataDir,
    opts.port,
    opts.host
  );
  runner.start();
}

export default PGLiteSocketServerRunner;
