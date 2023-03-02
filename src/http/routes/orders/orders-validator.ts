import { injectable } from "inversify";
import { ParsedQs } from "qs";
import Joi from "joi";
import {
  OrderPaymentType,
  OrdersGetListParams,
  OrdersGetListSort,
  OrderStatus,
  OrderStatusUpdateInput,
  OrderSource,
  OrderCurrency,
  OrderShipmentMethod,
  OrderManualPaymentMethod,
  OrderPaymentStatus,
  OrderCreateInput,
  OrderShipmentPackageType,
  OrderShipmentPaymentType,
} from "src/repositories/orders-repository";
import { RouteValidator } from "src/http/routes/route-validator";
import { OrdersGetSummaryParams } from "src/services/orders-service";
import { GetCsvParams } from "src/services/csv-report-service";

@injectable()
export class OrdersValidator extends RouteValidator {
  public validateAndMapGetSummaryQuery(data: ParsedQs): OrdersGetSummaryParams {
    const schema = Joi.object({
      filter: Joi.object({
        store_channel_id: Joi.object({
          eq: Joi.string().uuid().required(),
        }),
        "payment.status": Joi.object({
          eq: Joi.string()
            .valid(...Object.values(OrderPaymentStatus))
            .required(),
        }),
      }),
    });
    return this.validate<ParsedQs, OrdersGetSummaryParams>(schema, data);
  }

  public validateGetCSVQuery(data: ParsedQs): GetCsvParams {
    const schema = Joi.object({
      filter: Joi.object({
        created_at: Joi.object({
          gte: Joi.date().required(),
          lte: Joi.date().required(),
        }).required(),
        status: Joi.object({
          in: Joi.array()
            .items(Joi.string().valid(...Object.values(OrderStatus)))
            .single()
            .required(),
        }),
        store_channel_id: Joi.object({
          eq: Joi.string().uuid().required(),
        }),
      }).required(),
    });
    return this.validate<ParsedQs, GetCsvParams>(schema, data);
  }

  public validateAndMapGetListQuery(data: ParsedQs): OrdersGetListParams {
    const schema = Joi.object({
      filter: Joi.object({
        status: Joi.object({
          in: Joi.array()
            .items(Joi.string().valid(...Object.values(OrderStatus)))
            .single()
            .required(),
        }),
        order_number: Joi.object({
          in: Joi.array().items(Joi.number().integer()).single().required(),
        }),
        store_channel_id: Joi.object({
          eq: Joi.string().uuid().required(),
        }),
        "payment.type": Joi.object({
          in: Joi.array()
            .items(Joi.string().valid(...Object.values(OrderPaymentType)))
            .single()
            .required(),
        }),
        "customer.full_name": Joi.object({
          contains: Joi.array().items(Joi.string()).single().required(),
        }),
        created_at: Joi.object({
          gte: Joi.date().when(Joi.object({ lte: Joi.date().exist() }), {
            then: Joi.date().greater(Joi.ref("lte")),
          }),
          lte: Joi.date().when(Joi.object({ gte: Joi.date().exist() }), {
            then: Joi.date().less(Joi.ref("gte")),
          }),
        }),
      }),
      sort: Joi.string().valid(...Object.values(OrdersGetListSort)),
      page: Joi.number().min(1).default(1),
      limit: Joi.number().min(1).default(25),
    });
    return this.validate<ParsedQs, OrdersGetListParams>(schema, data);
  }

  public validateAndMapCreateBody(
    data: Record<string, unknown>
  ): OrderCreateInput {
    const defaultShipmentSchema = Joi.object({
      sender: Joi.object({
        first_name: Joi.string(),
        last_name: Joi.string(),
        address: Joi.object({
          address: Joi.string(),
          lat: Joi.number(),
          long: Joi.number(),
        }),
      }),
      recipient: Joi.object({
        first_name: Joi.string(),
        last_name: Joi.string(),
        address: Joi.object({
          address: Joi.string(),
          lat: Joi.number(),
          long: Joi.number(),
        }),
        email: Joi.string().email(),
        mobile_phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
      })
        .required()
        .or("mobile_phone", "email"),
      fee: Joi.number().min(0).default(0),
    });
    const xenditPartnerShipmentSchema = Joi.object({
      sender: Joi.object({
        first_name: Joi.string().required(),
        last_name: Joi.string(),
        mobile_phone: Joi.string()
          .pattern(/^(^\+62|62|^08)(\d{3,4}-?){2}\d{3,4}$/)
          .required(),
        address: Joi.object({
          address: Joi.string().required(),
          area_id: Joi.number().required(),
          country_id: Joi.number().required(),
          notes: Joi.string(),
          lat: Joi.number().required(),
          long: Joi.number().required(),
        }).required(),
      }).required(),
      recipient: Joi.object({
        first_name: Joi.string().required(),
        last_name: Joi.string(),
        address: Joi.object({
          address: Joi.string().required(),
          area_id: Joi.number().required(),
          country_id: Joi.number().required(),
          notes: Joi.string(),
          lat: Joi.number().required(),
          long: Joi.number().required(),
        }).required(),
        email: Joi.string().email(),
        mobile_phone: Joi.string()
          .pattern(/^(^\+62|62|^08)(\d{3,4}-?){2}\d{3,4}$/)
          .required(),
      }).required(),
      courier: Joi.object({
        rate_id: Joi.number().required(),
      }).required(),
      package: Joi.object({
        height: Joi.number().required(),
        length: Joi.number().required(),
        width: Joi.number().required(),
        weight: Joi.number().min(0.01).required(),
        type: Joi.number()
          .valid(...Object.values(OrderShipmentPackageType))
          .required(),
      }).required(),
      payment_type: Joi.string()
        .valid(...Object.values(OrderShipmentPaymentType))
        .required(),
    });
    const schema = Joi.object({
      user_id: Joi.string(),
      store_channel_id: Joi.string().guid().required(),
      storefront_id: Joi.string(),
      source: Joi.string()
        .valid(...Object.values(OrderSource))
        .required(),
      //TODO: require only for MANUAL_PAYMENT, for PAYMENT_LINK is always UNPAID
      status: Joi.string()
        .valid(...Object.values(OrderStatus))
        .required(),
      description: Joi.string().max(3000),
      customer: Joi.object({
        first_name: Joi.string().required(),
        last_name: Joi.string(),
        mobile_phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/),
        address: Joi.object({
          address: Joi.string(),
        }),
        email: Joi.string().email(),
      }).or("mobile_phone", "email"),
      shipment: Joi.object({
        method: Joi.string()
          .valid(...Object.values(OrderShipmentMethod))
          .required(),
      }).when(
        Joi.object({
          method: OrderShipmentMethod.XENDIT_PARTNER,
        }).unknown(),
        {
          then: xenditPartnerShipmentSchema,
          otherwise: defaultShipmentSchema,
        }
      ),
      cart: Joi.alternatives()
        .try(
          Joi.array().items(
            Joi.object({
              item_id: Joi.string().guid().required(),
              item_variant_id: Joi.string().guid().required(),
              quantity: Joi.number().integer().min(1).required(),
            })
          )
        )
        .try(
          Joi.array().items(
            Joi.object({
              name: Joi.string().required(),
              price: Joi.number().min(1000).required(),
              quantity: Joi.number().integer().min(1).required(),
            })
          )
        )
        .required(),
      payment: Joi.object({
        type: Joi.string()
          .valid(...Object.values(OrderPaymentType))
          .required(),
      })
        .when(
          Joi.object({
            type: OrderPaymentType.MANUAL_PAYMENT,
          }).unknown(),
          {
            then: Joi.object({
              manual_payment: Joi.object({
                merchant_bank_name: Joi.string(),
                merchant_bank_account_name: Joi.string(),
                merchant_bank_account_no: Joi.string(),
                payment_method: Joi.string()
                  .valid(...Object.values(OrderManualPaymentMethod))
                  .required(),
              }).required(),
            }),
            otherwise: Joi.object({
              payment_link: Joi.object({
                invoice_success_redirect_url: Joi.string(),
                invoice_failure_redirect_url: Joi.string(),
              }),
            }),
          }
        )
        .required(),
      discount: Joi.number().min(0).default(0),
      currency: Joi.string()
        .valid(...Object.values(OrderCurrency))
        .required(),
    }).when(
      Joi.object({
        cart: Joi.array().length(0),
      }).unknown(),
      {
        then: Joi.object({
          total_cart_price: Joi.number().min(0).required(),
        }),
      }
    );
    return this.validate<Record<string, unknown>, OrderCreateInput>(
      schema,
      data
    );
  }

  public validateUpdateStatusBody(
    data: Record<string, unknown>
  ): OrderStatusUpdateInput {
    const schema = Joi.object({
      status: Joi.string()
        .valid(...Object.values(OrderStatus))
        .required(),
    });

    return this.validate<Record<string, unknown>, OrderStatusUpdateInput>(
      schema,
      data
    );
  }
}
