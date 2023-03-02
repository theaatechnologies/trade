import express from "express";
import http from "http";
import { Config } from "src/config";
import { inject, injectable } from "inversify";
import swaggerUi from "swagger-ui-express";
import openapiDoc from "src/http/openapi.json";
import {GoldController} from "src/http/controllers/gold-controller";

@injectable()
export class HttpServer {
  @inject(Config) private readonly config: Config = new Config();

  @inject(GoldController) private readonly goldController: GoldController =  new GoldController();

  private httpServer: http.Server;

  public start() {
    if (this.httpServer) return;

    const app = express();
    this.initRoutes(app);

    this.httpServer = app.listen(this.config.httpServer.port);
    console.log(
      {
        port: this.config.httpServer.port,
      },
      "HTTP server started"
    );
  }

  public async shutdown() {
    if (!this.httpServer) return;
    await new Promise<void>((resolve) =>
      this.httpServer.close(() => {
        console.log("HTTP server shutdown");
        resolve();
      })
    );
  }

  private initRoutes(app: express.Application) {
    app.use("/gold", this.goldController.router);
    app.use("/", swaggerUi.serve, swaggerUi.setup(openapiDoc));
  }
}
