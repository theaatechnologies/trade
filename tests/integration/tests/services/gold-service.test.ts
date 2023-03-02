import {container} from "src/container";
import {GoldService} from "src/services/gold-service";

describe("GoldService", () => {
    const goldService = container.get(GoldService);

    describe("Gold profit", () => {
        it("should get max profit in 5 years", async () => {
            const result = await goldService.getMaxGoldProfit()
            expect(result).toEqual({
                "buyDate": "2018-09-28",
                "buyPrice": 139.32,
                "profit": 151598.83720930235,
                "profitPercent": 212.2954349698536,
                "saleDate": "2022-03-09",
                "salePrice": 295.77,
            });
        });
    });
});
