import {
    DCATRootObject,
    Dataset,
    ContactPoint,
    Distribution,
} from "@dto/open-data-dk-dcat.dto";
import { OpenDataDkDataset } from "@entities/open-data-dk-dataset.entity";
import { Organization } from "@entities/organization.entity";
import { Injectable } from "@nestjs/common";
import { getManager, Repository } from "typeorm";

@Injectable()
export class OpenDataDkSharingService {
    constructor(private repository: Repository<OpenDataDkDataset>) {}
    async createDCAT(organization: Organization): Promise<DCATRootObject> {
        return null;
    }

    async getAllOpenDataDkSharesForOrganization(
        organization: Organization
    ): Promise<OpenDataDkDataset[]> {
        const results = await this.repository
        .createQueryBuilder("dataset")
        .innerJoin("dataset.datatarget", "dt")
        .innerJoin("dt.application")

        return null;
    }

    mapToDCAT(datasets: OpenDataDkDataset[]): DCATRootObject {
        const root = new DCATRootObject();
        root["@context"] = "https://project-open-data.cio.gov/v1.1/schema/catalog.jsonld";
        root["@type"] = "dcat:Catalog";
        root.conformsTo = "https://project-open-data.cio.gov/v1.1/schema";
        root.describedBy = "https://project-open-data.cio.gov/v1.1/schema/catalog.json";
        const sampleDataset = new Dataset();
        sampleDataset["@type"] = "dcat:Dataset";
        sampleDataset.identifier = "TODO";
        sampleDataset.license = "MIT";
        sampleDataset.landingPage = "TODO";
        sampleDataset.title = "Mit første datasæt";
        sampleDataset.description = "Dette er mit datasæt";
        sampleDataset.keyword = ["hej", "kaj"];
        sampleDataset.issued = new Date();
        sampleDataset.modified = new Date();
        sampleDataset.publisher = {
            name: "Orgnisation navn",
        };
        sampleDataset.contactPoint = new ContactPoint();
        sampleDataset.contactPoint["@type"] = "vcard:Contact";
        sampleDataset.contactPoint.fn = "???";
        sampleDataset.contactPoint.hasEmail = "a@a.dk";

        sampleDataset.accessLevel = "public";
        sampleDataset.distribution;

        const distribution = new Distribution();
        distribution["@type"] = "dcat:Distribution";
        distribution.title = "title";
        distribution.format = "JSON";
        distribution.mediaType = "application/json";
        distribution.accessURL = this.generateAccessUrl();

        sampleDataset.distribution = [distribution];
        root.dataset = [sampleDataset];
        return root;
    }

    generateAccessUrl(): string {
        return "https://test.dk/blabla";
    }
}
