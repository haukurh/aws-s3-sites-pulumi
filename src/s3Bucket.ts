import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ConfigInterface } from './Config';

const createS3Bucket = (config: ConfigInterface): aws.s3.Bucket => {
  const bucket = new aws.s3.Bucket(config.domain, {
    bucket: config.domain,
    tags: config.tags,
  });

  // Enforce bucket-owner ownership; ACLs are not needed for this setup.
  const ownershipControls = new aws.s3.BucketOwnershipControls(
    `${config.domain}-ownership-controls`,
    {
      bucket: bucket.id,
      rule: {
        objectOwnership: 'BucketOwnerEnforced',
      },
    },
  );

  // Block public ACLs and public bucket policies.
  const publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
    `${config.domain}-public-access-block`,
    {
      bucket: bucket.id,
      blockPublicAcls: true,
      ignorePublicAcls: true,
      blockPublicPolicy: true,
      restrictPublicBuckets: true,
    },
  );

  const encryption = new aws.s3.BucketServerSideEncryptionConfiguration(
    `${config.domain}-encryption`,
    {
      bucket: bucket.id,
      rules: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    },
  );
  return bucket;
};

export default createS3Bucket;
