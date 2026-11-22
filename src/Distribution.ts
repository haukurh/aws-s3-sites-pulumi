import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ConfigInterface } from './Config';

const createDistribution = (
  config: ConfigInterface,
  bucket: aws.s3.Bucket,
  acmArn: pulumi.Output<string>,
): aws.cloudfront.Distribution => {
  const oac = new aws.cloudfront.OriginAccessControl(config.domain, {
    name: config.domain,
    description: `OAC for CloudFront to access S3 bucket ${config.domain}`,
    originAccessControlOriginType: 's3',
    signingBehavior: 'always',
    signingProtocol: 'sigv4',
  });
  const originDomainName = pulumi
    .all([bucket.id, bucket.region])
    .apply(
      ([bucketId, bucketRegion]) =>
        `${bucketId}.s3-website-${bucketRegion}.amazonaws.com`,
    );
  const distributionArgs: aws.cloudfront.DistributionArgs = {
    comment: config.domain,
    tags: config.tags,
    defaultCacheBehavior: {
      allowedMethods: ['GET', 'HEAD'],
      cachedMethods: ['GET', 'HEAD'],
      targetOriginId: config.domain,
      viewerProtocolPolicy: 'redirect-to-https',
      compress: true,
      cachePolicyId: config.cloudfrontCachePolicyId,
      responseHeadersPolicyId: config.cloudfrontResponsePolicyId,
    },
    enabled: true,
    httpVersion: 'http2and3',
    isIpv6Enabled: false,
    aliases: [config.domain],
    defaultRootObject: 'index.html',
    customErrorResponses: [
      {
        errorCode: 403,
        errorCachingMinTtl: 10,
        responseCode: 404,
        responsePagePath: '/error.html',
      },
      {
        errorCode: 404,
        errorCachingMinTtl: 10,
        responseCode: 404,
        responsePagePath: '/error.html',
      },
    ],
    staging: false,
    origins: [
      {
        originId: config.domain,
        domainName: bucket.bucketRegionalDomainName,
        originAccessControlId: oac.id,

        s3OriginConfig: {
          originAccessIdentity: '',
        },
      },
    ],
    restrictions: {
      geoRestriction: {
        restrictionType: 'none',
      },
    },
    viewerCertificate: {
      acmCertificateArn: acmArn,
      cloudfrontDefaultCertificate: false,
      minimumProtocolVersion: 'TLSv1.2_2021',
      sslSupportMethod: 'sni-only',
    },
    loggingConfig: {
      bucket: 'haukurh-logs.s3.amazonaws.com',
      prefix: `cf/${config.domain}/`,
      includeCookies: false,
    },
  };

  // Create a CloudFront distribution
  return new aws.cloudfront.Distribution(config.domain, distributionArgs);
};

export default createDistribution;
