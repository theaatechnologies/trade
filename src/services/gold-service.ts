import {injectable} from "inversify";
import {GoldRepository} from "src/repositories/gold-repository";

export interface gold {
    data: string;
    cena: number;
}

export interface profit {
    buyDate: string;
    buyPrice: number;
    saleDate: string;
    salePrice: number;
    finalProfit: number;
}

@injectable()
export class GoldService {

    public goldRepository: GoldRepository = new GoldRepository();

    public async getMaxGoldProfit() {

        const money = 135000;
        const yearly = new Map();
        yearly.set(1, ["2017-04-27", "2018-04-27"]);
        yearly.set(2, ["2018-04-28", "2019-04-27"]);
        yearly.set(3, ["2019-04-28", "2020-04-27"]);
        yearly.set(4, ["2020-04-28", "2021-04-27"]);
        yearly.set(5, ["2021-04-28", "2022-04-27"]);

        let fiveYearPrice: gold[] = [];
        for (let i = 1; i <= 5; i++) {
            const prices = await this.goldRepository.getGoldPrices(yearly.get(i)[0], yearly.get(i)[1]);
            fiveYearPrice.push(...prices);
        }

        let maxProfit: profit = this.maxProfit(fiveYearPrice);

        return {
            'buyDate': maxProfit['buyDate'],
            'buyPrice': maxProfit['buyPrice'],
            'saleDate': maxProfit['saleDate'],
            'salePrice': maxProfit['salePrice'],
            'profitPercent': maxProfit['finalProfit'] * 100,
            'profit': (money * maxProfit['finalProfit']) - money
        };
    }


    private maxProfit(prices: gold[]): profit {

        const len = prices.length;

        if (len <= 1) {
            return {
                buyDate: null, buyPrice: null, saleDate: null, salePrice:  null,
                finalProfit: 0
            };
        }

        const leftHalf = prices.slice(0, len / 2);
        const rightHalf = prices.slice(len / 2);

        const leftBest: {} = this.maxProfit(leftHalf);
        const rightBest: {} = this.maxProfit(rightHalf);

        const leftMin = leftHalf.reduce(function (prev, next) {
            return (prev === null || next.cena < prev.cena) ? next : prev;
        });

        const rightMax = rightHalf.reduce(function (prev, next) {
            return (prev === null || next.cena > prev.cena) ? next : prev;
        });

        let bothBest = {}
        if (rightMax.cena > leftMin.cena) {
            bothBest = {
                buyDate: leftMin.data,
                buyPrice: leftMin.cena,
                saleDate: rightMax.data,
                salePrice: rightMax.cena,
                finalProfit: rightMax.cena / leftMin.cena
            };
        } else {
            bothBest = {
                finalProfit: 0
            };
        }

        return <profit>[leftBest, rightBest, bothBest].reduce(function (first, second) {
            // @ts-ignore
            return (first === null || second['finalProfit'] > first['finalProfit']) ? second : first;
        });
    }
}