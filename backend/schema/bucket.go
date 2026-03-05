package schema

import "github.com/aws/aws-sdk-go-v2/service/s3/types"

type GetBucketsRes struct {
	ID            string       `json:"id"`
	GlobalAliases []string     `json:"globalAliases"`
	LocalAliases  []LocalAlias `json:"localAliases"`
	Created       string       `json:"created"`
}

type Bucket struct {
	ID                             string        `json:"id"`
	GlobalAliases                  []string      `json:"globalAliases"`
	LocalAliases                   []LocalAlias  `json:"localAliases"`
	WebsiteAccess                  bool          `json:"websiteAccess"`
	WebsiteConfig                  WebsiteConfig `json:"websiteConfig"`
	Keys                           []KeyElement  `json:"keys"`
	Objects                        int64         `json:"objects"`
	Bytes                          int64         `json:"bytes"`
	UnfinishedUploads              int64         `json:"unfinishedUploads"`
	UnfinishedMultipartUploads     int64         `json:"unfinishedMultipartUploads"`
	UnfinishedMultipartUploadParts int64         `json:"unfinishedMultipartUploadParts"`
	UnfinishedMultipartUploadBytes int64         `json:"unfinishedMultipartUploadBytes"`
	Quotas                         Quotas        `json:"quotas"`
	Created                        string        `json:"created"`
}

type BucketCors struct {
	AllowedOrigins []string `json:"allowedOrigins"`
	AllowedMethods []string `json:"allowedMethods"`
	AllowedHeaders []string `json:"allowedHeaders"`
	ExposeHeaders  []string `json:"exposeHeaders"`
	MaxAgeSeconds  *int32   `json:"maxAgeSeconds"`
}

func (bc *BucketCors) ToType() types.CORSRule {

	return types.CORSRule{
		AllowedOrigins: bc.AllowedOrigins,
		AllowedMethods: bc.AllowedMethods,
		AllowedHeaders: bc.AllowedHeaders,
		ExposeHeaders:  bc.ExposeHeaders,
		MaxAgeSeconds:  bc.MaxAgeSeconds,
	}
}

func (bc *BucketCors) Merge(rs []types.CORSRule) {

	for _, r := range rs {

		bc.AllowedOrigins = append(bc.AllowedOrigins, r.AllowedOrigins...)
		bc.AllowedMethods = append(bc.AllowedMethods, r.AllowedMethods...)
		bc.AllowedHeaders = append(bc.AllowedHeaders, r.AllowedHeaders...)
		bc.ExposeHeaders = append(bc.ExposeHeaders, r.ExposeHeaders...)
		bc.MaxAgeSeconds = r.MaxAgeSeconds
	}
}

type LocalAlias struct {
	AccessKeyID string `json:"accessKeyId"`
	Alias       string `json:"alias"`
}

type KeyElement struct {
	AccessKeyID        string      `json:"accessKeyId"`
	Name               string      `json:"name"`
	Permissions        Permissions `json:"permissions"`
	BucketLocalAliases []string    `json:"bucketLocalAliases"`
	SecretAccessKey    string      `json:"secretAccessKey"`
}

type Permissions struct {
	Read  bool `json:"read"`
	Write bool `json:"write"`
	Owner bool `json:"owner"`
}

type Quotas struct {
	MaxSize    int64 `json:"maxSize"`
	MaxObjects int64 `json:"maxObjects"`
}

type WebsiteConfig struct {
	IndexDocument string `json:"indexDocument"`
	ErrorDocument string `json:"errorDocument"`
}

func (p *Permissions) HasPermission(perm string) bool {
	switch perm {
	case "read":
		return p.Read
	case "write":
		return p.Write
	case "owner":
		return p.Owner
	default:
		return false
	}
}
