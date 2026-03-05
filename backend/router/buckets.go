package router

import (
	"context"
	"encoding/json"
	"fmt"
	"khairul169/garage-webui/schema"
	"khairul169/garage-webui/utils"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

type Buckets struct{}

func (b *Buckets) GetAll(w http.ResponseWriter, r *http.Request) {
	body, err := utils.Garage.Fetch("/v2/ListBuckets", &utils.FetchOptions{})
	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	var buckets []schema.GetBucketsRes
	if err := json.Unmarshal(body, &buckets); err != nil {
		utils.ResponseError(w, err)
		return
	}

	ch := make(chan schema.Bucket, len(buckets))

	for _, bucket := range buckets {
		go func() {
			body, err := utils.Garage.Fetch(fmt.Sprintf("/v2/GetBucketInfo?id=%s", bucket.ID), &utils.FetchOptions{})

			if err != nil {
				ch <- schema.Bucket{ID: bucket.ID, GlobalAliases: bucket.GlobalAliases}
				return
			}

			var data schema.Bucket
			if err := json.Unmarshal(body, &data); err != nil {
				ch <- schema.Bucket{ID: bucket.ID, GlobalAliases: bucket.GlobalAliases}
				return
			}

			data.LocalAliases = bucket.LocalAliases
			ch <- data
		}()
	}

	res := make([]schema.Bucket, 0, len(buckets))
	for i := 0; i < len(buckets); i++ {
		res = append(res, <-ch)
	}

	utils.ResponseSuccess(w, res)
}

func (b *Buckets) GetCors(w http.ResponseWriter, r *http.Request) {
	bucket := r.PathValue("bucket")

	client, err := getS3Client(bucket, nil)

	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	cors, err := client.GetBucketCors(context.Background(), &s3.GetBucketCorsInput{
		Bucket: aws.String(bucket),
	})

	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	res := schema.BucketCors{
		AllowedOrigins: []string{},
		AllowedMethods: []string{},
		AllowedHeaders: []string{},
		ExposeHeaders:  []string{},
		MaxAgeSeconds:  nil,
	}

	res.Merge(cors.CORSRules)

	utils.ResponseSuccess(w, res)
}

func (b *Buckets) PutCors(w http.ResponseWriter, r *http.Request) {
	bucket := r.PathValue("bucket")

	var body struct {
		BucketName string
		Rule       schema.BucketCors `json:"rule"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		utils.ResponseError(w, err)
		return
	}

	client, err := getS3Client(bucket, nil)

	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	_, err = client.PutBucketCors(context.Background(), &s3.PutBucketCorsInput{
		Bucket: aws.String(bucket),
		CORSConfiguration: &types.CORSConfiguration{
			CORSRules: []types.CORSRule{body.Rule.ToType()},
		},
	})

	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	utils.ResponseSuccess(w, body.Rule)
}
