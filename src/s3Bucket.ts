import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ConfigInterface } from './Config';

interface s3Bucket {
    instance: aws.s3.Bucket,
    secretPolicy: aws.s3.BucketPolicy,
    bucketDomain: pulumi.Output<string>,
}

const createS3Bucket = (
    config: ConfigInterface,
): s3Bucket => {

    // Create the AWS S3 bucket
    const bucket = new aws.s3.Bucket(config.domain, {
        acl: "public-read",
        website: {
            indexDocument: "index.html",
        },
        tags: config.tags,
    });

    // Restrict access to S3 static website unless correct value is given HTTP referer header
    const policy = new aws.s3.BucketPolicy(`aws-referer-policy`, {
        bucket: bucket.id,
        policy: {
            Version: '2008-10-17',
            Id: 'PolicyForCloudFrontOnlyToS3StaticWebsite',
            Statement: [
                {
                    Sid: '1',
                    Effect: 'Allow',
                    Principal: '*',
                    Action: 's3:GetObject',
                    Resource: bucket.arn.apply(arn => arn.toString() + '/*'),
                    Condition: {
                        StringLike: {
                            'aws:Referer': config.cloudfrontReferer
                        }
                    }
                }
            ]
        },
    });

    // Parse the S3 static website hostname
    const originDomainName = pulumi.all([bucket.id, bucket.region])
        .apply(([bucketId, bucketRegion]) => `${bucketId}.s3-website-${bucketRegion}.amazonaws.com`);

    return {
        instance: bucket,
        secretPolicy: policy,
        bucketDomain: originDomainName,
    }
};

export default createS3Bucket;
