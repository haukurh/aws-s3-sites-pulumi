import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import config from './src/Config';
import createIamUser from './src/iamUser';
import createS3Bucket from './src/s3Bucket';
import createDistribution from './src/Distribution';
import createCertificate from './src/Acm';
import { createDomain, getZone } from './src/Route53';

const bucket = createS3Bucket(config);
const route53DnsZone = getZone(config.domain);
const acmArn = createCertificate(config, route53DnsZone);
const distribution = createDistribution(config, bucket, acmArn);

const policy = new aws.s3.BucketPolicy(
  `${config.domain}-cloudfront-only-policy`,
  {
    bucket: bucket.id,
    policy: pulumi
      .all([bucket.arn, distribution.arn])
      .apply(([bucketArn, distributionArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AllowCloudFrontDistributionReadOnly',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudfront.amazonaws.com',
              },
              Action: 's3:GetObject',
              Resource: `${bucketArn}/*`,
              Condition: {
                StringEquals: {
                  'AWS:SourceArn': distributionArn,
                },
              },
            },
          ],
        }),
      ),
  },
);

createDomain(config, route53DnsZone, distribution);
const user = createIamUser(config, bucket, distribution);

// Export relevant details
export const AWS_S3_BUCKET = bucket.id;
export const AWS_CLOUDFRONT_DIST = distribution.id;
export const AWS_ACCESS_KEY_ID = user.accessKey.id;
export const AWS_SECRET_ACCESS_KEY = user.accessKey.secret;
