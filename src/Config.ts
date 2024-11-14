import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

interface AWS {
  region: string;
}

interface Tags {
  [key: string]: string;
}

export interface ConfigInterface {
  acmArn?: string;
  domain: string;
  cloudfrontReferer: string;
  cloudfrontCachePolicyId: string;
  tags: Tags;
  aws: AWS;
}

const projectConfig = new pulumi.Config('project');
const awsConfig = new pulumi.Config('aws');

// Custom header sent from CloudFront to the S3 static site
const cloudfrontReferer = 'R8EyyuR028vQFBiD';
const cloudfrontRefererBase64 = Buffer.from(cloudfrontReferer, 'utf8').toString(
  'base64',
);

const domain = projectConfig.require<string>('domain');
const defaultTags = {
  CreatedBy: 'pulumi',
  Site: domain,
};
const projectTags = projectConfig.getObject<Tags>('tags');
const tags =
  projectTags !== undefined ? { ...defaultTags, ...projectTags } : defaultTags;

// Default policy: AWS Managed-CachingOptimized
const cloudfrontCachePolicyId =
  projectConfig.get<string>('cloudfrontCachePolicyId') ??
  '658327ea-f89d-4fab-a63d-7e88639e58f6';

const config: ConfigInterface = {
  domain: domain,
  cloudfrontReferer: cloudfrontRefererBase64,
  cloudfrontCachePolicyId: cloudfrontCachePolicyId,
  tags: tags,
  aws: {
    region: awsConfig.require<string>('region'),
  },
};

export default config;
