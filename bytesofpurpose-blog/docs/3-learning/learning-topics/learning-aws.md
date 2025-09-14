# Learning Goals
 * Learn about AWS service ...

# Learning Plan
* [ ] Buy an AWS book

- [ ] Learn from Amazon resources ...
	- [ ] Read amazon whitepapers
		- https://aws.amazon.com/whitepapers
	- [ ] Read up on AWS Blogs
		- https://aws.amazon.com/blogs/compute/category/compute/aws-lambda/
		- https://aws.amazon.com/blogs/compute/category/application-services/amazon-api-gateway-application-services/
	- [ ] Check out these courses to learn from ...
		- https://smile.amazon.com/courses/your-courses?pageType=content&ref_=ya_d_l_lh
		
- [ ] Learn more about Serverless Architectures!
	- https://aws.amazon.com/blogs/architecture/ten-things-serverless-architects-should-know/
	- https://docs.aws.amazon.com/wellarchitected/latest/serverless-applications-lens/welcome.html
	- https://aws.amazon.com/serverless/
	- https://www.youtube.com/playlist?list=PLJV9303TMVKzFk1CNV_bStVZd3ZhW8dNz
	- https://www.youtube.com/watch?v=RF7x4HcQ8lM
	- https://www.youtube.com/playlist?list=PLhr1KZpdzukf1ERxT2lJnkpsmTPyG0_cC
	- https://www.youtube.com/watch?v=y-E4CUBmhW8&list=PL2yQDdvlhXf-clFIliTDBdN310hPB5twq
	- https://aws.amazon.com/about-aws/global-infrastructure/

-----------

# Learning Artifacts 
* [ ] I #should have a #diagram that breaks down common AWS functionality and associated costs >2022-01-16 
	* s3 cost to store
	* s3 cost to access
	* sts assume role ...
	* api limits and throttles
	* sns limits and throttles
	* lamda limits and throttles
	* common pattern?

---------
# Learning Resources
* [ ] Look into: repost.aws  #2022-03-10

# Learning Topics 

* [ ] Look into: But, in this case, because Parquet is columnar, Amazon Athena can read only the column that is relevant for the query being run. Because the query in question only references a single column, Athena reads only that column and can avoid reading two thirds of the file. Since Athena only reads one third of the file, it scans just 0.33TB of data from S3.  #2022-02-01

# Athena
* [ ] Look into: aws.amazon.com/athena/pricing/  #2022-02-01

# CDK
* [ ] Look into: docs.aws.amazon.com/cdk/v2/guide/use_cfn_template.html  #2022-02-20

## Redshift
* [ ] Look into: docs.aws.amazon.com/cli/latest/reference/redshift/create-cluster-parameter-group.html  #2022-02-21
* [ ] Look into: docs.aws.amazon.com/redshift/latest/mgmt/working-with-parameter-groups.html  #2022-02-21
* [ ] Look into: stackoverflow.com/questions/26215784/how-to-store-password-in-a-table-on-redshift/26216172#26216172  #2022-03-04

# VPCs
* [ ] Read up on VPCs ...

https://aws.amazon.com/elasticloadbalancing/features/ 
https://docs.aws.amazon.com/redshift/latest/dg/limitations-datashare.html
https://boto3.amazonaws.com/v1/documentation/api/latest/guide/quickstart.html#installation
https://docs.aws.amazon.com/sdkref/latest/guide/common-runtime.html
https://github.com/macbre/sql-metadata
https://github.com/cdklabs/cdk-monitoring-constructs

# --------------------

# Hosted Zones/ Dns Delegation
* [ ] Hosted Zones can delegate DNS records to other hosted zones in different accounts - Cross Account Delegating ...
	* [ ] https://stackoverflow.com/questions/66616710/how-can-i-set-up-my-hostedzone-so-that-it-delegates-to-a-parent-dns-record-in-an
* [ ] Each hosted zone has a set of its own name servers:
	* [ ] https://medium.com/@goyalsaurabh66/aws-route-53-73eb5e0a676f
	https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-route53.HostedZone.html

# AWS
 CloudFront + Lambda + Edge Stuff ...
https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-edge-delete-replicas.html
 
# Creating Hosted Zones
What is DMARC?
From https://dmarc.org :
     DMARC, which stands for “Domain-based Message Authentication, Reporting & Conformance”, is an email authentication, policy, and reporting protocol. It builds on the widely deployed SPF and DKIM protocols, adding linkage to the author ("From:") domain name, published policies for recipient handling of authentication failures, and reporting from receivers to senders, to improve and monitor protection of the domain from fraudulent email.
