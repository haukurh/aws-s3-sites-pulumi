import * as aws from '@pulumi/aws';
import { ConfigInterface } from './Config';

interface User {
    instance: aws.iam.User,
    accessKey: aws.iam.AccessKey,
    s3Policy: aws.iam.UserPolicy,
    cloudfrontPolicy: aws.iam.UserPolicy,
}

const createIamUser = (
    config: ConfigInterface,
    bucket: aws.s3.Bucket,
    distribution: aws.cloudfront.Distribution
): User => {

    // Create AWS IAM user for CI/CD automation
    const user = new aws.iam.User(`aws-iam-automation-user`, {
        path: '/system/',
        tags: config.tags,
    });

    // Issue programmatic access key
    const accessKey = new aws.iam.AccessKey('aws-iam-automation-user-access-key', {
        user: user.name,
    });

    // User policy which gives access to the S3 bucket
    const s3Policy = new aws.iam.UserPolicy('aws-iam-automation-user-policy-to-s3-bucket', {
        user: user.name,
        policy: {
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'VisualEditor0',
                    Effect: 'Allow',
                    Action: [
                        's3:PutObject',
                        's3:GetObject',
                        's3:ListBucket',
                        's3:DeleteObject'
                    ],
                    Resource: [
                        bucket.arn.apply(arn => arn.toString() + "/*"),
                        bucket.arn,
                    ]
                }
            ]
        },
    });

    // User policy which allows CloudFront invalidation requests
    const cloudfrontPolicy = new aws.iam.UserPolicy('aws-iam-automation-user-policy-cloudfront-invalidation', {
        user: user.name,
        policy: {
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'VisualEditor0',
                    Effect: 'Allow',
                    Action: 'cloudfront:CreateInvalidation',
                    Resource: distribution.arn,
                }
            ]
        },
    });

    return {
        instance: user,
        accessKey,
        s3Policy,
        cloudfrontPolicy,
    };
};

export default createIamUser;
