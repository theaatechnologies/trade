import { Request, Response, Router } from "express";
import { injectable } from "inversify";

@injectable()
export class HealthcheckController {
  public readonly router: Router;

  constructor() {
    this.router = Router();
    this.router.get("/liveness", this.healthcheckLiveness.bind(this));
    this.router.get("/readiness", this.healthcheckReadiness.bind(this));
  }

  private async healthcheckLiveness(req: Request, res: Response) {
    return res.sendStatus(200);
  }

  private async healthcheckReadiness(req: Request, res: Response) {
    return res.sendStatus(200);
  }
}
