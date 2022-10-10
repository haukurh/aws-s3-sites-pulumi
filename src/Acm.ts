import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ConfigInterface } from './Config';

const createCertificate = (
    config: ConfigInterface,
    dnsZone: Promise<aws.route53.GetZoneResult>,
): pulumi.Output<string> => {

    // Certificates for CloudFront must be in the 'us-east-1' region, so need to specify the AWS region
    const awsUsEast = new aws.Provider('aws-provider-us-east-1', {
        region: 'us-east-1',
    });

    // Create an ACM certificate
    const certificate = new aws.acm.Certificate('aws-acm-certificate', {
        domainName: config.domain,
        validationMethod: 'DNS',
        tags: config.tags,
    }, { provider: awsUsEast });

    // Validate the certificate with a DNS record through Route53
    const certificateValidation = new aws.route53.Record('aws-route53-certificate-validation', {
        name: certificate.domainValidationOptions[0].resourceRecordName,
        records: [certificate.domainValidationOptions[0].resourceRecordValue],
        ttl: 60,
        type: certificate.domainValidationOptions[0].resourceRecordType,
        zoneId: dnsZone.then(x => x.zoneId),
    });

    // Wait for ACM to validate and issue the certificate
    const acmValidation = new aws.acm.CertificateValidation('aws-acm-certificate-validation', {
        certificateArn: certificate.arn,
        validationRecordFqdns: [certificateValidation.fqdn],
    }, { provider: awsUsEast });

    return acmValidation.certificateArn;
};

export default createCertificate;
