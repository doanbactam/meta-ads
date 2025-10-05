declare module 'facebook-nodejs-business-sdk' {
  export class FacebookAdsApi {
    static init(accessToken: string): void;
  }

  export class AdAccount {
    constructor(id: string);
  }

  export class Campaign {
    constructor(id: string);
  }

  export class AdSet {
    constructor(id: string);
  }

  export class Ad {
    constructor(id: string);
  }
}
