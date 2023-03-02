import { injectable } from "inversify";
import Joi from "joi";
import {
  Order,
  OrderCurrency,
  OrderManualPaymentMethod,
  OrderPaymentLinkStatus,
  OrderPaymentStatus,
  OrderPaymentType,
  OrderShipmentMethod,
  OrderSource,
  OrderStatus,
} from "src/repositories/orders-repository";
import { RouteValidator } from "src/http/routes/route-validator";

@injectable()
export class MigrationValidator extends RouteValidator {
  public validateAndMapCreateOrderBody(
    data: Record<string, unknown>
  ): Partial<Order> {
    const schema = Joi.object({
      id: Joi.string().required(),
      user_id: Joi.string(),
      store_channel_id: Joi.string().guid().required(),
      storefront_id: Joi.string(),
      source: Joi.string()
        .valid(...Object.values(OrderSource))
        .required(),
      status: Joi.string()
        .valid(...Object.values(OrderStatus))
        .required(),
      description: Joi.string().max(3000),
      customer: Joi.object({
        id: Joi.string().required(),
        first_name: Joi.string().required(),
        last_name: Joi.string(),
        mobile_phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
        address: Joi.object({
          address: Joi.string(),
          country: Joi.string(),
          province: Joi.string(),
          city: Joi.string(),
          suburb: Joi.string(),
          area: Joi.string(),
          zip_code: Joi.string().regex(/^\d+$/).min(2),
        }),
        email: Joi.string().email(),
      }).or("mobile_phone", "email"),
      shipment: Joi.object({
        sender: Joi.object({
          first_name: Joi.string(),
          last_name: Joi.string(),
          address: Joi.object({
            address: Joi.string(),
            country: Joi.string(),
            province: Joi.string(),
            city: Joi.string(),
            suburb: Joi.string(),
            area: Joi.string(),
            lat: Joi.number(),
            long: Joi.number(),
            zip_code: Joi.string().regex(/^\d+$/).min(2),
          }),
        }),
        recipient: Joi.object({
          first_name: Joi.string(),
          last_name: Joi.string(),
          address: Joi.object({
            address: Joi.string(),
            country: Joi.string(),
            province: Joi.string(),
            city: Joi.string(),
            suburb: Joi.string(),
            area: Joi.string(),
            lat: Joi.number(),
            long: Joi.number(),
            zip_code: Joi.string().regex(/^\d+$/).min(2),
          }),
          email: Joi.string().email(),
          mobile_phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
        })
          .required()
          .or("mobile_phone", "email"),
        fee: Joi.number().min(0).default(0),
        method: Joi.string()
          .valid(...Object.values(OrderShipmentMethod))
          .required(),
      }),
      cart: Joi.array()
        .items(
          Joi.object({
            item_id: Joi.string().guid().required(),
            item_variant_id: Joi.string().guid().required(),
            name: Joi.string(),
            item_name: Joi.string(),
            item_variant_name: Joi.string(),
            quantity: Joi.number().integer().min(0).required(),
            price: Joi.number().min(0).required(),
            image_url: Joi.string(),
          })
            .or("name", "item_name")
            .required()
        )
        .required(),
      payment: Joi.object({
        type: Joi.string()
          .valid(...Object.values(OrderPaymentType))
          .required(),
        status: Joi.custom((value) => {
          const status = [OrderStatus.UNPAID, OrderStatus.CANCELLED].includes(
            data.status as OrderStatus
          )
            ? OrderPaymentStatus.UNPAID
            : OrderPaymentStatus.PAID;
          const { error } = Joi.string()
            .valid(status)
            .required()
            .validate(value);
          if (error) throw error;
          return value;
        }).required(),
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
                invoice_id: Joi.string().required(),
                invoice_url: Joi.string().required(),
                invoice_short_url: Joi.string(),
                expires_at: Joi.date().required(),
                paid_at: Joi.date(),
                payment_channel: Joi.string(),
                payment_method: Joi.string(),
                status: Joi.custom((value) => {
                  let status: OrderPaymentLinkStatus;
                  switch (data.status as OrderStatus) {
                    case OrderStatus.CANCELLED:
                      status = OrderPaymentLinkStatus.EXPIRED;
                      break;
                    case OrderStatus.UNPAID:
                      status = OrderPaymentLinkStatus.PENDING;
                      break;
                    default:
                      status = OrderPaymentLinkStatus.PAID;
                      break;
                  }
                  const { error } = Joi.string()
                    .valid(status)
                    .required()
                    .validate(value);
                  if (error) throw error;
                  return value;
                }).required(),
              }).required(),
            }),
          }
        )
        .required(),
      discount: Joi.number().min(0).default(0),
      currency: Joi.string()
        .valid(...Object.values(OrderCurrency))
        .required(),
      total_price: Joi.number().min(0).required(),
      total_cart_price: Joi.number().min(0).required(),
      created_at: Joi.date().required(),
      deleted_at: Joi.date(),
    });
    return this.validate<Record<string, unknown>, Partial<Order>>(schema, data);
  }
}
