import { NextFunction, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { OrdersService } from "src/services/orders-service";
import { AuthRequest } from "src/http/middlewares/validate-auth";
import { MigrationValidator } from "src/http/routes/migration/migration-validator";

@injectable()
export class MigrationController {
  @inject(MigrationValidator) private migrationValidator: MigrationValidator;

  @inject(OrdersService) private ordersService: OrdersService;

  public readonly router: Router;

  constructor() {
    this.router = Router();
    this.router.post("/orders", this.createOrder.bind(this));
    this.router.delete("/orders/:id", this.deleteOrder.bind(this));
  }

  private async createOrder(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const body = this.migrationValidator.validateAndMapCreateOrderBody(
        req.body
      );
      const orderId = await this.ordersService.upsertForMigration(
        req.user.business_id,
        body
      );
      res.send({ id: orderId });
    } catch (error) {
      next(error);
    }
  }

  private async deleteOrder(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await this.ordersService.deleteByIdAndBusinessIdForMigration(
        req.params.id,
        req.user.business_id
      );
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  }
}
