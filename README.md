# AWS S3 static websites behind CloudFront

A Pulumi project for setting up and configuring a S3 bucket (static website hosting) behind CloudFront with a custom 
domain name.

## Config

All you need to do is to set everything in the config for your desired stack.

Everything use the scope/key `project`

Set the necessary config

```shell
pulumi config set --path aws:region: eu-west-1
pulumi config set --path project:domain <value>
pulumi config set --path project:tags.Author "${USER}"
```

Config example:

```yaml
config:
  aws:region: eu-west-1
  project:domain: example.haukurh.dev
  project:tags:
    Author: haukurh
```

## Output

We're going to need the output from the setup in order to configure our CI/CD automation. 

```shell
pulumi stack output
```

## Create a new stack

```shell
pulumi stack init <org>/<domain>
```
