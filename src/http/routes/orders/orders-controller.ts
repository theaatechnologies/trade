import { NextFunction, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { OrdersService } from "src/services/orders-service";
import { OrdersValidator } from "src/http/routes/orders/orders-validator";
import { AuthRequest } from "src/http/middlewares/validate-auth";
import { CSVReportService } from "src/services/csv-report-service";

@injectable()
export class OrdersController {
  @inject(OrdersValidator) private ordersValidator: OrdersValidator;

  @inject(OrdersService) private ordersService: OrdersService;

  @inject(CSVReportService) private csvReportsService: CSVReportService;

  public readonly router: Router;

  constructor() {
    this.router = Router();
    this.router.get("/csv-report", this.getCSV.bind(this));
    this.router.get("/summary", this.getSummary.bind(this));
    this.router.get("/", this.getList.bind(this));
    this.router.post("/", this.create.bind(this));
    this.router.get("/:id", this.getById.bind(this));
    this.router.put("/:id/status", this.update.bind(this));
    this.router.delete("/:id", this.delete.bind(this));
  }

  private async update(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const body = this.ordersValidator.validateUpdateStatusBody(req.body);
      await this.ordersService.updateStatus(
        req.user.business_id,
        req.params.id,
        body
      );

      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  }

  private async getCSV(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = this.ordersValidator.validateGetCSVQuery(req.query);
      const result = await this.csvReportsService.getCsv(
        req.user.business_id,
        query
      );
      res.setHeader(
        "Content-disposition",
        "attachment; filename=" + "orders.csv"
      );
      res.send(result);
    } catch (error) {
      next(error);
    }
  }

  private async create(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const body = this.ordersValidator.validateAndMapCreateBody(req.body);
      const orderId = await this.ordersService.create(
        req.user.business_id,
        body
      );
      res.send({ id: orderId });
    } catch (error) {
      next(error);
    }
  }

  private async getSummary(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = this.ordersValidator.validateAndMapGetSummaryQuery(
        req.query
      );
      const { business_id: businessId } = req.user;
      const result = await this.ordersService.getSummary(businessId, query);
      res.send(result);
    } catch (error) {
      next(error);
    }
  }

  private async getList(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = this.ordersValidator.validateAndMapGetListQuery(req.query);
      const result = await this.ordersService.getList(req.user.business_id, {
        ...query,
        page: query.page,
        limit: query.limit,
      });
      res.send(result);
    } catch (error) {
      next(error);
    }
  }

  private async getById(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.ordersService.getByBusinessIdAndId(
        req.user.business_id,
        req.params.id
      );
      res.send(result);
    } catch (error) {
      next(error);
    }
  }

  private async delete(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await this.ordersService.delete(req.user.business_id, req.params.id);

      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  }
}
