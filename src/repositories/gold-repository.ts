import {injectable} from "inversify";
import axios from "axios";
import {Config} from "src/config";

@injectable()
export class GoldRepository {

    private readonly config: Config = new Config();

    public async getGoldPrices(startDate: string, endDate: string) {

        try {
            const {data: result} = await axios.get(
                this.config.nhb.url + "/" + startDate + "/" + endDate,
            );

            return result;
        } catch (error) {
            console.error("Error fetching gold prices", error)
            throw error;
        }
    }
}