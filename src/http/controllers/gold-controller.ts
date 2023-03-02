import { NextFunction, Response, Router } from "express";
import { injectable } from "inversify";
import {GoldService} from "src/services/gold-service";

@injectable()
export class GoldController {
  public readonly router: Router;
  private readonly goldService:GoldService;

  constructor() {
    this.router = Router();
    this.goldService = new GoldService();
    this.router.get("/maxprofit", this.getMaxProfit.bind(this));
  }

  private async getMaxProfit(
    req: any,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const profit = await this.goldService.getMaxGoldProfit();
      console.log("profit is " + profit);
      res.send({profit: profit});
    } catch (error) {
      console.error(error);
      res.status(500).send({
        code: "SERVER_ERROR",
        message:
            "Something unexpected happened, we are investigating this issue right now",
      });
    }
  }
}
