import { spawn, ChildProcess } from 'child_process';
import { rmSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import * as path from 'path';
import * as http from 'http';

export interface OwlcmsDriverOptions {
  /** Absolute path to the repo root. */
  repoRoot: string;
  /** How long to wait for :8080 to respond, in ms. */
  startupTimeoutMs?: number;
  /**
   * Optional absolute path to a pre-seeded H2 database file. When provided,
   * the driver wipes the existing database dir and copies this file in as
   * `owlcms-h2v2.mv.db` before launch. Tests depend on the golden DB
   * (records loaded, Gruppe 2 populated, etc.).
   */
  goldenFixturePath?: string;
}

export class OwlcmsDriver {
  private proc: ChildProcess | null = null;
  private readonly repoRoot: string;
  private readonly startupTimeoutMs: number;
  private readonly workDir: string;
  private readonly goldenFixturePath?: string;

  constructor(opts: OwlcmsDriverOptions) {
    this.repoRoot = opts.repoRoot;
    this.startupTimeoutMs = opts.startupTimeoutMs ?? 60_000;
    this.workDir = path.join(this.repoRoot, 'owlcms', 'target', 'owlcms');
    this.goldenFixturePath = opts.goldenFixturePath;
  }

  async start(): Promise<void> {
    if (this.proc) {
      throw new Error('owlcms already started');
    }

    const jar = path.join(this.workDir, 'owlcms.jar');
    if (!existsSync(jar)) {
      throw new Error(
        `owlcms.jar not found at ${jar}. Run: mvn -pl owlcms -am package -P production -Dmaven.test.skip=true -q`,
      );
    }

    // Wipe H2 database so every suite starts clean.
    const dbDir = path.join(this.workDir, 'database');
    if (existsSync(dbDir)) {
      rmSync(dbDir, { recursive: true, force: true });
    }
    mkdirSync(dbDir, { recursive: true });

    // Restore the golden fixture if one is configured.
    if (this.goldenFixturePath) {
      if (!existsSync(this.goldenFixturePath)) {
        throw new Error(`goldenFixturePath does not exist: ${this.goldenFixturePath}`);
      }
      copyFileSync(this.goldenFixturePath, path.join(dbDir, 'owlcms-h2v2.mv.db'));
      console.log(`[owlcms-driver] restored golden fixture from ${this.goldenFixturePath}`);
    }

    this.proc = spawn('java', ['-jar', 'owlcms.jar'], {
      cwd: this.workDir,
      env: { ...process.env, OWLCMS_ENABLEEMBEDDEDMQTT: 'false' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.proc.stdout?.on('data', (chunk) => {
      process.stdout.write(`[owlcms] ${chunk}`);
    });
    this.proc.stderr?.on('data', (chunk) => {
      process.stderr.write(`[owlcms] ${chunk}`);
    });

    this.proc.on('exit', (code, signal) => {
      console.log(`[owlcms-driver] subprocess exited code=${code} signal=${signal}`);
      this.proc = null;
    });

    await this.waitForPort();
  }

  async stop(): Promise<void> {
    if (!this.proc) return;
    const p = this.proc;
    this.proc = null;
    p.kill('SIGTERM');
    await new Promise<void>((resolve) => {
      const t = setTimeout(() => {
        p.kill('SIGKILL');
        resolve();
      }, 5_000);
      p.once('exit', () => {
        clearTimeout(t);
        resolve();
      });
    });
  }

  private async waitForPort(): Promise<void> {
    const deadline = Date.now() + this.startupTimeoutMs;
    while (Date.now() < deadline) {
      if (await this.isUp()) return;
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`owlcms did not respond on :8080 within ${this.startupTimeoutMs}ms`);
  }

  private isUp(): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.get('http://localhost:8080/', (res) => {
        res.resume();
        resolve((res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 500);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(1000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }
}
