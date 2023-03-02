import { injectable } from "inversify";

@injectable()
class Config {

  public readonly httpServer = {
    port:
      (process.env.HTTP_SERVER_PORT && Number(process.env.HTTP_SERVER_PORT)) ||
      3000,
  };

  public readonly nhb = {
    url:
        "http://api.nbp.pl/api/cenyzlota",
  };
}

export { Config };
