import * as aws from '@pulumi/aws';
import {ConfigInterface} from './Config';

export const getZone = (
    domain: string,
): Promise<aws.route53.GetZoneResult> => {
    const secondLevelDomain = domain
        .split('.')
        .slice(-2)
        .join('.');

    return aws.route53.getZone({
        name: secondLevelDomain,
        privateZone: false,
    });
};

export const createDomain = (
    config: ConfigInterface,
    dnsZone: Promise<aws.route53.GetZoneResult>,
    distribution: aws.cloudfront.Distribution,
): aws.route53.Record => {

    // Create a DNS record which points the domain to the CloudFront instance
    return new aws.route53.Record(`aws-route53-record-${config.domain}`, {
        name: config.domain,
        type: 'A',
        zoneId: dnsZone.then(x => x.zoneId),
        aliases: [
            {
                name: distribution.domainName,
                zoneId: distribution.hostedZoneId,
                evaluateTargetHealth: true,
            },
        ],
    });
};

