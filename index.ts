import config from "./src/Config"
import createIamUser from "./src/iamUser";
import createS3Bucket from "./src/s3Bucket";
import createDistribution from "./src/Distribution";
import createCertificate from "./src/Acm";
import { createDomain, getZone } from "./src/Route53";

const bucket = createS3Bucket(config);
const route53DnsZone = getZone(config.domain);
const acmArn = createCertificate(config, route53DnsZone);
const distribution = createDistribution(config, bucket.bucketDomain, acmArn);
createDomain(config, route53DnsZone, distribution);
const user = createIamUser(config, bucket.instance, distribution);

// Export relevant details
export const AWS_S3_BUCKET = bucket.instance.id;
export const AWS_CLOUDFRONT_DIST = distribution.id;
export const AWS_ACCESS_KEY_ID = user.accessKey.id;
export const AWS_SECRET_ACCESS_KEY = user.accessKey.secret;
