import { Expose } from "class-transformer";

export class Publisher {
  name: string;
}

export class ContactPoint {
  @Expose({ name: "@type" })
  "@type": string;
  fn: string;
  hasEmail: string;
}

export class Distribution {
  @Expose({ name: "@type" })
  "@type": string;
  title?: string;
  format: string;
  license: string;
  mediaType: string;
  accessURL: string;
}

export class Dataset {
  @Expose({ name: "@type" })
  "@type": string;
  identifier: string;
  landingPage: string;
  title: string;
  description: string;
  keyword: string[];
  issued: Date;
  modified: Date;
  publisher: Publisher;
  contactPoint: ContactPoint;
  accessLevel: string;
  distribution: Distribution[];
  spatial: string;
  theme: string[];
  documentation: string;
  frequency: string | undefined;
  dataDirectory: boolean;
}

export class DCATRootObject {
  @Expose({ name: "@context" })
  "@context": string;
  @Expose({ name: "@type" })
  "@type": string;
  conformsTo: string;
  describedBy: string;
  dataset: Dataset[];
}
