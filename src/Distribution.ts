import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ConfigInterface } from './Config';

const createDistribution = (
    config: ConfigInterface,
    originDomainName: pulumi.Output<string>,
    acmArn: pulumi.Output<string>,
): aws.cloudfront.Distribution => {

    // CloudFront distribution settings
    const distributionArgs: aws.cloudfront.DistributionArgs = {
        comment: config.domain,
        tags: config.tags,
        defaultCacheBehavior: {
            allowedMethods: [
                'GET',
                'HEAD',
            ],
            cachedMethods: [
                'GET',
                'HEAD',
            ],
            targetOriginId: config.domain,
            viewerProtocolPolicy: 'redirect-to-https',
            compress: true,
            cachePolicyId: config.cloudfrontCachePolicyId,
        },
        enabled: true,
        isIpv6Enabled: true,
        aliases: [config.domain],
        origins: [
            {
                domainName: originDomainName,
                originId: config.domain,
                customHeaders: [
                    {
                        name: 'Referer',
                        value: config.cloudfrontReferer,
                    }
                ],
                customOriginConfig: {
                    httpPort: 80,
                    httpsPort: 443,
                    originProtocolPolicy: 'http-only',
                    originSslProtocols: ['SSLv3'],
                }
            }
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
